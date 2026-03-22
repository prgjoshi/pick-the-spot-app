require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const pino = require('pino');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');

// ─── Logger ──────────────────────────────────────────────────────────────────
// Pretty-prints in development; emits structured JSON in production so log
// aggregators (Railway, Datadog, Logtail) can parse fields automatically.
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();

app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true,
}));
app.use(express.json());

// ─── Rate limiters ───────────────────────────────────────────────────────────
// Recommendations hit Google Places (expensive) — cap at 30 req/min per IP.
const recsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many recommendation requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Photo proxy — cap at 120 req/min per IP (cards load ~10 images each).
const photoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many photo requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/groups', require('./routes/preferences'));
app.use('/api/groups', recsLimiter, require('./routes/recommendations'));

// ─── Photo proxy ─────────────────────────────────────────────────────────────
// Server-side proxy so the Google Places API key never reaches the browser.
const PHOTO_NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;
app.get('/api/photo', photoLimiter, async (req, res) => {
  const { name } = req.query;
  if (!name || !PHOTO_NAME_RE.test(name)) {
    return res.status(400).json({ error: 'Invalid photo name' });
  }
  try {
    const response = await axios.get(
      `https://places.googleapis.com/v1/${name}/media`,
      {
        params: { maxWidthPx: 800, skipHttpRedirect: true },
        headers: { 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY },
        responseType: 'stream',
      }
    );
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    logger.error({ err: err.message }, 'Photo proxy error');
    res.status(502).json({ error: 'Failed to fetch photo' });
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Global error handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info({ port: PORT }, 'Server running'));
