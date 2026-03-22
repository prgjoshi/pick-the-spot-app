import React, { useState, useEffect } from 'react';
import { Users, MapPin, Clock, Star, Plus, Share2, DollarSign, ArrowLeft, Sparkles } from 'lucide-react';

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001/api';

async function apiFetch(method, path, body) {
  const token = localStorage.getItem('pts_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
const PRICE_LEVEL_MAP = {
  PRICE_LEVEL_FREE: 1, PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

// Maps Google place types → cuisine labels.
// Values must match the CUISINES constant below AND server/services/scoringService.js CUISINE_TYPE_MAP.
const CUISINE_TYPE_MAP = {
  italian_restaurant: 'Italian', mexican_restaurant: 'Mexican',
  chinese_restaurant: 'Chinese', japanese_restaurant: 'Japanese',
  american_restaurant: 'American', thai_restaurant: 'Thai',
  indian_restaurant: 'Indian', mediterranean_restaurant: 'Mediterranean',
  french_restaurant: 'French', korean_restaurant: 'Korean',
  sushi_restaurant: 'Japanese', pizza_restaurant: 'Italian',
  burger_restaurant: 'American',
};

function normalizeRec(r) {
  const cuisines = (r.types || []).map(t => CUISINE_TYPE_MAP[t]).filter(Boolean);
  return {
    id: r.id,
    name: r.displayName?.text || 'Unknown',
    cuisine: cuisines[0] || 'Restaurant',
    address: r.formattedAddress || '',
    rating: r.rating || null,
    ratingCount: r.userRatingCount || null,
    priceRange: PRICE_LEVEL_MAP[r.priceLevel] || null,
    image: r.photoUrl || null,
    isOpen: r.currentOpeningHours?.openNow ?? null,
    groupScore: r.groupScore,
    reasoning: r.reasoning,
    bookingUrl: r.reservationData?.bookingUrl || null,
    platform: r.reservationData?.platform || null,
    website: r.websiteUri || null,
    phone: r.nationalPhoneNumber || null,
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  /* Backgrounds */
  --bg:#F7F3EE;
  --bg2:#F5ECD7;
  --card:#FFFFFF;
  --card2:#FDFAF6;

  /* Brand */
  --accent:#C1440E;
  --accent-dk:#A03408;
  --accent-shadow:#8B2200;
  --accent-lt:#F5C4B3;
  --accent-dim:rgba(193,68,14,.1);

  --olive:#6B7C45;
  --olive-lt:#E4EDCE;
  --olive-dim:rgba(107,124,69,.1);

  --amber:#E8C285;
  --amber-lt:#FBF1DC;

  /* Text */
  --text:#3D2B1F;
  --text2:#7A6050;
  --text3:#A8947E;

  /* Borders */
  --border:rgba(61,43,31,.12);
  --border2:rgba(61,43,31,.20);

  /* Shadows */
  --sh:rgba(61,43,31,.07);
  --sh-md:rgba(61,43,31,.13);
  --sh-lg:rgba(61,43,31,.20);

  --r:14px;
  --r-sm:10px;
  --r-xs:7px;
  --r-lg:20px;
  --r-xl:28px;
  --pill:100px;
}

.pts{
  font-family:'DM Sans',sans-serif;
  background:var(--bg);
  min-height:100vh;
  color:var(--text);
  -webkit-font-smoothing:antialiased;
}

.pts ::-webkit-scrollbar{width:4px}
.pts ::-webkit-scrollbar-track{background:transparent}
.pts ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%,100%{opacity:.45}50%{opacity:.85}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}

.fade{animation:fadeUp .42s cubic-bezier(.16,1,.3,1) both}
.fade-d1{animation-delay:.07s}
.fade-d2{animation-delay:.14s}
.fade-d3{animation-delay:.21s}
.fade-d4{animation-delay:.28s}
.fade-d5{animation-delay:.35s}
.fade-d6{animation-delay:.42s}

/* ── Loading skeleton ── */
.pts-loading{
  min-height:100vh;display:flex;align-items:center;
  justify-content:center;background:var(--bg);
  flex-direction:column;gap:16px;padding:40px;
}
.skel-wrap{width:100%;max-width:460px;display:flex;flex-direction:column;gap:12px}
.skel{
  background:var(--bg2);border-radius:var(--r);
  animation:shimmer 1.1s ease infinite;
}
.skel-header{height:32px;width:60%;border-radius:var(--r-sm)}
.skel-sub{height:16px;width:40%;border-radius:var(--r-xs)}
.skel-card{height:200px}
.skel-line{height:14px;border-radius:var(--r-xs)}
.skel-line-sm{height:12px;width:70%;border-radius:var(--r-xs)}
.spin-icon{display:inline-block;animation:spin .7s linear infinite;margin-right:4px}

/* ── Buttons ── */
.btn-t,.btn-o,.btn-back,.btn-full,.btn-cta{
  font-family:'DM Sans',sans-serif;cursor:pointer;
  border:none;display:inline-flex;align-items:center;gap:8px;
  text-decoration:none;transition:transform .1s ease,box-shadow .1s ease;
}

/* Clay primary — terracotta with hard depth shadow */
.btn-t{
  background:var(--accent);color:#fff;
  padding:12px 24px;border-radius:var(--pill);
  font-size:14px;font-weight:600;
  box-shadow:0 5px 0 var(--accent-shadow);
}
.btn-t:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 7px 0 var(--accent-shadow)}
.btn-t:active:not(:disabled){transform:translateY(3px);box-shadow:0 2px 0 var(--accent-shadow)}
.btn-t:disabled{background:#C4B8AE;box-shadow:0 4px 0 #9A8F87;cursor:not-allowed}

/* Outlined secondary */
.btn-o{
  background:var(--card);color:var(--text);
  padding:12px 24px;border-radius:var(--pill);
  font-size:14px;font-weight:500;
  border:1.5px solid var(--border2)!important;
  box-shadow:0 3px 12px var(--sh);
}
.btn-o:hover{border-color:var(--accent)!important;color:var(--accent)}

.btn-back{
  background:none;color:var(--text2);
  font-size:13.5px;font-weight:400;
  padding:0;margin-bottom:32px;border:none;
}
.btn-back:hover{color:var(--text)}

/* Clay full-width */
.btn-full{
  width:100%;padding:14px;
  background:var(--accent);color:#fff;
  border-radius:var(--r);font-size:15px;font-weight:600;
  justify-content:center;
  box-shadow:0 5px 0 var(--accent-shadow);
  margin-top:6px;
}
.btn-full:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 7px 0 var(--accent-shadow)}
.btn-full:active:not(:disabled){transform:translateY(3px);box-shadow:0 2px 0 var(--accent-shadow)}
.btn-full:disabled{background:#C4B8AE;box-shadow:0 4px 0 #9A8F87;cursor:not-allowed}

/* Clay CTA — full width, used at bottom of survey */
.btn-cta{
  width:100%;padding:17px;margin-top:12px;
  background:var(--accent);color:#fff;
  border-radius:var(--pill);font-size:15.5px;font-weight:600;
  justify-content:center;letter-spacing:.1px;
  box-shadow:0 6px 0 var(--accent-shadow);
}
.btn-cta:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 0 var(--accent-shadow)}
.btn-cta:active:not(:disabled){transform:translateY(4px);box-shadow:0 2px 0 var(--accent-shadow)}
.btn-cta:disabled{background:#C4B8AE;box-shadow:0 4px 0 #9A8F87;cursor:not-allowed}

/* ── Auth split layout ── */
.auth-wrap{
  min-height:100vh;display:grid;
  grid-template-columns:1fr 1fr;
}
@media(max-width:680px){.auth-wrap{grid-template-columns:1fr}}

.auth-art{
  background:var(--bg2);
  border-right:1px solid var(--border);
  display:flex;flex-direction:column;justify-content:space-between;
  padding:44px 52px;
  position:relative;overflow:hidden;
}
@media(max-width:680px){.auth-art{display:none}}

.auth-art-logo{
  font-family:'DM Sans',sans-serif;
  font-size:14px;color:var(--text2);
  font-weight:500;letter-spacing:.1px;
}

.auth-art-body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0}
.auth-art-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(48px,5.5vw,72px);
  line-height:1.05;letter-spacing:-.5px;
  color:var(--text);margin-bottom:24px;
}
.auth-art-title i{font-style:italic;color:var(--accent)}

.auth-art-rule{height:1.5px;background:var(--border2);margin:24px 0;width:48px}
.auth-art-tagline{
  font-size:14px;color:var(--text2);
  line-height:1.75;font-weight:300;max-width:280px;
}

/* Decorative terracotta dots */
.auth-deco{
  position:absolute;bottom:-60px;right:-60px;
  width:220px;height:220px;border-radius:50%;
  background:radial-gradient(circle,rgba(193,68,14,.12) 0%,transparent 70%);
  pointer-events:none;
}
.auth-deco2{
  position:absolute;top:-40px;left:-40px;
  width:140px;height:140px;border-radius:50%;
  background:radial-gradient(circle,rgba(232,194,133,.25) 0%,transparent 70%);
  pointer-events:none;
}

.auth-form-side{
  display:flex;align-items:center;justify-content:center;
  padding:52px 48px;background:var(--card);
}
@media(max-width:680px){.auth-form-side{padding:40px 24px;background:var(--bg)}}

.form-wrap{width:100%;max-width:340px}
.form-ttl{
  font-family:'Playfair Display',serif;
  font-size:30px;font-weight:700;color:var(--text);
  margin-bottom:6px;letter-spacing:-.2px;
}
.form-sub{font-size:13.5px;color:var(--text2);margin-bottom:28px;line-height:1.65;font-weight:300}
.field{margin-bottom:16px}
.lbl{
  display:block;font-size:10.5px;font-weight:600;
  letter-spacing:1.2px;text-transform:uppercase;
  color:var(--text2);margin-bottom:7px;
}
.inp{
  width:100%;padding:12px 15px;
  background:var(--bg);border:1.5px solid var(--border);
  border-radius:var(--r-sm);
  font-family:'DM Sans',sans-serif;font-size:14.5px;color:var(--text);
  transition:all .18s;outline:none;
}
.inp::placeholder{color:var(--text3)}
.inp:focus{border-color:var(--accent);background:var(--card);box-shadow:0 0 0 4px var(--accent-dim)}
.inp-code{
  text-align:center;font-family:'DM Mono',monospace;
  font-size:26px;font-weight:500;letter-spacing:10px;padding:14px 20px;
}
.err-msg{
  font-size:13px;color:var(--accent);
  background:var(--accent-lt);
  border-left:3px solid var(--accent);
  padding:10px 14px;border-radius:0 var(--r-xs) var(--r-xs) 0;
  margin-bottom:16px;line-height:1.5;
}
.mode-link{
  width:100%;text-align:center;background:none;border:none;
  color:var(--text2);font-size:13.5px;cursor:pointer;
  padding:20px 0 0;font-family:'DM Sans',sans-serif;
  line-height:1.6;display:block;font-weight:300;
}
.mode-link b{color:var(--accent);font-weight:600}

/* ── Home ── */
.home-nav{
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 48px;
  background:var(--card);border-bottom:1px solid var(--border);
}
@media(max-width:580px){.home-nav{padding:16px 20px}}
.nav-logo{
  font-family:'Playfair Display',serif;
  font-size:19px;color:var(--text);font-weight:700;
  letter-spacing:-.2px;
}
.nav-logo i{font-style:italic;color:var(--accent)}
.nav-right{display:flex;align-items:center;gap:12px}
.nav-user{font-size:13px;color:var(--text2);font-weight:300}

.home-hero{
  padding:72px 48px 60px;
  background:linear-gradient(160deg,var(--bg2) 0%,var(--bg) 55%);
  border-bottom:1px solid var(--border);
  position:relative;overflow:hidden;
}
@media(max-width:580px){.home-hero{padding:48px 20px 40px}}

/* Soft radial accent glow */
.home-hero::before{
  content:'';position:absolute;
  top:-80px;right:-80px;width:360px;height:360px;
  background:radial-gradient(circle,rgba(193,68,14,.08) 0%,transparent 65%);
  border-radius:50%;pointer-events:none;
}
.home-hero::after{
  content:'';position:absolute;
  bottom:-60px;left:10%;width:260px;height:260px;
  background:radial-gradient(circle,rgba(232,194,133,.2) 0%,transparent 65%);
  border-radius:50%;pointer-events:none;
}

.hero-kicker{
  display:inline-flex;align-items:center;gap:8px;
  font-size:10.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;
  color:var(--accent);margin-bottom:20px;
}
.hero-kicker-dot{width:6px;height:6px;background:var(--accent);border-radius:50%}

.h-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(52px,8vw,104px);
  line-height:.95;letter-spacing:-2px;
  color:var(--text);margin-bottom:24px;
}
.h-title i{font-style:italic;color:var(--accent)}

