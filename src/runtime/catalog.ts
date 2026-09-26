import { DISTRICTS, placeOf } from "../data/districts";
import { MARKETS } from "../data/market";
import { PLACE_RENT, RENTS } from "../data/rents";
import type { CityMarket, District, DistrictRent, PlaceId } from "../domain/types";
import type { MarketSnapshot } from "../domain/snapshot";

export type PlaceRent = {
  eurPerM2: number;
  yoyPct: number;
  asOf: string;
  source: string;
};

export interface Catalog {
  marketOf: (place: PlaceId) => CityMarket;
  districtsIn: (place: PlaceId) => District[];
  districtById: (id: string) => District | undefined;
  rentOf: (id: string) => DistrictRent | undefined;
  placeRent: (place: PlaceId) => PlaceRent;
  snapshot: MarketSnapshot | null;
}

function noteFor(place: PlaceId, sale: number, asOf: string, snap: MarketSnapshot | null): string {
  if (place === "campello") {
    const ds = snap?.places.campello?.districts ?? [];
    const pueblo = ds.find((d) => d.id === "campello-pueblo");
    const mucha = ds.find((d) => d.id === "muchavista");
    const p = pueblo ? Math.round(pueblo.saleEurPerM2).toLocaleString("ru-RU") : "2 199";
    const m = mucha ? Math.round(mucha.saleEurPerM2).toLocaleString("ru-RU") : "4 532";
    return `Это не район Alicante. Свой город, трамвай L1, то же море что Playa de San Juan. Посёлок ${p} €/м². Playa Muchavista ${m} — уже дороже пляжа Alicante. Снимок ${asOf}.`;
  }
  const tinsa = snap?.tinsaEurPerM2 ?? MARKETS.alicante.tinsaEurPerM2;
  const t = tinsa ? tinsa.toLocaleString("ru-RU") : "нет";
  return `${sale.toLocaleString("ru-RU")} €/м² — объявления Fotocasa ${asOf}. Tinsa (оценка банка, последняя известная): ${t} €/м². Не путай желание продавца и то, что банк посчитает.`;
}

export function createCatalog(snapshot: MarketSnapshot | null): Catalog {
  const districtList: District[] = DISTRICTS.map((d) => {
    const hit = snapshot?.places[placeOf(d)]?.districts.find((x) => x.id === d.id);
    if (!hit) return d;
    return {
      ...d,
      price: {
        eurPerM2: Math.round(hit.saleEurPerM2),
        asOf: hit.asOf,
        yoyPct: hit.yoyPct,
        source: hit.source,
        quality: "reported",
      },
    };
  });

  const rents: Record<string, DistrictRent> = { ...RENTS };
  if (snapshot) {
    for (const place of Object.values(snapshot.places)) {
      for (const d of place.districts) {
        if (d.rentEurPerM2 == null) continue;
        rents[d.id] = {
          eurPerM2: Math.round(d.rentEurPerM2),
          asOf: d.asOf,
          yoyPct: d.rentYoyPct,
          source: d.source,
          quality: "reported",
        };
      }
    }
  }

  const markets = { ...MARKETS } as Record<PlaceId, CityMarket>;
  if (snapshot) {
    for (const place of ["alicante", "campello"] as PlaceId[]) {
      const p = snapshot.places[place];
      if (!p) continue;
      const sale = Math.round(p.saleEurPerM2);
      markets[place] = {
        ...MARKETS[place],
        asOf: p.asOf,
        briefingDate: snapshot.takenAt.slice(0, 10),
        eurPerM2: sale,
        yoyPct: p.yoyPct ?? MARKETS[place].yoyPct,
        threeMonthPct: p.threeMonthPct ?? MARKETS[place].threeMonthPct,
        tinsaEurPerM2: snapshot.tinsaEurPerM2,
        spainEurPerM2: snapshot.spainSaleEurPerM2 ?? MARKETS[place].spainEurPerM2,
        spainYoyPct: snapshot.spainYoyPct ?? MARKETS[place].spainYoyPct,
        source: p.source,
        note: noteFor(place, sale, p.asOf, snapshot),
      };
    }
  }

  return {
    snapshot,
    marketOf: (place) => markets[place],
    districtsIn: (place) => districtList.filter((d) => placeOf(d) === place),
    districtById: (id) => districtList.find((d) => d.id === id),
    rentOf: (id) => rents[id],
    placeRent: (place) => {
      const p = snapshot?.places[place];
      if (p?.rentEurPerM2 != null) {
        return {
          eurPerM2: Math.round(p.rentEurPerM2),
          yoyPct: p.rentYoyPct ?? PLACE_RENT[place].yoyPct,
          asOf: p.asOf,
          source: p.source,
        };
      }
      return PLACE_RENT[place];
    },
  };
}

export const STATIC_CATALOG = createCatalog(null);
