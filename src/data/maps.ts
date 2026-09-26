import type { PlaceId } from "../domain/types";

/** Center of the district, checked against the city map. Not a street address. */
export const DISTRICT_POINT: Record<string, { lat: number; lon: number; place: PlaceId }> = {
  ensanche: { lat: 38.34342, lon: -0.49128, place: "alicante" },
  mercado: { lat: 38.348328, lon: -0.488033, place: "alicante" },
  centro: { lat: 38.345483, lon: -0.481122, place: "alicante" },
  benalua: { lat: 38.341417, lon: -0.497847, place: "alicante" },
  "pla-bon-repos": { lat: 38.354797, lon: -0.475758, place: "alicante" },
  "san-blas": { lat: 38.355722, lon: -0.502794, place: "alicante" },
  campoamor: { lat: 38.356028, lon: -0.486747, place: "alicante" },
  carolinas: { lat: 38.357969, lon: -0.482646, place: "alicante" },
  albufereta: { lat: 38.362861, lon: -0.447806, place: "alicante" },
  "cabo-huertas": { lat: 38.360556, lon: -0.422778, place: "alicante" },
  "playa-san-juan": { lat: 38.376317, lon: -0.408981, place: "alicante" },
  vistahermosa: { lat: 38.36275, lon: -0.464997, place: "alicante" },
  florida: { lat: 38.343043, lon: -0.510343, place: "alicante" },
  "san-gabriel": { lat: 38.328833, lon: -0.509333, place: "alicante" },
  "virgen-remedio": { lat: 38.374028, lon: -0.49025, place: "alicante" },
  "campello-pueblo": { lat: 38.4275, lon: -0.401111, place: "campello" },
  "campello-playa": { lat: 38.424722, lon: -0.389722, place: "campello" },
  muchavista: { lat: 38.40148, lon: -0.40495, place: "campello" },
  "coveta-fuma": { lat: 38.450347, lon: -0.357584, place: "campello" },
  "acantilado-lanuza": { lat: 38.46813, lon: -0.32799, place: "campello" },
};

export function mapsUrl(id: string): string {
  const p = DISTRICT_POINT[id];
  const q = `${p.lat},${p.lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