.h-sub{
  font-size:16px;color:var(--text2);
  max-width:440px;margin-bottom:40px;
  line-height:1.75;font-weight:300;
}
.cta-row{display:flex;gap:12px;flex-wrap:wrap}

/* ── Marquee ── */
.marquee-wrap{
  overflow:hidden;padding:13px 0;
  border-bottom:1px solid var(--border);
  background:var(--card);display:flex;
}
.marquee-track{
  display:flex;white-space:nowrap;
  animation:marquee 30s linear infinite;
}
.marquee-item{
  display:inline-flex;align-items:center;gap:10px;
  font-size:10.5px;font-weight:600;letter-spacing:1.8px;
  text-transform:uppercase;color:var(--text3);padding:0 28px;
}
.marquee-sep{color:var(--accent);font-size:14px}

/* ── Features ── */
.features{padding:52px 48px 68px;max-width:920px}
@media(max-width:580px){.features{padding:36px 20px 52px}}
.features-eyebrow{
  font-size:10.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;
  color:var(--text3);margin-bottom:28px;
  display:flex;align-items:center;gap:12px;
}
.features-eyebrow::after{content:'';flex:1;height:1.5px;background:var(--border);max-width:160px}
.feat-list{display:flex;flex-direction:column;gap:0}
.feat-item{
  display:grid;grid-template-columns:64px 1fr;
  align-items:start;gap:20px;
  padding:22px 0;border-top:1px solid var(--border);
}
.feat-item:last-child{border-bottom:1px solid var(--border)}
.feat-num{
  font-family:'DM Mono',monospace;font-size:11px;
  color:var(--text3);padding-top:2px;letter-spacing:.5px;
}
.feat-ttl{font-family:'DM Sans',sans-serif;font-size:15.5px;font-weight:600;margin-bottom:4px;letter-spacing:-.1px;color:var(--text)}
.feat-dsc{font-size:13.5px;color:var(--text2);line-height:1.7;font-weight:300}

