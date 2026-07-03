/**
 * Parashari Ashtakavarga (BPHS Ch. 66) — bindu rules from kunjara/jyotish.
 * Scores are per sidereal rashi (Mesha…Meena), not whole-sign house.
 */

export type AshtakavargaTarget =
  | "lagna"
  | "sun"
  | "moon"
  | "mars"
  | "mercury"
  | "jupiter"
  | "venus"
  | "saturn";

export const ASHTAKAVARGA_TARGETS: AshtakavargaTarget[] = [
  "lagna",
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
];

/** Seven grahas only — Sarvashtakavarga excludes Lagna (337 bindus). */
export const SAV_PLANETS: AshtakavargaTarget[] = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
];

export const ASHTAKAVARGA_TARGET_LABEL: Record<
  AshtakavargaTarget,
  { en: string; ne: string; short: string }
> = {
  lagna: { en: "Lagna", ne: "लग्न", short: "Lg" },
  sun: { en: "Sun", ne: "सूर्य", short: "Su" },
  moon: { en: "Moon", ne: "चन्द्र", short: "Ch" },
  mars: { en: "Mars", ne: "मंगल", short: "Ma" },
  mercury: { en: "Mercury", ne: "बुध", short: "Bu" },
  jupiter: { en: "Jupiter", ne: "बृहस्पति", short: "Gu" },
  venus: { en: "Venus", ne: "शुक्र", short: "Ve" },
  saturn: { en: "Saturn", ne: "शनि", short: "Sa" },
};

/** Expected BAV totals per target (classical). */
export const BAV_TOTALS: Record<AshtakavargaTarget, number> = {
  sun: 48,
  moon: 49,
  mars: 39,
  mercury: 54,
  jupiter: 56,
  venus: 52,
  saturn: 39,
  lagna: 49,
};

