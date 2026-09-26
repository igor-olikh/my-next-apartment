import { STATIC_CATALOG, type Catalog } from "../runtime/catalog";
import { cashToMoveIn, formatMonth, formatPct, grossYieldPct, typicalAsk, typicalRentMonth, typicalSqm } from "./money";
import type { BuyerProfile, District, LetFit, LetStamp, PlaceId } from "./types";

export function cityYieldPct(place: PlaceId, cat: Catalog = STATIC_CATALOG): number {
  return grossYieldPct(cat.marketOf(place).eurPerM2, cat.placeRent(place).eurPerM2);
}

function trapForTenants(d: District): boolean {
  const s = d.scores;
  return s.walkability <= 5 || s.elevatorShare <= 3 || s.stock <= 3;
}

export function scoreLet(d: District, profile: BuyerProfile, cat: Catalog): LetFit {
  const rent = cat.rentOf(d.id);
  const sqm = typicalSqm(profile.minRooms);
  const ask = typicalAsk(d.price.eurPerM2, profile.minRooms);
  const y = rent ? grossYieldPct(d.price.eurPerM2, rent.eurPerM2) : 0;
  const month = rent ? typicalRentMonth(rent.eurPerM2, profile.minRooms) : 0;
  const cityY = cityYieldPct(profile.place, cat);
  const s = d.scores;
  const affordable = ask <= profile.maxBudgetEur;
  const stretch = !affordable && ask <= profile.maxBudgetEur * 1.18;
  const outOfReach = ask > profile.maxBudgetEur * 1.18;
  const reasons: string[] = [];

  let stamp: LetStamp = "not_this";
  if (s.flood >= 6) {
    stamp = "not_this";
    reasons.push("Вода и порт. Не покупать под сдачу.");
  } else if (s.touristPressure >= 8) {
    stamp = "not_this";
    reasons.push("Гости, не жильцы. Лето полно, зима пустая. Новые туристические лицензии режут.");
  } else if (!rent) {
    stamp = "not_this";
    reasons.push("Нет цифры аренды — не гадаем.");
  } else {
    const trap = trapForTenants(d);
    const hot = y >= cityY + 0.8 || (rent.yoyPct != null && rent.yoyPct >= 10 && y >= cityY - 0.4);
    if (trap && y >= cityY + 0.5) {
      stamp = "caution";
      reasons.push(
        `Жилец за год даёт примерно ${y.toFixed(1)}%, в городе обычно ${cityY.toFixed(1)}%. Процент красивый, потому что район дешёвый. Искать жильца и потом продать — тяжелее.`,
      );
    } else if (hot && !trap) {
      stamp = "can_let";
      reasons.push(
        `Жилец за год даёт примерно ${y.toFixed(1)}% с цены покупки. В городе обычно ${cityY.toFixed(1)}%. Это до налога и пустых месяцев.`,
      );
      if (rent.yoyPct != null && rent.yoyPct >= 10) {
        reasons.push(`Аренда за год ${formatPct(rent.yoyPct)} — люди платят, не только летом.`);
      }
      reasons.push(`Ориентир аренды твоих метров: ${formatMonth(month)}.`);
    } else if (!trap && y >= cityY - 0.3) {
      stamp = "can_let";
      reasons.push(
        `Примерно как город: ${y.toFixed(1)}% против ${cityY.toFixed(1)}%. Жилой район, не курорт. Это до налога и пустых месяцев.`,
      );
    } else {
      stamp = "caution";
      reasons.push(`Для сдачи слабо: ${y.toFixed(1)}% при городе ${cityY.toFixed(1)}%.`);
    }
  }

  return {
    district: d,
    stamp,
    yieldPct: y,
    monthEur: month,
    typicalAskEur: ask,
    typicalSqm: sqm,
    cashToMoveIn: cashToMoveIn(ask),
    affordable,
    stretch,
    outOfReach,
    reasons: reasons.slice(0, 3),
  };
}

export function recommendedLet(profile: BuyerProfile, cat: Catalog = STATIC_CATALOG): LetFit[] {
  const all = cat.districtsIn(profile.place).map((d) => scoreLet(d, profile, cat));
  const good = all
    .filter((f) => f.stamp === "can_let" && !f.outOfReach)
    .sort((a, b) => b.yieldPct - a.yieldPct);
  const caution = all
    .filter((f) => f.stamp === "caution" && !f.outOfReach)
    .sort((a, b) => b.yieldPct - a.yieldPct);
  const picks = [...good];
  if (picks.length < 3) {
    for (const c of caution) {
      if (picks.length >= 3) break;
      picks.push(c);
    }
  }
  return picks.slice(0, 3);
}

export function ignoredLet(profile: BuyerProfile, picks: LetFit[], cat: Catalog = STATIC_CATALOG): string[] {
  const picked = new Set(picks.map((p) => p.district.id));
  const lines: string[] = [];
  for (const d of cat.districtsIn(profile.place)) {
    if (picked.has(d.id)) continue;
    const f = scoreLet(d, profile, cat);
    if (f.stamp !== "not_this" && f.stamp !== "caution") continue;
    if (f.stamp === "caution" && picks.some((p) => p.stamp === "caution")) continue;
    lines.push(`${d.nameEs} — ${f.reasons[0] ?? d.trap}`);
  }
  lines.push("Пляж для гостей и «квартира под туристов» — не эта ставка.");
  lines.push("Процент грубый: ещё налог, пустые месяцы, ремонт дома.");
  return lines.slice(0, 7);
}