/* ── Create / Join form views ── */
.form-view{
  min-height:100vh;display:flex;align-items:center;justify-content:center;
  padding:40px 24px;
  background:linear-gradient(160deg,var(--bg2) 0%,var(--bg) 60%);
}

/* ── Session / Survey ── */
.sess-view{min-height:100vh;background:var(--bg);padding:36px 48px 80px}
@media(max-width:580px){.sess-view{padding:28px 20px 64px}}
.sess-wrap{max-width:620px;margin:0 auto}

.sess-hd{
  margin-bottom:32px;
  padding-bottom:24px;
  border-bottom:1px solid var(--border);
  display:flex;align-items:flex-start;justify-content:space-between;
  flex-wrap:wrap;gap:12px;
}
.sess-ttl{
  font-family:'Playfair Display',serif;
  font-size:42px;font-weight:700;line-height:.95;
  letter-spacing:-.5px;color:var(--text);
}
.sess-ttl-sub{
  font-size:13px;color:var(--text2);margin-top:7px;font-weight:300;
}
.inv-badge{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--card);border:1.5px solid var(--border);
  border-radius:var(--pill);padding:8px 16px;
  font-size:12.5px;color:var(--text2);cursor:pointer;
  transition:all .18s;white-space:nowrap;
  font-family:'DM Sans',sans-serif;
  box-shadow:0 2px 8px var(--sh);
}
.inv-badge:hover{border-color:var(--accent);color:var(--accent)}
.inv-code{font-family:'DM Mono',monospace;font-weight:500;font-size:12px;color:var(--accent);letter-spacing:2.5px}

/* Survey section cards — white on warm cream */
.sec{
  background:var(--card);
  border-radius:var(--r-lg);
  border:1px solid var(--border);
  padding:22px 24px;margin-bottom:10px;
  box-shadow:0 2px 12px var(--sh);
  transition:box-shadow .2s;
}
.sec:hover{box-shadow:0 4px 20px var(--sh-md)}
.sec-hd{
  display:flex;align-items:baseline;gap:12px;margin-bottom:18px;
}
.sec-num{
  font-family:'DM Mono',monospace;font-size:10px;
  color:var(--text3);letter-spacing:.5px;flex-shrink:0;
}
.sec-ttl{
  font-size:11px;font-weight:600;letter-spacing:1.2px;
  text-transform:uppercase;color:var(--text2);
}

/* Stacked avatars */
.avatar-stack{display:flex;align-items:center}
.avatar{
  width:36px;height:36px;border-radius:50%;
  background:var(--amber);
  border:2.5px solid var(--card);
  display:flex;align-items:center;justify-content:center;
  color:var(--text);font-weight:700;font-size:13px;
  font-family:'DM Sans',sans-serif;
  flex-shrink:0;
  box-shadow:0 2px 6px rgba(61,43,31,.18);
}
.avatar-name{font-weight:400;font-size:14px;flex:1;color:var(--text)}
.host-tag{
  font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;
  color:var(--accent);background:var(--accent-lt);
  padding:2px 9px;border-radius:var(--pill);
  border:1px solid rgba(193,68,14,.25);
}

.sess-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:480px){.sess-grid{grid-template-columns:1fr}}
.sf{display:flex;flex-direction:column;gap:6px}
.sess-inp{
  width:100%;padding:11px 14px;
  background:var(--bg);border:1.5px solid var(--border);
  border-radius:var(--r-sm);
  font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);
  transition:all .18s;outline:none;
}
.sess-inp::placeholder{color:var(--text3)}
.sess-inp:focus{border-color:var(--accent);background:var(--card);box-shadow:0 0 0 4px var(--accent-dim)}
.sess-inp::-webkit-calendar-picker-indicator{opacity:.5;cursor:pointer}
.sel{
  width:100%;padding:11px 14px;
  background:var(--bg);border:1.5px solid var(--border);
  border-radius:var(--r-sm);
  font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);
  transition:all .18s;outline:none;cursor:pointer;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237A6050' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center;padding-right:30px;
}
.sel:focus{border-color:var(--accent);background-color:var(--card);box-shadow:0 0 0 4px var(--accent-dim)}
.sel option{color:var(--text)}

