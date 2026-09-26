import type { CityMarket, PlaceId } from "../domain/types";

export const MARKETS: Record<PlaceId, CityMarket> = {
  alicante: {
    nameRu: "Alicante",
    asOf: "2026-07",
    briefingDate: "2026-08-20",
    eurPerM2: 2705,
    tinsaEurPerM2: 2069,
    yoyPct: 6.6,
    threeMonthPct: 0.9,
    spainEurPerM2: 2933,
    spainYoyPct: 13.1,
    source: "Idealista июль 2026 · Fotocasa август 2026 · Tinsa 2 кв. 2026",
    note: "2 705 €/м² — объявления. Tinsa по оценкам банка: 2 069 €/м². Разница около 30%. Не путай желание продавца и то, что банк посчитает.",
  },
  campello: {
    nameRu: "El Campello",
    asOf: "2026-08",
    briefingDate: "2026-08-20",
    eurPerM2: 3345,
    tinsaEurPerM2: null,
    yoyPct: 3.1,
    threeMonthPct: 2.0,
    spainEurPerM2: 2933,
    spainYoyPct: 13.1,
    source: "Fotocasa август 2026 · Idealista июль 3 208 €/м²",
    note: "Это не район Alicante. Свой город, трамвай L1, то же море что Playa de San Juan. Посёлок 2 199 €/м². Playa Muchavista 4 532 — уже дороже пляжа Alicante.",
  },
};

export const CITY = MARKETS.alicante;

export function marketOf(place: PlaceId): CityMarket {
  return MARKETS[place];
}

export const SOURCES = [
  {
    title: "Idealista: Alicante 2 705 €/м² в июле 2026, +6,6% за год",
    url: "https://www.idealista.com/news/inmobiliario/vivienda/2026/08/17/910300-alicante-dispara-el-precio-de-la-vivienda-el-m2-alcanza-los-2-705-euros-en-julio",
  },
  {
    title: "Fotocasa: индекс цен по баррио, август 2026",
    url: "https://www.fotocasa.es/es/indice-precio-vivienda/alicante-alacant/todas-las-zonas",
  },
  {
    title: "Tinsa: оценка 2 069 €/м², 2 кв. 2026",
    url: "https://www.tinsa.es/precio-vivienda/comunitat-valenciana/alicante/alicante/",
  },
  {
    title: "ITP 9% в Валенсийском сообществе с 1 июня 2026",
    url: "https://www.garrigues.com/es_ES/noticia/comunidad-valenciana-aprueba-medidas-tributarias-efectos-2025-2026-2027",
  },
  {
    title: "Fotocasa: аренда Alicante 14 €/м², август 2026",
    url: "https://www.fotocasa.es/es/indice-precio-vivienda/alquiler/alicante-alacant/todas-las-zonas",
  },
  {
    title: "Fotocasa: El Campello 3 350 €/м², сентябрь 2026",
    url: "https://www.fotocasa.es/es/indice-precio-vivienda/campello-el/todas-las-zonas",
  },
  {
    title: "Fotocasa: аренда El Campello 14 €/м², сентябрь 2026",
    url: "https://www.fotocasa.es/es/indice-precio-vivienda/alquiler/campello-el/todas-las-zonas",
  },
];
