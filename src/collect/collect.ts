import { FOTOCASA_URLS, mapFotocasaDistrict } from "./map";
import { parseFotocasaIndex, type ParsedPlace } from "./parseFotocasa";
import type { PlaceId } from "../domain/types";
import type { MarketSnapshot, SnapshotDistrict, SnapshotPlace } from "../domain/snapshot";
import { MARKETS } from "../data/market";
import { DISTRICTS } from "../data/districts";
import { PLACE_RENT, RENTS } from "../data/rents";
import { placeOf } from "../data/districts";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

function placeFromParsed(place: PlaceId, parsed: ParsedPlace): SnapshotPlace {
  const districts: SnapshotDistrict[] = [];
  for (const d of parsed.districts) {
    const mapped = mapFotocasaDistrict(d.name);
    if (!mapped || mapped.place !== place) continue;
    if (d.saleEurPerM2 == null) continue;
    for (const id of mapped.ids) {
      districts.push({
        id,
        sourceName: d.name,
        saleEurPerM2: d.saleEurPerM2,
        rentEurPerM2: d.rentEurPerM2,
        yoyPct: d.saleDelta?.twelveMonths ?? null,
        rentYoyPct: d.rentDelta?.twelveMonths ?? null,
        asOf: parsed.asOf,
        source: `Fotocasa, ${d.name}, ${parsed.asOf}`,
      });
    }
  }
  return {
    saleEurPerM2: parsed.saleEurPerM2,
    rentEurPerM2: parsed.rentEurPerM2,
    asOf: parsed.asOf,
    yoyPct: parsed.yoyPct != null ? round1(parsed.yoyPct) : null,
    rentYoyPct: parsed.rentYoyPct != null ? round1(parsed.rentYoyPct) : null,
    threeMonthPct: parsed.threeMonthPct != null ? round1(parsed.threeMonthPct) : null,
    source: `Fotocasa ${parsed.name} ${parsed.asOf}`,
    districts,
  };
}

export function seedSnapshot(now = new Date()): MarketSnapshot {
  const takenAt = now.toISOString();
  const places = {} as MarketSnapshot["places"];
  for (const place of ["alicante", "campello"] as PlaceId[]) {
    const m = MARKETS[place];
    const rent = PLACE_RENT[place];
    const districts: SnapshotDistrict[] = DISTRICTS.filter((d) => placeOf(d) === place).map((d) => {
      const r = RENTS[d.id];
      return {
        id: d.id,
        sourceName: d.nameEs,
        saleEurPerM2: d.price.eurPerM2,
        rentEurPerM2: r?.eurPerM2 ?? null,
        yoyPct: d.price.yoyPct,
        rentYoyPct: r?.yoyPct ?? null,
        asOf: d.price.asOf,
        source: d.price.source,
      };
    });
    places[place] = {
      saleEurPerM2: m.eurPerM2,
      rentEurPerM2: rent.eurPerM2,
      asOf: m.asOf,
      yoyPct: m.yoyPct,
      rentYoyPct: rent.yoyPct,
      threeMonthPct: m.threeMonthPct,
      source: m.source,
      districts,
    };
  }
  return {
    takenAt,
    source: "fotocasa",
    places,
    tinsaEurPerM2: MARKETS.alicante.tinsaEurPerM2,
    spainSaleEurPerM2: MARKETS.alicante.spainEurPerM2,
    spainYoyPct: MARKETS.alicante.spainYoyPct,
    errors: ["seed: ещё не было живого сбора"],
  };
}

export function mergeSnapshot(prev: MarketSnapshot | null, next: MarketSnapshot): MarketSnapshot {
  if (!prev) return next;
  const places = { ...prev.places };
  for (const place of ["alicante", "campello"] as PlaceId[]) {
    const incoming = next.places[place];
    if (!incoming) continue;
    const oldMap = new Map((places[place]?.districts ?? []).map((d) => [d.id, d]));
    for (const d of incoming.districts) oldMap.set(d.id, d);
    places[place] = { ...incoming, districts: [...oldMap.values()] };
  }
  return {
    ...prev,
    ...next,
    places,
    tinsaEurPerM2: next.tinsaEurPerM2 ?? prev.tinsaEurPerM2,
    spainSaleEurPerM2: next.spainSaleEurPerM2 ?? prev.spainSaleEurPerM2,
    spainYoyPct: next.spainYoyPct ?? prev.spainYoyPct,
    errors: next.errors,
  };
}

export async function collectLive(prev: MarketSnapshot | null, now = new Date()): Promise<MarketSnapshot> {
  const errors: string[] = [];
  const places = {} as MarketSnapshot["places"];
  for (const place of ["alicante", "campello"] as PlaceId[]) {
    try {
      const html = await fetchText(FOTOCASA_URLS[place]);
      const parsed = parseFotocasaIndex(html);
      places[place] = placeFromParsed(place, parsed);
    } catch (e) {
      errors.push(`${place}: ${e instanceof Error ? e.message : String(e)}`);
      if (prev?.places[place]) places[place] = prev.places[place];
    }
    await sleep(1500);
  }
  if (!places.alicante || !places.campello) {
    const seed = seedSnapshot(now);
    if (!places.alicante) places.alicante = seed.places.alicante;
    if (!places.campello) places.campello = seed.places.campello;
  }
  const next: MarketSnapshot = {
    takenAt: now.toISOString(),
    source: "fotocasa",
    places,
    tinsaEurPerM2: prev?.tinsaEurPerM2 ?? MARKETS.alicante.tinsaEurPerM2,
    spainSaleEurPerM2: prev?.spainSaleEurPerM2 ?? MARKETS.alicante.spainEurPerM2,
    spainYoyPct: prev?.spainYoyPct ?? MARKETS.alicante.spainYoyPct,
    errors,
  };
  return mergeSnapshot(prev, next);
}