.sec-hint{font-size:13px;color:var(--text2);margin-bottom:14px;line-height:1.6;font-weight:300}

.loc-display{
  font-size:13.5px;color:var(--text2);font-weight:300;
  display:flex;align-items:center;gap:7px;
  padding:11px 14px;
  background:var(--bg);border:1.5px solid var(--border);
  border-radius:var(--r-sm);
}

/* ── Party size stepper ── */
.stepper{
  display:inline-flex;align-items:center;
  background:var(--bg);border:1.5px solid var(--border);
  border-radius:var(--r-sm);overflow:hidden;
}
.stepper-btn{
  width:42px;height:42px;background:transparent;border:none;
  color:var(--text2);cursor:pointer;
  font-size:22px;font-weight:300;
  font-family:'DM Sans',sans-serif;
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;
}
.stepper-btn:hover:not(:disabled){background:var(--accent-lt);color:var(--accent)}
.stepper-btn:disabled{opacity:.3;cursor:not-allowed}
.stepper-val{
  min-width:52px;text-align:center;
  font-family:'DM Mono',monospace;
  font-size:15px;font-weight:500;color:var(--text);
  border-left:1.5px solid var(--border);
  border-right:1.5px solid var(--border);
  height:42px;line-height:42px;
}
.stepper-unit{font-size:13px;color:var(--text2);margin-left:12px;font-weight:300}

/* ── Cuisine / dietary chips ── */
.chip-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(118px,1fr));
  gap:8px;
}
.chip{
  padding:9px 14px;border-radius:var(--r-sm);
  font-size:13px;font-weight:400;
  background:transparent;color:var(--text2);
  border:1.5px solid var(--border);
  cursor:pointer;transition:all .15s;user-select:none;
  font-family:'DM Sans',sans-serif;
  text-align:center;width:100%;
}
.chip:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-dim)}
.chip.on{background:var(--accent-lt);color:var(--accent);border-color:rgba(193,68,14,.4)}
.chip.sage:hover{border-color:var(--olive);color:var(--olive);background:var(--olive-dim)}
.chip.sage.on{background:var(--olive-lt);color:var(--olive);border-color:rgba(107,124,69,.4)}
.chip.excl:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-dim);opacity:.8}
.chip.excl.on{background:var(--accent-lt);color:var(--accent);border-color:rgba(193,68,14,.35);opacity:.85}

/* ── Budget segmented track ── */
.budget-track{
  display:flex;gap:0;
  background:var(--bg);border:1.5px solid var(--border);
  border-radius:var(--r-sm);overflow:hidden;
}
.budget-opt{
  flex:1;padding:13px 6px;text-align:center;
  cursor:pointer;transition:all .15s;
  background:transparent;border:none;
  border-right:1.5px solid var(--border);
  font-family:'DM Sans',sans-serif;
}
.budget-opt:last-child{border-right:none}
.budget-opt .b-sym{font-size:14px;font-weight:700;color:var(--text2);display:block}
.budget-opt .b-lbl{font-size:9.5px;font-weight:500;color:var(--text3);text-transform:uppercase;letter-spacing:.9px;display:block;margin-top:4px}
.budget-opt.on{background:var(--accent-lt)}
.budget-opt.on .b-sym{color:var(--accent)}
.budget-opt.on .b-lbl{color:var(--accent);opacity:.75}
.budget-opt:hover:not(.on){background:rgba(193,68,14,.05)}
.budget-opt:hover:not(.on) .b-sym{color:var(--accent)}

/* ── Recommendations ── */
.recs-view{min-height:100vh;background:var(--bg);padding:36px 48px 80px}
@media(max-width:580px){.recs-view{padding:28px 20px 64px}}
.recs-wrap{max-width:680px;margin:0 auto}

.recs-hd{margin-bottom:28px}
.recs-eyebrow{
  font-size:10.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;
  color:var(--text3);display:flex;align-items:center;gap:10px;margin-bottom:10px;
}
.recs-eyebrow-dot{width:5px;height:5px;background:var(--accent);border-radius:50%}
.recs-ttl{
  font-family:'Playfair Display',serif;
  font-size:52px;font-weight:700;
  letter-spacing:-.8px;line-height:.9;
  color:var(--text);margin-bottom:20px;
}
.recs-ttl i{font-style:italic;color:var(--accent)}

.recs-meta{
  display:flex;align-items:center;flex-wrap:wrap;
  background:var(--card);border:1px solid var(--border);
  border-radius:var(--pill);
  padding:0;overflow:hidden;width:fit-content;
  box-shadow:0 2px 8px var(--sh);
}
.recs-meta span{
  display:flex;align-items:center;gap:6px;
  font-size:12.5px;color:var(--text2);
  padding:9px 16px;
  border-right:1px solid var(--border);
  font-weight:300;
}
.recs-meta span:last-child{border-right:none}

/* ── Glassmorphism rec card ── */
.rec-card{
  position:relative;
  border-radius:var(--r-xl);
  overflow:hidden;
  height:260px;
  margin-bottom:12px;
  box-shadow:0 4px 24px var(--sh-md);
  cursor:pointer;
  transition:transform .22s ease,box-shadow .22s ease;
  animation:scaleIn .4s cubic-bezier(.16,1,.3,1) both;
}
.rec-card:hover{
  transform:translateY(-4px);
  box-shadow:0 16px 48px var(--sh-lg);
}
.rec-card:nth-child(1){animation-delay:.05s}
.rec-card:nth-child(2){animation-delay:.1s}
.rec-card:nth-child(3){animation-delay:.15s}
.rec-card:nth-child(4){animation-delay:.2s}
.rec-card:nth-child(5){animation-delay:.25s}

