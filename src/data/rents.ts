import type { DistrictRent } from "../domain/types";

/** Fotocasa rental index, Alicante city, August 2026. */
export const CITY_RENT = {
  eurPerM2: 14,
  yoyPct: 5.9,
  asOf: "2026-08",
  source: "Fotocasa, аренда Аликанте, август 2026",
};

export const RENTS: Record<string, DistrictRent> = {
  ensanche: {
    eurPerM2: 14,
    asOf: "2026-08",
    yoyPct: 2.2,
    source: "Fotocasa, район Centro, август 2026",
    quality: "reported",
  },
  mercado: {
    eurPerM2: 14,
    asOf: "2026-08",
    yoyPct: 2.2,
    source: "Fotocasa, район Centro, август 2026",
    quality: "reported",
  },
  centro: {
    eurPerM2: 14,
    asOf: "2026-08",
    yoyPct: 2.2,
    source: "Fotocasa, район Centro, август 2026",
    quality: "reported",
  },
  benalua: {
    eurPerM2: 14,
    asOf: "2026-08",
    yoyPct: 8.6,
    source: "Fotocasa, Benalúa-Babel, август 2026",
    quality: "reported",
  },
  "pla-bon-repos": {
    eurPerM2: 14,
    asOf: "2026-08",
    yoyPct: 21.9,
    source: "Fotocasa, Pla-Carolinas, август 2026",
    quality: "reported",
  },
  "san-blas": {
    eurPerM2: 12,
    asOf: "2026-08",
    yoyPct: 12.2,
    source: "Fotocasa, San Blas, август 2026",
    quality: "reported",
  },
  campoamor: {
    eurPerM2: 11,
    asOf: "2026-08",
    yoyPct: -0.2,
    source: "Fotocasa, Campoamor-Altozano, август 2026",
    quality: "reported",
  },
  carolinas: {
    eurPerM2: 14,
    asOf: "2026-08",
    yoyPct: 21.9,
    source: "Fotocasa, Pla-Carolinas, август 2026",
    quality: "reported",
  },
  albufereta: {
    eurPerM2: 15,
    asOf: "2026-08",
    yoyPct: 6.2,
    source: "Fotocasa, Playa de San Juan-El Cabo, август 2026",
    quality: "reported",
  },
  "cabo-huertas": {
    eurPerM2: 15,
    asOf: "2026-08",
    yoyPct: 6.2,
    source: "Fotocasa, Playa de San Juan-El Cabo, август 2026",
    quality: "reported",
  },
  "playa-san-juan": {
    eurPerM2: 15,
    asOf: "2026-08",
    yoyPct: 6.2,
    source: "Fotocasa, Playa de San Juan-El Cabo, август 2026",
    quality: "reported",
  },
  vistahermosa: {
    eurPerM2: 12,
    asOf: "2026-08",
    yoyPct: 1.1,
    source: "Fotocasa, Garbinet-Vistahermosa, август 2026",
    quality: "reported",
  },
  florida: {
    eurPerM2: 12,
    asOf: "2026-08",
    yoyPct: 0.2,
    source: "Fotocasa, Florida-Ciudad de Asís, август 2026",
    quality: "reported",
  },
  "san-gabriel": {
    eurPerM2: 10,
    asOf: "2026-08",
    yoyPct: -32.9,
    source: "Fotocasa, San Gabriel-Palmeral-Urbanova, август 2026",
    quality: "reported",
  },
  "virgen-remedio": {
    eurPerM2: 11,
    asOf: "2026-08",
    yoyPct: 16.8,
    source: "Fotocasa, Virgen del Remedio, август 2026",
    quality: "reported",
  },
};
