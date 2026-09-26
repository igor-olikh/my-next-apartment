import type { PlaceId } from "../domain/types";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const MAP: Record<string, { place: PlaceId; ids: string[] }> = {
  "campello playa": { place: "campello", ids: ["campello-playa"] },
  "pueblo espanol coveta fuma": { place: "campello", ids: ["coveta-fuma"] },
  "playa muchavista": { place: "campello", ids: ["muchavista"] },
  "campello pueblo": { place: "campello", ids: ["campello-pueblo"] },
  "pueblo acantilado lanuza": { place: "campello", ids: ["acantilado-lanuza"] },
  centro: { place: "alicante", ids: ["centro"] },
  "benalua babel": { place: "alicante", ids: ["benalua"] },
  "pla carolinas": { place: "alicante", ids: ["pla-bon-repos", "carolinas"] },
  "san blas": { place: "alicante", ids: ["san-blas"] },
  "campoamor altozano": { place: "alicante", ids: ["campoamor"] },
  "florida ciudad de asis": { place: "alicante", ids: ["florida"] },
  "garbinet vistahermosa": { place: "alicante", ids: ["vistahermosa"] },
  "playa de san juan el cabo de las huertas": {
    place: "alicante",
    ids: ["playa-san-juan", "cabo-huertas", "albufereta"],
  },
  norte: { place: "alicante", ids: ["virgen-remedio"] },
};

export function mapFotocasaDistrict(name: string): { place: PlaceId; ids: string[] } | null {
  return MAP[norm(name)] ?? null;
}

export const FOTOCASA_URLS: Record<PlaceId, string> = {
  alicante: "https://www.fotocasa.es/es/indice-precio-vivienda/alicante-alacant/todas-las-zonas",
  campello: "https://www.fotocasa.es/es/indice-precio-vivienda/campello-el/todas-las-zonas",
};