.rec-img{
  width:100%;height:100%;object-fit:cover;display:block;
  filter:brightness(.82) saturate(1.1);
  transition:filter .3s;
}
.rec-card:hover .rec-img{filter:brightness(.92) saturate(1.15)}

.rec-img-placeholder{
  width:100%;height:100%;
  background:linear-gradient(145deg,var(--bg2),var(--amber-lt));
  display:flex;align-items:center;justify-content:center;
  font-size:48px;opacity:.5;
}

/* Editorial rank — top left */
.rec-rank{
  position:absolute;top:14px;left:18px;
  font-family:'Playfair Display',serif;
  font-size:13px;font-weight:700;
  color:rgba(247,243,238,.8);
  background:rgba(61,43,31,.35);
  border-radius:var(--pill);
  padding:3px 10px;
  backdrop-filter:blur(6px);
  -webkit-backdrop-filter:blur(6px);
  letter-spacing:.3px;
}

/* Glassmorphism overlay at bottom */
.rec-glass{
  position:absolute;
  bottom:0;left:0;right:0;
  padding:16px 20px;
  background:rgba(247,243,238,.72);
  backdrop-filter:blur(24px) saturate(1.5);
  -webkit-backdrop-filter:blur(24px) saturate(1.5);
  border-top:1px solid rgba(247,243,238,.55);
}
.rec-glass-top{
  display:flex;justify-content:space-between;
  align-items:flex-start;gap:12px;margin-bottom:8px;
}
.rec-name{
  font-family:'Playfair Display',serif;
  font-size:21px;font-weight:700;line-height:1.1;
  color:var(--text);letter-spacing:-.2px;
}
.rec-meta-row{display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap}
.rec-cuisine-pill{
  font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;
  color:var(--accent);background:rgba(193,68,14,.12);
  padding:2px 8px;border-radius:var(--pill);
}
.rec-addr{font-size:12px;color:var(--text2);font-weight:300}

.score-box{
  background:var(--accent);
  border-radius:var(--r-sm);
  padding:7px 12px;text-align:center;
  flex-shrink:0;min-width:58px;
  box-shadow:0 3px 0 var(--accent-shadow);
}
.score-num{
  font-family:'Playfair Display',serif;
  font-size:26px;font-weight:700;color:#fff;
  line-height:1;display:block;
}
.score-lbl{
  font-size:8px;letter-spacing:1px;text-transform:uppercase;
  color:rgba(255,255,255,.7);font-weight:600;
}

