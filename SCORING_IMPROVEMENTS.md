# Scoring Algorithm — Planned Improvements

Research basis: multi-criteria restaurant recommendation literature (Masthoff 2015; Carbonell & Goldstein 1998; Evan Miller; Wolt Transparency Report 2024; ScienceDirect 2024).

---

## Implemented

### ✅ Bayesian-Adjusted Rating (March 2026)
**File:** `server/services/scoringService.js`  
**What:** Replaced raw `(rating - 1) / 4` with a Bayesian-adjusted average that pulls low-review-count restaurants toward the global mean before scoring.  
**Formula:** `BAR = (C × M + N × R) / (C + N)` where C=50, M=4.2, N=review count, R=raw rating.  
**Why:** A restaurant with 3 reviews averaging 5.0 was outranking a beloved institution with 800 reviews averaging 4.6. BAR corrects this review-count bias (same approach as IMDb Top 250).  
**Tune:** Increase `BAYES_C` as the dataset grows (target: mean review count across all fetched restaurants). Recalculate `GLOBAL_MEAN_RATING` periodically from real data.

---

## Planned

### 1. Gaussian Distance Decay
**File:** `server/services/scoringService.js` → `distanceScore()`  
**Current:** Linear `max(0, 1 - d/10)` — hard zero cliff at 10 km, too punishing at mid-range.  
**Proposed:** Gaussian decay — full score within 500 m, smooth bell-curve dropoff, ~50% score at 3.5 km, near-zero beyond 8 km.  
**Formula:**
```js
const OFFSET_KM = 0.5;
const SCALE_KM  = 3;
const DECAY     = 0.5;
const effective = Math.max(0, km - OFFSET_KM);
const sigma2    = -(SCALE_KM ** 2) / (2 * Math.log(DECAY));
return Math.exp(-(effective ** 2) / (2 * sigma2));
```
**Research:** Negative exponential and Gaussian functions best describe observed food-retail distance-decay behavior (EJTIR 2016; Elasticsearch geo-decay documentation). Linear models are uniformly outperformed.

---

### 2. Average Without Misery (AWM) Group Aggregation
**File:** `server/services/scoringService.js` → `cuisineScore()`, `priceScore()`  
**Current:** Simple ratio (matching members / total members) — a single unconfigured member with no preferences silently dilutes the score.  
**Proposed:** Compute per-member scores, discard any below a misery threshold (hard fail), then average the rest. A restaurant everyone hates scores 0; a restaurant that suits most members isn't dragged down by one outlier.  
**Research:** "Average Without Misery" consistently outperforms plain mean aggregation for group recommendations (Masthoff, Springer 2015; Deldjoo et al., JIIS 2021). Recommended as the default for groups with dietary restrictions.

---

### 3. Soft Gaussian Price Scoring
**File:** `server/services/scoringService.js` → `priceScore()`  
**Current:** Binary — a member either accepts or rejects the restaurant's price tier. A $$$  restaurant scores 0 from any member capped at $$.  
**Proposed:** Gaussian curve centered on each member's preferred price midpoint with σ = half the range width. A restaurant one tier outside the range gets ~60% credit rather than zero.  
**Formula:**
```js
const mid    = (pref.price_min + pref.price_max) / 2;
const spread = Math.max(1, (pref.price_max - pref.price_min) / 2);
return Math.exp(-((priceLevel - mid) ** 2) / (2 * spread ** 2));
```
**Research:** MAUT (Multi-Attribute Utility Theory) literature recommends Gaussian utility functions for price matching to avoid discontinuous score cliffs (J. Universal Computer Science 2023).

---

### 4. MMR Diversity Reranking
**Files:** `server/services/scoringService.js` → new `mmrRerank()` post-scoring step  
**Current:** Top-10 are the highest-scoring restaurants with no diversity guarantee. Results can be 8 Italian restaurants.  
**Proposed:** After scoring all candidates, apply Maximal Marginal Relevance reranking to the top-50: iteratively select the next restaurant that maximises both relevance (group score) and dissimilarity from already-selected results.  
**Formula:**
```
MMR = argmax [ λ·relevance(r) - (1-λ)·max_similarity(r, selected) ]
```
λ = 0.6 recommended starting point (original Carbonell & Goldstein 1998 paper).  
**Similarity function:** Cosine on cuisine-type set overlap between two restaurants.  
**Research:** MMR (Carbonell & Goldstein, CMU 1998) is the standard post-scoring diversity reranker used in production systems (Elasticsearch, Google, Wolt). λ = 0.6 balances relevance and diversity well for small result sets (top 5–10).

---

### 5. Contextual Weight Adjustment
**File:** `server/services/scoringService.js` → `WEIGHTS` constant  
**Current:** Static global weights (cuisine 35%, price 25%, distance 20%, rating 10%, availability 10%).  
**Proposed:** Adjust weights based on group context signals:
- Group has dietary restrictions → increase cuisine weight to 40%, reduce rating
- Session time is set → increase availability weight to 20%, reduce distance
- Large party (≥ 6) → increase price weight (budget sensitivity scales with party size)  
**Research:** "Importance Weight" calculation under different demand scenarios (ScienceDirect 2024, Dianping.com study). Weights should be user-contextual, not fixed globally.

---

### 6. Sequential Fairness (SDAA) — Long-term
**Files:** New `server/services/fairnessService.js` + DB schema change  
**What:** For recurring groups, track each member's cumulative satisfaction score across sessions. Members who have been consistently under-served receive higher weight in the next round's aggregation.  
**Research:** Sequential Dynamic Adaptation Aggregation (SDAA) — Deldjoo et al. 2021. Most sophisticated fairness model for repeat-session group recommendations. Requires storing per-user per-session satisfaction history.  
**Prerequisite:** DB table `group_session_history` (group_id, user_id, session_date, satisfaction_score).

---

## Tuning Notes

| Parameter | Current Value | When to Update |
|---|---|---|
| `BAYES_C` | 50 | Increase toward mean review count as more restaurants are fetched |
| `GLOBAL_MEAN_RATING` | 4.2 | Recalculate from real fetched data quarterly |
| `MAX_RADIUS_KM` | 10 | Reduce to 5 for dense urban markets; keep 10+ for suburbs |
| Score filter threshold | 30 / 100 | Lower to 20 if too many results are filtered out in rural areas |