const BINDU_RULES: Record<AshtakavargaTarget, Record<AshtakavargaTarget, number[]>> = {
  sun: {
    sun: [1, 2, 4, 7, 8, 9, 10, 11],
    moon: [3, 6, 10, 11],
    mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [3, 5, 6, 9, 10, 11, 12],
    jupiter: [5, 6, 9, 11],
    venus: [6, 7, 12],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    lagna: [3, 4, 6, 10, 11, 12],
  },
  moon: {
    sun: [3, 6, 7, 8, 10, 11],
    moon: [1, 3, 6, 7, 10, 11],
    mars: [2, 3, 5, 6, 10, 11],
    mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    jupiter: [1, 4, 7, 8, 10, 11, 12],
    venus: [3, 4, 5, 7, 9, 10, 11],
    saturn: [3, 5, 6, 11],
    lagna: [3, 6, 10, 11],
  },
  mars: {
    sun: [3, 5, 6, 10, 11],
    moon: [3, 6, 11],
    mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [3, 5, 6, 11],
    jupiter: [6, 10, 11, 12],
    venus: [6, 8, 11, 12],
    saturn: [1, 4, 7, 8, 9, 10, 11],
    lagna: [1, 3, 6, 10, 11],
  },
  mercury: {
    sun: [5, 6, 9, 11, 12],
    moon: [2, 4, 6, 8, 10, 11],
    mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    jupiter: [6, 8, 11, 12],
    venus: [1, 2, 3, 4, 5, 8, 9, 11],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  jupiter: {
    sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    moon: [2, 5, 7, 9, 11],
    mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    venus: [2, 5, 6, 9, 10, 11],
    saturn: [3, 5, 6, 12],
    lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  venus: {
    sun: [8, 11, 12],
    moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    mars: [3, 4, 6, 9, 11, 12],
    mercury: [3, 5, 6, 9, 11],
    jupiter: [5, 8, 9, 10, 11],
    venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    saturn: [3, 4, 5, 8, 9, 10, 11],
    lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  saturn: {
    sun: [1, 2, 4, 7, 8, 10, 11],
    moon: [3, 6, 11],
    mars: [3, 5, 6, 10, 11, 12],
    mercury: [6, 8, 9, 10, 11, 12],
    jupiter: [5, 6, 11, 12],
    venus: [6, 11, 12],
    saturn: [3, 5, 6, 11],
    lagna: [1, 3, 4, 6, 10, 11],
  },
  lagna: {
    sun: [3, 4, 6, 10, 11, 12],
    moon: [3, 6, 10, 11, 12],
    mars: [1, 3, 6, 10, 11],
    mercury: [1, 2, 4, 6, 8, 10, 11],
    jupiter: [1, 2, 4, 5, 6, 7, 9, 10, 11],
    venus: [1, 2, 3, 4, 5, 8, 9],
    saturn: [1, 3, 4, 6, 10, 11],
    lagna: [3, 6, 10, 11],
  },
};

/** Rashi multipliers (B.V. Raman / Mehta). Index 0 = Mesha. */
export const RASHI_GUNAKARA = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12] as const;

export const GRAHA_GUNAKARA: Record<AshtakavargaTarget, number> = {
  sun: 5,
  moon: 5,
  mars: 8,
  mercury: 5,
  jupiter: 10,
  venus: 7,
  saturn: 5,
  lagna: 5,
};

const TRIKONA_GROUPS = [
  [1, 5, 9],
  [2, 6, 10],
  [3, 7, 11],
  [4, 8, 12],
] as const;

/** Dual-sign pairs for Ekadhipatya (Cancer & Leo exempt). */
const EKADHIPATYA_PAIRS: [number, number][] = [
  [1, 8],
  [2, 7],
  [3, 6],
  [9, 12],
  [10, 11],
];

export type AshtakavargaSignRow = {
  rashi: number;
  rashiEn: string;
  rashiNe: string;
  bindus: Record<AshtakavargaTarget, number>;
  sarvashtaka: number;
};

export type ShodhyaPindaRow = {
  target: AshtakavargaTarget;
  rashiPinda: number;
  grahaPinda: number;
  shodhyaPinda: number;
};

export type AshtakavargaResult = {
  raw: AshtakavargaSignRow[];
  reduced: AshtakavargaSignRow[];
  shodhyaPinda: ShodhyaPindaRow[];
  signs: Record<AshtakavargaTarget, number>;
};

function normSign(rashi: number): number {
  return ((rashi - 1 + 12) % 12) + 1;
}

function signFromLongitude(longitude: number): number {
  const lon = ((longitude % 360) + 360) % 360;
  return Math.floor(lon / 30) + 1;
}

/** BAV bindu counts per rashi (index 0 = Mesha) for one target. */
export function computeBhinnashtakavarga(
  target: AshtakavargaTarget,
  contributorSigns: Record<AshtakavargaTarget, number>,
): number[] {
  const scores = Array(12).fill(0);
  const rules = BINDU_RULES[target];

  for (const contributor of ASHTAKAVARGA_TARGETS) {
    const donorSign = contributorSigns[contributor];
    const beneficHouses = rules[contributor];
    if (!beneficHouses || donorSign == null) continue;

    for (const house of beneficHouses) {
      const targetSign = normSign(donorSign + house - 1);
      scores[targetSign - 1]++;
    }
  }

  return scores;
}

function trikonaShodhana(scores: number[]): number[] {
  const out = [...scores];
  for (const group of TRIKONA_GROUPS) {
    const vals = group.map((r) => out[r - 1]!);
    if (vals.some((v) => v === 0)) continue;
    if (vals.filter((v) => v === 0).length >= 2) {
      for (const r of group) out[r - 1] = 0;
      continue;
    }
    const min = Math.min(...vals);
    if (vals.every((v) => v === min)) {
      for (const r of group) out[r - 1] = 0;
    } else {
      for (const r of group) out[r - 1] = out[r - 1]! - min;
    }
  }
  return out;
}

function isSignOccupied(
  rashi: number,
  occupantSigns: Record<AshtakavargaTarget, number>,
): boolean {
  return ASHTAKAVARGA_TARGETS.some(
    (k) => k !== "lagna" && occupantSigns[k] === rashi,
  );
}

function ekadhipatyaShodhana(
  scores: number[],
  occupantSigns: Record<AshtakavargaTarget, number>,
): number[] {
  const out = [...scores];
  for (const [a, b] of EKADHIPATYA_PAIRS) {
    const va = out[a - 1]!;
    const vb = out[b - 1]!;
    const occA = isSignOccupied(a, occupantSigns);
    const occB = isSignOccupied(b, occupantSigns);

    if (occA && occB) continue;
    if (va === 0 || vb === 0) continue;

    if (occA && !occB) {
      if (vb > va) out[b - 1] = va;
      else out[b - 1] = 0;
      continue;
    }
    if (occB && !occA) {
      if (va > vb) out[a - 1] = vb;
      else out[a - 1] = 0;
      continue;
    }

    if (va === vb) {
      out[a - 1] = 0;
      out[b - 1] = 0;
    } else if (va > vb) {
      out[a - 1] = vb;
    } else {
      out[b - 1] = va;
    }
  }
  return out;
}

function buildMatrixRows(
  charts: Record<AshtakavargaTarget, number[]>,
  rashiNames: { en: string; ne: string }[],
): AshtakavargaSignRow[] {
  return rashiNames.map((names, i) => {
    const bindus = {} as Record<AshtakavargaTarget, number>;
    for (const t of ASHTAKAVARGA_TARGETS) {
      bindus[t] = charts[t][i] ?? 0;
    }
    const sarvashtaka = SAV_PLANETS.reduce((s, t) => s + bindus[t], 0);
    return {
      rashi: i + 1,
      rashiEn: names.en,
      rashiNe: names.ne,
      bindus,
      sarvashtaka,
    };
  });
}

function computeShodhyaPinda(
  reduced: Record<AshtakavargaTarget, number[]>,
  occupantSigns: Record<AshtakavargaTarget, number>,
): ShodhyaPindaRow[] {
  return ASHTAKAVARGA_TARGETS.map((target) => {
    const chart = reduced[target];
    let rashiPinda = 0;
    for (let i = 0; i < 12; i++) {
      rashiPinda += chart[i]! * RASHI_GUNAKARA[i]!;
    }

    let grahaPinda = 0;
    for (const graha of ASHTAKAVARGA_TARGETS) {
      const sign = occupantSigns[graha];
      const bindus = chart[sign - 1] ?? 0;
      grahaPinda += bindus * GRAHA_GUNAKARA[graha];
    }

    return {
      target,
      rashiPinda,
      grahaPinda,
      shodhyaPinda: rashiPinda + grahaPinda,
    };
  });
}

export function computeAshtakavarga(
  lagnaRashi: number,
  planetLongitudes: Record<string, number>,
  rashiNames: { en: string; ne: string }[],
): AshtakavargaResult {
  const signs = {
    lagna: normSign(lagnaRashi),
    sun: signFromLongitude(planetLongitudes.sun ?? 0),
    moon: signFromLongitude(planetLongitudes.moon ?? 0),
    mars: signFromLongitude(planetLongitudes.mars ?? 0),
    mercury: signFromLongitude(planetLongitudes.mercury ?? 0),
    jupiter: signFromLongitude(planetLongitudes.jupiter ?? 0),
    venus: signFromLongitude(planetLongitudes.venus ?? 0),
    saturn: signFromLongitude(planetLongitudes.saturn ?? 0),
  } satisfies Record<AshtakavargaTarget, number>;

  const rawCharts = {} as Record<AshtakavargaTarget, number[]>;
  const reducedCharts = {} as Record<AshtakavargaTarget, number[]>;

  for (const target of ASHTAKAVARGA_TARGETS) {
    const raw = computeBhinnashtakavarga(target, signs);
    rawCharts[target] = raw;
    const afterTrikona = trikonaShodhana(raw);
    reducedCharts[target] = ekadhipatyaShodhana(afterTrikona, signs);
  }

  return {
    raw: buildMatrixRows(rawCharts, rashiNames),
    reduced: buildMatrixRows(reducedCharts, rashiNames),
    shodhyaPinda: computeShodhyaPinda(reducedCharts, signs),
    signs,
  };
}
