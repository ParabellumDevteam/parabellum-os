import type { StravaActivityLike, EffortScore } from './types.js';

/**
 * Phase A effort scoring:
 * - Deterministic and simple.
 * Phase B:
 * - HR zones, pace sanity, sport weighting, per-activity caps, etc.
 */
export function scoreActivity(a: StravaActivityLike): EffortScore {
  const flags: string[] = [];

  const dist = Math.max(0, a.distanceM ?? 0);
  const t = Math.max(0, a.movingTimeS ?? 0);
  const hr = Math.max(0, a.avgHr ?? 0);

  // Basic sanity flags
  if (t > 0 && dist / t > 8) flags.push('SUSPICIOUS_SPEED'); // > 8 m/s (~28.8 km/h) generic
  if (hr > 210) flags.push('SUSPICIOUS_HR');

  // Simple points: time (minutes) + distance (km) + mild HR factor
  const minutes = t / 60;
  const km = dist / 1000;

  const points = Math.floor(minutes * 1.0 + km * 2.0 + (hr > 0 ? hr / 50 : 0));
  return { points: Math.max(0, points), flags };
}
