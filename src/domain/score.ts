import { CITY } from "../data/market";
import { DISTRICTS, districtById } from "../data/districts";
import { cashToMoveIn, typicalAsk, typicalSqm } from "./money";
import type {
  BuyerProfile,
  District,
  DistrictFit,
  ListingFlag,
  ListingInput,
} from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function inv(n: number): number {
  return 11 - n;
}

export function lifeScore(district: District, profile: BuyerProfile): number {
  const s = district.scores;
  const touristOk = inv(s.touristPressure);
  const noCarOk = inv(s.carNeed);

  const weights =
    profile.want === "quiet"
      ? { quiet: 3, winter: 1.5, stock: 1.2, touristOk: 2.2, walkability: 0.8, services: 1, noCarOk: 0.8, sea: 0.3 }
      : profile.want === "beach"
        ? { sea: 3.2, summer: 1.2, quiet: 1.2, stock: 1, winter: 0.8, walkability: 0.8, services: 0.8, touristOk: 0.6, noCarOk: 0.6 }
        : { walkability: 2.6, services: 2, noCarOk: 2, quiet: 1, stock: 1, touristOk: 1, winter: 0.8, sea: 0.3 };

  const bag: Record<string, number> = {
    quiet: s.quiet,
    winter: s.winter,
    stock: s.stock,
    touristOk,
    walkability: s.walkability,
    services: s.services,
    noCarOk,
    sea: s.sea,
    summer: s.summer,
  };

  let num = 0;
  let den = 0;
  for (const [key, w] of Object.entries(weights)) {
    num += (bag[key] ?? 0) * w;
    den += w;
  }
  let score = (num / den) * 10;

  if (!profile.hasCar && s.carNeed >= 7) score -= 20;
  if (!profile.hasCar && s.carNeed >= 6) score -= 8;
  if (s.touristPressure >= 7 && profile.want === "quiet") score -= 16;
  if (s.touristPressure >= 8 && profile.want === "city") score -= 8;
  if (s.flood >= 6) score -= 18;
  if (profile.mustHaveElevator && s.elevatorShare <= 4) score -= 16;
  if (profile.mustHaveElevator && s.elevatorShare <= 5) score -= 6;
  if (s.hills >= 7 && !profile.hasCar) score -= 8;
  if (profile.want === "city" && s.sea >= 9 && s.walkability <= 6) score -= 6;
  if (profile.want === "beach" && s.sea < 7) score -= (7 - s.sea) * 5;
  if (profile.want === "city" && s.walkability < 6) score -= (6 - s.walkability) * 3;

  return Math.round(clamp(score, 0, 100));
}

export function fitDistrict(district: District, profile: BuyerProfile): DistrictFit {
  const sqm = typicalSqm(profile.minRooms);
  const ask = typicalAsk(district.price.eurPerM2, profile.minRooms);
  const score = lifeScore(district, profile);
  const affordable = ask <= profile.maxBudgetEur;
  const stretch = !affordable && ask <= profile.maxBudgetEur * 1.18;
  const outOfReach = ask > profile.maxBudgetEur * 1.18;

  const reasons: string[] = [];
  const warnings: string[] = [];
  const s = district.scores;

  if (profile.want === "city" && s.walkability >= 8) reasons.push("Пешком живётся.");
  if (profile.want === "city" && s.carNeed <= 4) reasons.push("Машина не обязательна.");
  if (profile.want === "beach" && s.sea >= 8) reasons.push("Вода рядом по-настоящему.");
  if (profile.want === "quiet" && s.quiet >= 7) reasons.push("Тише, чем город в среднем.");
  if (profile.want === "quiet" && s.touristPressure <= 3) reasons.push("Мало гостей в подъезде.");
  if (s.services >= 8) reasons.push("Магазины и быт не в машине.");
  if (s.stock >= 7 && profile.mustHaveElevator) reasons.push("Фонд новее, лифт реальнее.");
  if (affordable) reasons.push(`Ориентир ${sqm} м² — в бюджете.`);
  if (stretch) warnings.push("В бюджет влезаешь впритык. Торг или меньше метры.");
  if (outOfReach) warnings.push("Типичная квартира здесь дороже потолка.");
  if (!profile.hasCar && s.carNeed >= 7) warnings.push("Без машины это почти остров.");
  if (profile.mustHaveElevator && s.elevatorShare <= 4) warnings.push("Лифт часто нет. Каско и старый фонд.");
  if (s.flood >= 6) warnings.push("Вода. Не «у моря», а риск.");
  if (s.touristPressure >= 8) warnings.push("Соседи часто гости.");
  if (district.price.yoyPct != null && district.price.yoyPct >= 14) {
    warnings.push(`Метр за год ${district.price.yoyPct > 0 ? "+" : ""}${district.price.yoyPct}%. Это жара, не подарок.`);
  }
  if (district.price.quality === "estimated") warnings.push("Цена района — оценка, не прямой отчёт.");
  if (reasons.length === 0) reasons.push(district.character);

  return {
    district,
    lifeScore: score,
    typicalAskEur: ask,
    typicalSqm: sqm,
    cashToMoveIn: cashToMoveIn(ask),
    affordable,
    stretch,
    reasons: reasons.slice(0, 3),
    warnings: warnings.slice(0, 3),
    outOfReach,
  };
}

export function rankDistricts(profile: BuyerProfile): DistrictFit[] {
  return DISTRICTS.map((d) => fitDistrict(d, profile)).sort((a, b) => b.lifeScore - a.lifeScore);
}