.rec-glass-bottom{
  display:flex;justify-content:space-between;
  align-items:center;gap:12px;flex-wrap:wrap;
}
.rec-stats{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.stat{display:flex;align-items:center;gap:4px;font-size:12.5px;color:var(--text2);font-weight:300}
.divider-dot{width:3px;height:3px;border-radius:50%;background:var(--border2)}

.avail{padding:2px 9px;border-radius:var(--pill);font-size:10px;font-weight:600;letter-spacing:.3px}
.avail.y{background:var(--olive-lt);color:var(--olive);border:1px solid rgba(107,124,69,.3)}
.avail.n{background:var(--accent-lt);color:var(--accent);border:1px solid rgba(193,68,14,.25)}
.avail.u{background:var(--amber-lt);color:var(--text2);border:1px solid var(--border)}

.rec-acts{display:flex;gap:7px;align-items:center;flex-shrink:0}
.act{
  padding:7px 16px;border-radius:var(--pill);
  font-size:12.5px;font-weight:600;
  font-family:'DM Sans',sans-serif;cursor:pointer;border:none;
  transition:all .15s;
}
.act-view{
  background:var(--accent);color:#fff;
  text-decoration:none;display:inline-flex;align-items:center;
  box-shadow:0 3px 0 var(--accent-shadow);
}
.act-view:hover{background:var(--accent-dk);transform:translateY(-1px)}
.act-view:active{transform:translateY(2px);box-shadow:0 1px 0 var(--accent-shadow)}
.act-res{
  background:var(--card);color:var(--text);
  border:1.5px solid var(--border2)!important;
  text-decoration:none;display:inline-flex;align-items:center;
  box-shadow:0 2px 6px var(--sh);
}
.act-res:hover{border-color:var(--accent)!important;color:var(--accent)}

/* Reasoning tooltip */
.reasoning{
  font-size:12.5px;color:var(--text2);
  font-style:italic;line-height:1.6;
  margin:8px 0 0;font-weight:300;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}

.empty{text-align:center;padding:72px 24px;color:var(--text2)}
.empty-icon{font-size:44px;display:block;margin-bottom:16px;opacity:.5}

@media(max-width:580px){
  .sess-grid{grid-template-columns:1fr}
  .h-title{font-size:50px}
  .recs-ttl{font-size:40px}
  .recs-meta{flex-direction:column;width:100%;border-radius:var(--r)}
  .recs-meta span{border-right:none;border-bottom:1px solid var(--border)}
  .recs-meta span:last-child{border-bottom:none}
  .rec-card{height:220px}
  .rec-glass{padding:12px 16px}
  .rec-name{font-size:18px}
}
`;

if (!document.getElementById('pts-css')) {
  const s = document.createElement('style');
  s.id = 'pts-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ─── Static preference data ───────────────────────────────────────────────────
// CUISINES and DIETARY must stay in sync with server/routes/preferences.js VALID_CUISINES / VALID_DIETARY allowlists.
const CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'American',
  'Thai', 'Indian', 'Mediterranean', 'French', 'Korean',
];

const DIETARY = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher',
];

// ─── Views (module-level to prevent remount on parent re-render) ──────────────

const AuthView = ({ onAuth }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null); setLoading(true);
    try {
      const body = mode === 'register' ? { name, email, password } : { email, password };
      const data = await apiFetch('POST', `/auth/${mode}`, body);
      localStorage.setItem('pts_token', data.token);
      onAuth(data.user);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="auth-wrap fade">
      {/* Art panel */}
      <div className="auth-art">
        <div className="auth-art-logo">Pick the Spot</div>
        <div className="auth-art-body">
          <div className="auth-art-title">
            Find your<br /><i>perfect</i><br />spot.
          </div>
          <div className="auth-art-rule" />
          <p className="auth-art-tagline">
            End the "where should we eat?" debate. Smart picks your whole group will love.
          </p>
        </div>
        <div className="auth-deco" />
        <div className="auth-deco2" />
      </div>

      {/* Form panel */}
      <div className="auth-form-side">
        <div className="form-wrap">
          <div className="form-ttl">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
          <div className="form-sub">{mode === 'login' ? 'Sign in to find your next great meal.' : 'Join to start finding spots your group loves.'}</div>
          {error && <div className="err-msg">{error}</div>}
          {mode === 'register' && (
            <div className="field">
              <label className="lbl">Your Name</label>
              <input className="inp" type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey} placeholder="Jane Smith" autoFocus />
            </div>
          )}
          <div className="field">
            <label className="lbl">Email</label>
            <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} placeholder="you@example.com" autoFocus={mode === 'login'} />
          </div>
          <div className="field">
            <label className="lbl">Password</label>
            <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} placeholder="••••••••" />
          </div>
          <button className="btn-full" onClick={submit} disabled={loading || !email || !password || (mode === 'register' && !name)}>
            {loading ? <><span className="spin-icon">⟳</span> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
          <button className="mode-link" onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); }}>
            {mode === 'login' ? <>No account? <b>Create one</b></> : <>Already have an account? <b>Sign in</b></>}
          </button>
        </div>
      </div>
    </div>
  );
};

const HomeView = ({ user, onCreateGroup, onJoinGroup }) => (
  <div className="fade">
    <nav className="home-nav">
      <div className="nav-logo">Pick <i>the</i> Spot</div>
      <div className="nav-right">
        {user && <span className="nav-user">{user.name}</span>}
        <button className="btn-t fade-d1" onClick={onCreateGroup}><Plus size={14} /> New Group</button>
        <button className="btn-o fade-d2" onClick={onJoinGroup}>Join</button>
      </div>
    </nav>

    <div className="home-hero">
      <div className="hero-kicker fade-d1">
        <span className="hero-kicker-dot" />
        Group Dining, Decided
      </div>
      <h1 className="h-title fade-d2">
        Find your<br /><i>perfect</i> spot.
      </h1>
      <p className="h-sub fade-d3">
        End the "where should we eat?" debate. Get restaurant picks your whole group will love, scored by everyone's preferences.
      </p>
      <div className="cta-row fade-d4">
        <button className="btn-t" onClick={onCreateGroup}><Plus size={14} /> Create a Group</button>
        <button className="btn-o" onClick={onJoinGroup}><Users size={14} /> Join a Group</button>
      </div>
    </div>

    <div className="marquee-wrap">
      <div className="marquee-track">
        {[
          'Group Consensus', 'Smart Scoring', 'Real Restaurants', 'Dietary Preferences',
          'Instant Reservations', 'No More Debates', 'Group Consensus', 'Smart Scoring',
          'Real Restaurants', 'Dietary Preferences', 'Instant Reservations', 'No More Debates',
        ].map((text, i) => (
          <span key={i} className="marquee-item">
            {text} <span className="marquee-sep">·</span>
          </span>
        ))}
      </div>
    </div>

    <div className="features fade-d5">
      <div className="features-eyebrow">How it works</div>
      <div className="feat-list">
        {[
          { num: '01', title: 'Set your group', desc: "Share an invite code. Everyone adds their tastes, dietary needs, and budget — no back-and-forth texting." },
          { num: '02', title: 'Smart scoring', desc: 'Our algorithm weighs cuisine preferences, price range, distance, ratings, and dietary restrictions across the whole group.' },
          { num: '03', title: 'Book instantly', desc: 'Recommendations link directly to OpenTable or Resy with your party size and time pre-filled.' },
        ].map(f => (
          <div className="feat-item" key={f.num}>
            <div className="feat-num">{f.num}</div>
            <div>
              <div className="feat-ttl">{f.title}</div>
              <div className="feat-dsc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CreateGroupView = ({ onBack, onCreate, loading, error }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  return (
    <div className="form-view fade">
      <div className="form-wrap" style={{ maxWidth: '380px' }}>
        <button className="btn-back" onClick={onBack}><ArrowLeft size={14} /> Back</button>
        <div className="form-ttl">New Group</div>
        <div className="form-sub">Name your group and set the area you're dining in.</div>
        {error && <div className="err-msg">{error}</div>}
        <div className="field">
          <label className="lbl">Group Name</label>
          <input className="inp" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Date Night, Team Lunch" autoFocus />
        </div>
        <div className="field">
          <label className="lbl">Dining Area</label>
          <input className="inp" type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Downtown Chicago, SoHo NYC" />
        </div>
        <button className="btn-full" onClick={() => onCreate(name, location)} disabled={loading || !name.trim() || !location.trim()}>
          {loading ? <><span className="spin-icon">⟳</span> Creating…</> : 'Create Group'}
        </button>
      </div>
    </div>
  );
};

const JoinGroupView = ({ onBack, onJoin, loading, error }) => {
  const [code, setCode] = useState('');
  return (
    <div className="form-view fade">
      <div className="form-wrap" style={{ maxWidth: '380px' }}>
        <button className="btn-back" onClick={onBack}><ArrowLeft size={14} /> Back</button>
        <div className="form-ttl">Join Group</div>
        <div className="form-sub">Enter the 6-character invite code from your group.</div>
        {error && <div className="err-msg">{error}</div>}
        <div className="field">
          <label className="lbl">Invite Code</label>
          <input className="inp inp-code" type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} autoFocus />
        </div>
        <button className="btn-full" onClick={() => onJoin(code)} disabled={loading || code.length !== 6}>
          {loading ? <><span className="spin-icon">⟳</span> Joining…</> : 'Join Group'}
        </button>
      </div>
    </div>
  );
};

const GroupSessionView = ({ group, members, prefs, session, onPrefsChange, onSessionChange, onGetRecs, loading, error, onBack }) => (
  <div className="sess-view fade">
    <div className="sess-wrap">
      <button className="btn-back" onClick={onBack}><ArrowLeft size={14} /> Back</button>

      <div className="sess-hd">
        <div>
          <div className="sess-ttl">{group?.name}</div>
          <div className="sess-ttl-sub">Set preferences · {group?.location}</div>
        </div>
        <button className="inv-badge" onClick={() => navigator.clipboard?.writeText(group?.invite_code || group?.inviteCode)}>
          <Share2 size={11} /> Invite
          <span className="inv-code">{group?.invite_code || group?.inviteCode}</span>
        </button>
      </div>

      {/* 01 — Who's coming */}
      <div className="sec">
        <div className="sec-hd">
          <span className="sec-num">01</span>
          <span className="sec-ttl">Who's coming</span>
        </div>
        <div className="avatar-stack" style={{ marginBottom: members.length > 0 ? 16 : 0 }}>
          {members.map((m, i) => (
            <div key={m.id} className="avatar" style={{ marginLeft: i > 0 ? -10 : 0, zIndex: members.length - i }}>
              {m.name.charAt(0).toUpperCase()}
            </div>
          ))}
          <span style={{ marginLeft: 14, fontSize: 13, color: 'var(--text2)', fontWeight: 300 }}>
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </span>
        </div>
        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="avatar-name">{m.name}</span>
            {(m.is_creator || m.isCreator) && <span className="host-tag">Host</span>}
          </div>
        ))}
      </div>

      {/* 02 — Date & time */}
      <div className="sec">
        <div className="sec-hd">
          <span className="sec-num">02</span>
          <span className="sec-ttl">Date & time</span>
        </div>
        <div className="sess-grid">
          <div className="sf">
            <label className="lbl">Date</label>
            <input className="sess-inp" type="date" value={session.date} onChange={e => onSessionChange({ ...session, date: e.target.value })} />
          </div>
          <div className="sf">
            <label className="lbl">Time</label>
            <input className="sess-inp" type="time" value={session.time} onChange={e => onSessionChange({ ...session, time: e.target.value })} />
          </div>
          <div className="sf" style={{ gridColumn: '1 / -1' }}>
            <label className="lbl">Party size</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="stepper">
                <button className="stepper-btn" disabled={session.partySize <= 1}
                  onClick={() => onSessionChange({ ...session, partySize: Math.max(1, session.partySize - 1) })}>−</button>
                <div className="stepper-val">{session.partySize}</div>
                <button className="stepper-btn" disabled={session.partySize >= 20}
                  onClick={() => onSessionChange({ ...session, partySize: Math.min(20, session.partySize + 1) })}>+</button>
              </div>
              <span className="stepper-unit">{session.partySize === 1 ? 'person' : 'people'}</span>
            </div>
          </div>
          <div className="sf" style={{ gridColumn: '1 / -1' }}>
            <label className="lbl">Area</label>
            <div className="loc-display"><MapPin size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />{group?.location}</div>
          </div>
        </div>
      </div>

      {/* 03 — Preferred cuisines */}
      <div className="sec">
        <div className="sec-hd">
          <span className="sec-num">03</span>
          <span className="sec-ttl">Preferred cuisines</span>
        </div>
        <div className="chip-grid">
          {CUISINES.map(name => {
            const on = prefs.cuisines.includes(name);
            return (
              <button key={name} className={`chip ${on ? 'on' : ''}`}
                onClick={() => {
                  if (on) {
                    onPrefsChange({ ...prefs, cuisines: prefs.cuisines.filter(c => c !== name) });
                  } else {
                    onPrefsChange({ ...prefs, cuisines: [...prefs.cuisines, name], excludedCuisines: prefs.excludedCuisines.filter(c => c !== name) });
                  }
                }}>
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 04 — Budget */}
      <div className="sec">
        <div className="sec-hd">
          <span className="sec-num">04</span>
          <span className="sec-ttl">Budget</span>
        </div>
        <div className="budget-track">
          {[{ v: 1, l: '$', s: 'Budget' }, { v: 2, l: '$$', s: 'Casual' }, { v: 3, l: '$$$', s: 'Upscale' }, { v: 4, l: '$$$$', s: 'Fine dining' }].map(({ v, l, s }) => (
            <button key={v} className={`budget-opt ${prefs.priceRange[1] >= v ? 'on' : ''}`}
              onClick={() => onPrefsChange({ ...prefs, priceRange: [1, v] })}>
              <span className="b-sym">{l}</span>
              <span className="b-lbl">{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 05 — Dietary needs */}
      <div className="sec">
        <div className="sec-hd">
          <span className="sec-num">05</span>
          <span className="sec-ttl">Dietary needs</span>
        </div>
        <div className="chip-grid">
          {DIETARY.map(name => {
            const on = prefs.dietaryRestrictions.includes(name);
            return (
              <button key={name} className={`chip sage ${on ? 'on' : ''}`}
                onClick={() => onPrefsChange({ ...prefs, dietaryRestrictions: on ? prefs.dietaryRestrictions.filter(d => d !== name) : [...prefs.dietaryRestrictions, name] })}>
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 06 — Not interested in */}
      <div className="sec">
        <div className="sec-hd">
          <span className="sec-num">06</span>
          <span className="sec-ttl">Not interested in</span>
        </div>
        <p className="sec-hint">These cuisines will be filtered out of your results entirely.</p>
        <div className="chip-grid">
          {CUISINES.map(name => {
            const on = prefs.excludedCuisines.includes(name);
            return (
              <button key={name} className={`chip excl ${on ? 'on' : ''}`}
                onClick={() => {
                  if (on) {
                    onPrefsChange({ ...prefs, excludedCuisines: prefs.excludedCuisines.filter(c => c !== name) });
                  } else {
                    onPrefsChange({ ...prefs, excludedCuisines: [...prefs.excludedCuisines, name], cuisines: prefs.cuisines.filter(c => c !== name) });
                  }
                }}>
                {on ? '× ' : ''}{name}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="err-msg" style={{ margin: '16px 0' }}>{error}</div>}

      <button className="btn-cta" onClick={onGetRecs} disabled={loading}>
        {loading ? <><span className="spin-icon">⟳</span> Searching…</> : <><Sparkles size={16} /> Find Our Spot</>}
      </button>
    </div>
  </div>
);

const RecommendationsView = ({ recs, session, group, onBack }) => (
  <div className="recs-view fade">
    <div className="recs-wrap">
      <button className="btn-back" onClick={onBack}><ArrowLeft size={14} /> Back to Group</button>

      <div className="recs-hd">
        <div className="recs-eyebrow">
          <span className="recs-eyebrow-dot" />
          Scored for your group
        </div>
        <div className="recs-ttl">Top <i>Picks</i></div>
        <div className="recs-meta">
          {group?.location && <span><MapPin size={11} /> {group.location}</span>}
          {session.partySize && <span><Users size={11} /> {session.partySize} people</span>}
          {session.date && <span><Clock size={11} /> {session.date}{session.time && ` · ${session.time}`}</span>}
        </div>
      </div>

      {recs.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🍽️</span>
          <p>No spots found — try a different location or broader preferences.</p>
        </div>
      ) : recs.map((r, i) => (
        <div className="rec-card" key={r.id}>
          {r.image
            ? <img src={r.image} alt={r.name} className="rec-img" />
            : <div className="rec-img-placeholder">🍽️</div>}

          <div className="rec-rank">#{i + 1}</div>

          <div className="rec-glass">
            <div className="rec-glass-top">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="rec-name">{r.name}</div>
                <div className="rec-meta-row">
                  <span className="rec-cuisine-pill">{r.cuisine}</span>
                  {r.address && <span className="rec-addr">{r.address}</span>}
                </div>
              </div>
              <div className="score-box">
                <span className="score-num">{r.groupScore}</span>
                <span className="score-lbl">match</span>
              </div>
            </div>

            <div className="rec-glass-bottom">
              <div className="rec-stats">
                {r.rating && <span className="stat"><Star size={12} fill="var(--accent)" stroke="var(--accent)" /> {r.rating}{r.ratingCount ? ` (${r.ratingCount.toLocaleString()})` : ''}</span>}
                {r.priceRange && <><span className="divider-dot" /><span className="stat">{'$'.repeat(r.priceRange)}</span></>}
                {r.isOpen !== null && (
                  <><span className="divider-dot" /><span className={`avail ${r.isOpen === true ? 'y' : r.isOpen === false ? 'n' : 'u'}`}>
                    {r.isOpen === true ? 'Open Now' : r.isOpen === false ? 'Closed' : 'Hours Unknown'}
                  </span></>
                )}
              </div>
              <div className="rec-acts">
                {r.website && (
                  <a href={r.website} target="_blank" rel="noopener noreferrer" className="act act-view">Details</a>
                )}
                {r.bookingUrl && (
                  <a href={r.bookingUrl} target="_blank" rel="noopener noreferrer" className="act act-res">
                    {r.platform === 'opentable' ? 'OpenTable' : r.platform === 'resy' ? 'Resy' : r.platform === 'tock' ? 'Tock' : 'Reserve'}
                  </a>
                )}
              </div>
            </div>

            {r.reasoning && <p className="reasoning">"{r.reasoning}"</p>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Root ─────────────────────────────────────────────────────────────────────
const PickTheSpotApp = () => {
  const [view, setView] = useState('loading');
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [prefs, setPrefs] = useState({ cuisines: [], priceRange: [1, 4], dietaryRestrictions: [], excludedCuisines: [] });
  const [recs, setRecs] = useState([]);
  const [session, setSession] = useState({ date: '', time: '', partySize: 2 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('pts_token');
    if (!token) { setView('auth'); return; }
    apiFetch('GET', '/auth/me')
      .then(u => { setUser(u); setView('home'); })
      .catch(() => { localStorage.removeItem('pts_token'); setView('auth'); });
  }, []);

  const handleAuth = (u) => { setUser(u); setView('home'); };

  const createGroup = async (name, location) => {
    setLoading(true); setError(null);
    try {
      const g = await apiFetch('POST', '/groups', { name, location, party_size: session.partySize });
      setGroup(g);
      setMembers([{ id: user.id, name: user.name, email: user.email, is_creator: true }]);
      setView('group-session');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const joinGroup = async (code) => {
    setLoading(true); setError(null);
    try {
      const g = await apiFetch('POST', '/groups/join', { invite_code: code });
      const full = await apiFetch('GET', `/groups/${g.id}`);
      setGroup(g);
      setMembers(full.members || []);
      setView('group-session');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const getRecommendations = async () => {
    setLoading(true); setError(null);
    try {
      if (session.date || session.time) {
        await apiFetch('PUT', `/groups/${group.id}/session`, {
          session_date: session.date || null,
          session_time: session.time || null,
          party_size: session.partySize,
        }).catch((err) => {
          // Non-creators get 403 on PUT /session — that's expected; swallow it.
          // Re-throw anything else so the outer try/catch surfaces real errors.
          if (!err.message?.includes('403')) throw err;
        });
      }
      await apiFetch('PUT', `/groups/${group.id}/preferences`, {
        cuisines: prefs.cuisines,
        price_min: prefs.priceRange[0],
        price_max: prefs.priceRange[1],
        dietary_restrictions: prefs.dietaryRestrictions,
        excluded_cuisines: prefs.excludedCuisines,
      });
      const data = await apiFetch('GET', `/groups/${group.id}/recommendations`);
      setRecs((data.recommendations || []).map(normalizeRec));
      setView('recommendations');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (view === 'loading') {
    return (
      <div className="pts pts-loading">
        <div className="skel-wrap">
          <div className="skel skel-header" />
          <div className="skel skel-sub" />
          <div className="skel skel-card" />
          <div className="skel skel-line" />
          <div className="skel skel-line-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="pts">
      {view === 'auth' && <AuthView onAuth={handleAuth} />}
      {view === 'home' && <HomeView user={user} onCreateGroup={() => { setError(null); setView('create-group'); }} onJoinGroup={() => { setError(null); setView('join-group'); }} />}
      {view === 'create-group' && <CreateGroupView onBack={() => setView('home')} onCreate={createGroup} loading={loading} error={error} />}
      {view === 'join-group' && <JoinGroupView onBack={() => setView('home')} onJoin={joinGroup} loading={loading} error={error} />}
      {view === 'group-session' && <GroupSessionView group={group} members={members} prefs={prefs} session={session} onPrefsChange={setPrefs} onSessionChange={setSession} onGetRecs={getRecommendations} loading={loading} error={error} onBack={() => setView('home')} />}
      {view === 'recommendations' && <RecommendationsView recs={recs} session={session} group={group} onBack={() => setView('group-session')} />}
    </div>
  );
};

export default PickTheSpotApp;
