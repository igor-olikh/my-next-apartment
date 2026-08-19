import { STATIC_CATALOG, type Catalog } from "../runtime/catalog";
import { formatEur, formatMonth, formatPct, grossYieldPct, typicalRentMonth, typicalSqm } from "./money";
import type { BuyerProfile, DistrictFit, PlaceId, RentOpportunity } from "./types";

export function cityYieldPct(place: PlaceId = "alicante", cat: Catalog = STATIC_CATALOG): number {
  return grossYieldPct(cat.marketOf(place).eurPerM2, cat.placeRent(place).eurPerM2);
}

export function districtYield(id: string, cat: Catalog = STATIC_CATALOG): number | null {
  const d = cat.districtById(id);
  const r = cat.rentOf(id);
  if (!d || !r) return null;
  return grossYieldPct(d.price.eurPerM2, r.eurPerM2);
}

function isTouristLet(id: string, cat: Catalog): boolean {
  const d = cat.districtById(id);
  return !!d && d.scores.touristPressure >= 8;
}

function isFlood(id: string, cat: Catalog): boolean {
  const d = cat.districtById(id);
  return !!d && d.scores.flood >= 6;
}

export function findRentOpportunities(
  profile: BuyerProfile,
  picks: DistrictFit[],
  cat: Catalog = STATIC_CATALOG,
): RentOpportunity[] {
  const ops: RentOpportunity[] = [];
  const picked = new Set(picks.map((p) => p.district.id));
  const cityY = cityYieldPct(profile.place, cat);
  const sqm = typicalSqm(profile.minRooms);

  const stretchOrBroke = picks.length === 0 || picks[0]?.stretch || picks[0]?.outOfReach;
  const liveTarget = picks[0] ?? null;
  if (stretchOrBroke && liveTarget) {
    const rent = cat.rentOf(liveTarget.district.id);
    if (rent && !isTouristLet(liveTarget.district.id, cat)) {
      const month = typicalRentMonth(rent.eurPerM2, profile.minRooms);
      ops.push({
        districtId: liveTarget.district.id,
        nameRu: liveTarget.district.nameRu,
        kind: "rent_instead",
        yieldPct: districtYield(liveTarget.district.id, cat) ?? 0,
        monthEur: month,
        sqm,
        headline: `Снять ${liveTarget.district.nameRu}, не покупать край`,
        why: `Покупка там ~${formatEur(liveTarget.typicalAskEur)}. Снять твои ~${sqm} м² — около ${formatMonth(month)}. Это путь жить в нужном районе сейчас.`,
        caution: "Долгосрочная аренда, не лето. Спроси сезон и кто в доме живёт.",
      });
    }
  }

  const heat: RentOpportunity[] = [];
  for (const d of cat.districtsIn(profile.place)) {
    const rent = cat.rentOf(d.id);
    if (!rent) continue;
    if (isFlood(d.id, cat)) continue;
    if (isTouristLet(d.id, cat)) continue;
    if (picked.has(d.id) && ops.some((o) => o.districtId === d.id && o.kind === "rent_instead")) continue;

    const y = grossYieldPct(d.price.eurPerM2, rent.eurPerM2);
    const hotYield = y >= cityY + 1.4;
    const hotDemand = rent.yoyPct != null && rent.yoyPct >= 12;
    if (!hotYield && !hotDemand) continue;

    const month = typicalRentMonth(rent.eurPerM2, profile.minRooms);
    const trap = d.scores.walkability <= 5 || d.scores.elevatorShare <= 3 || d.scores.stock <= 3;

    if (trap && hotYield) {
      heat.push({
        districtId: d.id,
        nameRu: d.nameRu,
        kind: "yield_trap",
        yieldPct: y,
        monthEur: month,
        sqm,
        headline: `${d.nameRu}: аренда есть, жизнь другая`,
        why: `Грубые ${y.toFixed(1)}% при городе ~${cityY.toFixed(1)}%. Люди снимают, потому что покупать дёшево, не потому что район стал лучшим.`,
        caution: d.trap,
      });
      continue;
    }

    if (picked.has(d.id) && !hotDemand && !hotYield) continue;

    if (!picked.has(d.id) && (hotYield || hotDemand)) {
      const demandBit =
        rent.yoyPct != null && rent.yoyPct >= 12
          ? `Аренда за год ${formatPct(rent.yoyPct)}.`
          : `Грубые ${y.toFixed(1)}% против города ${cityY.toFixed(1)}%.`;
      heat.push({
        districtId: d.id,
        nameRu: d.nameRu,
        kind: "people_pay",
        yieldPct: y,
        monthEur: month,
        sqm,
        headline: `${d.nameRu}: не топ, но люди снимают`,
        why: `${demandBit} Ориентир твоих метров — ${formatMonth(month)}. Район работает. Если дом с лифтом и улица живая вечером — может подойти.`,
        caution: d.trap,
      });
    }
  }

  heat.sort((a, b) => b.yieldPct - a.yieldPct);
  const people = heat.filter((h) => h.kind === "people_pay").slice(0, 2);
  const traps = heat.filter((h) => h.kind === "yield_trap").slice(0, 1);
  return [...ops, ...people, ...traps].slice(0, 3);
}