export function matchesWant(f: DistrictFit, profile: BuyerProfile): boolean {
  const s = f.district.scores;
  if (profile.want === "beach") return s.sea >= 7;
  if (profile.want === "city") return s.walkability >= 7;
  return s.quiet >= 5 && s.touristPressure <= 6;
}

export function recommended(profile: BuyerProfile): DistrictFit[] {
  return rankDistricts(profile)
    .filter((f) => matchesWant(f, profile))
    .filter((f) => f.lifeScore >= 52 && f.district.scores.flood < 7 && !f.outOfReach)
    .slice(0, 3);
}

export function ignoredFits(profile: BuyerProfile, picks: DistrictFit[]): DistrictFit[] {
  const picked = new Set(picks.map((p) => p.district.id));
  return rankDistricts(profile)
    .filter((f) => !picked.has(f.district.id))
    .filter((f) => {
      const s = f.district.scores;
      if (s.flood >= 6) return true;
      if (f.lifeScore < 48) return true;
      if (profile.want === "quiet" && s.touristPressure >= 7) return true;
      if (!profile.hasCar && s.carNeed >= 7) return true;
      if (profile.mustHaveElevator && s.elevatorShare <= 3) return true;
      if (profile.want === "beach" && s.sea <= 3 && f.district.price.eurPerM2 < CITY.eurPerM2) return true;
      return false;
    })
    .slice(0, 6);
}

export function flagListing(listing: ListingInput, profile: BuyerProfile): ListingFlag[] {
  const district = districtById(listing.districtId);
  const flags: ListingFlag[] = [];
  if (!district) {
    flags.push({ code: "no-district", severity: "bad", text: "Район неизвестен. Без района цена ничего не значит." });
    return flags;
  }

  const fit = fitDistrict(district, profile);
  const m2 = listing.sqm > 0 ? listing.priceEur / listing.sqm : 0;

  if (listing.rooms < profile.minRooms) {
    flags.push({
      code: "rooms",
      severity: "bad",
      text: `Нужно от ${profile.minRooms} комнат. Здесь ${listing.rooms}.`,
    });
  }
  if (listing.priceEur > profile.maxBudgetEur) {
    flags.push({
      code: "budget",
      severity: "bad",
      text: `Дороже потолка. Въехать выйдет около ${cashToMoveIn(listing.priceEur).toLocaleString("ru-RU")} € с налогом.`,
    });
  }
  if (m2 > 0 && m2 < district.price.eurPerM2 * 0.85) {
    flags.push({
      code: "cheap",
      severity: "good",
      text: `${Math.round(m2)} €/м² при районе ~${district.price.eurPerM2}. Дешевле нормы. Спроси почему: торг, дефект, срочность, ложь в метрах.`,
    });
  }
  if (m2 > district.price.eurPerM2 * 1.15) {
    flags.push({
      code: "dear",
      severity: "bad",
      text: `${Math.round(m2)} €/м². Дороже района. За вид, ремонт или жадность. Не плати жадность.`,
    });
  }
  const highFloor =
    listing.floor != null &&
    (listing.floor >= 3 || (listing.totalFloors != null && listing.totalFloors >= 4 && listing.floor >= 2));
  if (listing.elevator === false && highFloor) {
    flags.push({
      code: "no-lift",
      severity: "bad",
      text: "Без лифта и не первый этаж. Для жизни это штраф каждый день.",
    });
  }
  if (profile.mustHaveElevator && listing.elevator === false) {
    flags.push({
      code: "lift-must",
      severity: "bad",
      text: "Лифт обязателен в твоих условиях. Это объявление не проходит.",
    });
  }
  if (listing.floor === 0) {
    flags.push({
      code: "bajo",
      severity: "warn",
      text: "Первый этаж: шум, взгляды, сырость. Смотри только если окна в патио и тихо.",
    });
  }
  if (listing.daysOnMarket != null && listing.daysOnMarket >= 90) {
    const cuts = listing.priceCuts ?? 0;
    flags.push({
      code: "stale",
      severity: cuts >= 1 ? "good" : "warn",
      text:
        cuts >= 1
          ? `Висит ${listing.daysOnMarket} дней и уже снижали цену. Продавец слабее. Торгуйся.`
          : `Висит ${listing.daysOnMarket} дней. Либо цена дутая, либо с квартирой что-то не так.`,
    });
  }
  if (
    listing.hasAc === false &&
    listing.floor != null &&
    listing.totalFloors != null &&
    listing.floor >= listing.totalFloors - 1
  ) {
    flags.push({
      code: "attic-heat",
      severity: "bad",
      text: "Верхний этаж без кондиционера. Июль в Аликанте это не теория.",
    });
  }
  if (district.scores.flood >= 6) {
    flags.push({
      code: "flood",
      severity: "bad",
      text: `${district.nameRu}: сначала вода и порт, потом цена.`,
    });
  }
  if (district.scores.touristPressure >= 8 && profile.want === "quiet") {
    flags.push({
      code: "tourist",
      severity: "bad",
      text: "Ты хотел тихо. Здесь соседи часто на три дня.",
    });
  }
  if (!profile.hasCar && district.scores.carNeed >= 7) {
    flags.push({
      code: "car",
      severity: "bad",
      text: "Без машины этот район не сходится.",
    });
  }
  if (fit.lifeScore >= 62 && listing.priceEur <= profile.maxBudgetEur) {
    flags.push({
      code: "area-ok",
      severity: "good",
      text: `${district.nameRu} под твои условия живой. Дальше дом, не район.`,
    });
  }
  return flags;
}

export const DEFAULT_PROFILE: BuyerProfile = {
  maxBudgetEur: 250000,
  minRooms: 2,
  want: "city",
  hasCar: false,
  mustHaveElevator: true,
};
