import { CITY_RENT, RENTS } from "../data/rents";
import { CITY } from "../data/market";
import { DISTRICTS } from "../data/districts";
import { formatEur, formatMonth, formatPct, grossYieldPct, typicalRentMonth, typicalSqm } from "./money";
import type { BuyerProfile, DistrictFit, RentOpportunity } from "./types";

export function cityYieldPct(): number {
  return grossYieldPct(CITY.eurPerM2, CITY_RENT.eurPerM2);
}

export function districtYield(id: string): number | null {
  const d = DISTRICTS.find((x) => x.id === id);
  const r = RENTS[id];
  if (!d || !r) return null;
  return grossYieldPct(d.price.eurPerM2, r.eurPerM2);
}

function isTouristLet(id: string): boolean {
  const d = DISTRICTS.find((x) => x.id === id);
  return !!d && d.scores.touristPressure >= 8;
}

function isFlood(id: string): boolean {
  const d = DISTRICTS.find((x) => x.id === id);
  return !!d && d.scores.flood >= 6;
}

export function findRentOpportunities(profile: BuyerProfile, picks: DistrictFit[]): RentOpportunity[] {
  const ops: RentOpportunity[] = [];
  const picked = new Set(picks.map((p) => p.district.id));
  const cityY = cityYieldPct();
  const sqm = typicalSqm(profile.minRooms);

  const stretchOrBroke = picks.length === 0 || picks[0]?.stretch || picks[0]?.outOfReach;
  const liveTarget = picks[0] ?? null;
  if (stretchOrBroke && liveTarget) {
    const rent = RENTS[liveTarget.district.id];
    if (rent && !isTouristLet(liveTarget.district.id)) {
      const month = typicalRentMonth(rent.eurPerM2, profile.minRooms);
      ops.push({
        districtId: liveTarget.district.id,
        nameRu: liveTarget.district.nameRu,
        kind: "rent_instead",
        yieldPct: districtYield(liveTarget.district.id) ?? 0,
        monthEur: month,
        sqm,
        headline: `Снять ${liveTarget.district.nameRu}, не покупать край`,
        why: `Покупка там ~${formatEur(liveTarget.typicalAskEur)}. Снять твои ~${sqm} м² — около ${formatMonth(month)}. Это путь жить в нужном районе сейчас.`,
        caution: "Долгосрочная аренда, не лето. Спроси сезон и кто в доме живёт.",
      });
    }
  }

  const heat: RentOpportunity[] = [];
  for (const d of DISTRICTS) {
    const rent = RENTS[d.id];
    if (!rent) continue;
    if (isFlood(d.id)) continue;
    if (isTouristLet(d.id)) continue;
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
        why: `Грубые ${y.toFixed(1)}% при городе ~${cityY.toFixed(1)}%. Люди снимают, потому что покупать дёшево, не потому что район стал Энсанче.`,
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
