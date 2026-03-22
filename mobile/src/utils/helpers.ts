import { Restaurant } from '../types';

export function getPriceLabel(priceLevel: string | undefined): string {
  const map: Record<string, string> = {
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  };
  return map[priceLevel ?? ''] ?? '?';
}

export function getRestaurantName(restaurant: Restaurant): string {
  return restaurant.displayName?.text ?? 'Unknown Restaurant';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#6B7C45';  // olive — great match
  if (score >= 60) return '#C24B2F';  // terracotta — good match
  return '#A33B22';                   // clay red — weaker match
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(h, 10), parseInt(m, 10));
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
