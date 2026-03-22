const { Pool } = require('pg');

// Neon's serverless pooler already manages a connection pool on its side.
// These settings govern the pg Pool on the *application* side:
//
//  max:                     Keep at most 10 connections open at once.
//                           Neon's free tier allows 20 concurrent connections;
//                           10 leaves headroom for multiple dyno/container replicas.
//  idleTimeoutMillis:       Release idle connections after 30 s.
//                           Neon terminates idle connections after ~5 min; releasing
//                           earlier avoids surprise "connection terminated" errors.
//  connectionTimeoutMillis: Fail fast (5 s) if all connections are busy rather than
//                           queuing requests indefinitely.
//
// When scaling horizontally (multiple server replicas), multiply max by replica count
// and ensure it stays below Neon's plan limit. For paid Neon plans, max can be raised.

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }  // verify TLS cert — Neon uses DigiCert (trusted)
    : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  // Idle client errors (e.g. Neon serverless terminating connections) are recoverable.
  // The pool creates a fresh connection on the next request — do NOT exit.
  console.error('PostgreSQL idle client error:', err.message);
});

module.exports = pool;
