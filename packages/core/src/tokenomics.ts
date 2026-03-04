export type TokenomicsConfig = {
  // PRBL constants
  decimals: 9;
  maxSupply: bigint; // 777,777,777,777 * 1e9 (handled in contracts; here for reference)
  // emission rules
  perUserDailyCap: number; // 35 PRBL
  dailyGlobalCap: number;  // configurable (Phase B sets exact)
  // halving model (yearly)
  genesisDateISO: string; // used to compute year index
};

export function yearIndex(genesisDateISO: string, now: Date): number {
  const genesis = new Date(genesisDateISO);
  const ms = now.getTime() - genesis.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(days / 365));
}

export function dailyCapWithHalving(baseDailyCap: number, yearIdx: number): number {
  // year 0 => base, year 1 => /2, year 2 => /4...
  return Math.max(0, Math.floor(baseDailyCap / Math.pow(2, yearIdx)));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
