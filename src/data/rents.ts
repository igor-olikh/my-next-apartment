import type { DistrictRent, PlaceId } from "../domain/types";

export const PLACE_RENT: Record<PlaceId, { eurPerM2: number; yoyPct: number; asOf: string; source: string }> = {
  alicante: {
    eurPerM2: 14,
    yoyPct: 5.9,
    asOf: "2026-08",
    source: "Fotocasa, аренда Alicante, август 2026",
  },
  campello: {
    eurPerM2: 13,
    yoyPct: 2.8,
    asOf: "2026-08",
    source: "Fotocasa, аренда El Campello, август 2026",
  },
};

/** Fotocasa rental index, Alicante city, August 2026. */
export const CITY_RENT = PLACE_RENT.alicante;

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
  "campello-pueblo": {
    eurPerM2: 13,
    asOf: "2026-08",
    yoyPct: 2.4,
    source: "Fotocasa, Campello pueblo, август 2026",
    quality: "reported",
  },
  "campello-playa": {
    eurPerM2: 13,
    asOf: "2026-08",
    yoyPct: -0.5,
    source: "Fotocasa, Campello Playa, август 2026",
    quality: "reported",
  },
  muchavista: {
    eurPerM2: 15,
    asOf: "2026-08",
    yoyPct: -5.6,
    source: "Fotocasa, Playa Muchavista, август 2026",
    quality: "reported",
  },
  "coveta-fuma": {
    eurPerM2: 13,
    asOf: "2026-08",
    yoyPct: 7.5,
    source: "Fotocasa, Pueblo Español-Coveta Fumá, август 2026",
    quality: "reported",
  },
  "acantilado-lanuza": {
    eurPerM2: 13,
    asOf: "2026-08",
    yoyPct: 2.8,
    source: "Fotocasa, Pueblo Acantilado-Lanuza, август 2026",
    quality: "reported",
  },
};
