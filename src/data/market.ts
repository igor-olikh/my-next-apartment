import type { CityMarket } from "../domain/types";

export const CITY: CityMarket = {
  nameRu: "Аликанте",
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
};

export const SOURCES = [
  {
    title: "Idealista: Аликанте 2 705 €/м² в июле 2026, +6,6% за год",
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
];
