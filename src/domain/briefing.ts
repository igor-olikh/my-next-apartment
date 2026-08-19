import { CITY } from "../data/market";
import { formatEur, formatM2, formatPct } from "./money";
import { ignoredFits, matchesWant, rankDistricts, recommended } from "./score";
import type { Briefing, BuyerProfile, DistrictFit, VerdictKind } from "./types";

const WANT_RU = {
  quiet: "тихо",
  city: "город",
  beach: "море",
} as const;

function roomsRu(n: number): string {
  if (n === 1) return "1 комнату";
  if (n === 2) return "2 комнаты";
  if (n === 3) return "3 комнаты";
  return `${n} комнаты`;
}

function conflict(profile: BuyerProfile, picks: DistrictFit[]): string | null {
  if (
    profile.want === "beach" &&
    !profile.hasCar &&
    profile.maxBudgetEur < 280000 &&
    profile.minRooms >= 3
  ) {
    return "Море, три комнаты, без машины и этот потолок — так не бывает. Отпусти комнату, добавь машину или подними деньги.";
  }
  if (profile.want === "beach" && profile.maxBudgetEur < 220000) {
    return `Море в Аликанте за ${formatEur(profile.maxBudgetEur)} почти не купить. Типичный метр на Сан-Хуане — около 4 100 €. Это не город 2 705.`;
  }
  if (picks.length === 0 && profile.want === "beach" && !profile.hasCar) {
    return "Море без машины в этом бюджете почти пусто. Либо Альбуферета у трамвая с компромиссом, либо машина, либо не море.";
  }
  if (picks.length === 0) {
    return "Под эти условия живого пути нет. Не «мало красивых». Пусто.";
  }
  return null;
}

function lifestyleOk(f: DistrictFit, profile: BuyerProfile): boolean {
  const s = f.district.scores;
  if (profile.want === "beach") return s.sea >= 7;
  if (profile.want === "city") return s.walkability >= 7;
  return s.quiet >= 5 && s.touristPressure <= 6;
}

function broke(profile: BuyerProfile, ranked: DistrictFit[]): string | null {
  const pool = ranked.filter((f) => lifestyleOk(f, profile) && f.lifeScore >= 50);
  const anyInBudget = pool.some((f) => f.affordable);
  if (anyInBudget) return null;
  const cheapestOk = [...pool].sort((a, b) => a.typicalAskEur - b.typicalAskEur)[0];
  if (!cheapestOk) return null;
  if (cheapestOk.typicalAskEur > profile.maxBudgetEur * 1.05) {
    return `На ${formatEur(profile.maxBudgetEur)} этот класс жизни не покупается. Ориентир — ${formatEur(cheapestOk.typicalAskEur)} в районе ${cheapestOk.district.nameRu}.`;
  }
  return null;
}

function roomsInstr(n: number): string {
  if (n === 1) return "одной комнатой";
  if (n === 2) return "двумя комнатами";
  if (n === 3) return "тремя комнатами";
  return `${n} комнатами`;
}

function pathVerdict(profile: BuyerProfile, picks: DistrictFit[]): string {
  const names = picks.map((p) => p.district.nameRu);
  const car = profile.hasCar ? "с машиной" : "без машины";
  const lift = profile.mustHaveElevator ? "Лифт обязателен." : "";
  if (names.length === 0) {
    return `С ${formatEur(profile.maxBudgetEur)}, ${roomsRu(profile.minRooms)}, «${WANT_RU[profile.want]}», ${car} — пути нет.`;
  }
  const head = names[0];
  const rest = names.slice(1);
  const first = picks[0];
  const inBudget = picks.filter((p) => p.affordable).map((p) => p.district.nameRu);
  if (first.stretch && inBudget.length) {
    return `${head} — та жизнь, которую ты просишь, но ориентир ${formatEur(first.typicalAskEur)}. В ${formatEur(profile.maxBudgetEur)} живёт ${inBudget.join(" и ")}.`;
  }
  if (profile.want === "city") {
    return `С ${formatEur(profile.maxBudgetEur)}, ${roomsInstr(profile.minRooms)}, ${car} смотри ${head}${rest.length ? ", потом " + rest.join(" и ") : ""}. Море будет прогулкой, не адресом.`;
  }
  if (profile.want === "beach") {
    return `Море за эти деньги — ${head}${rest.length ? " или " + rest.join(" / ") : ""}. Не первая линия как план А. ${lift}`.trim();
  }
  return `Тихо за ${formatEur(profile.maxBudgetEur)} — ${head}${rest.length ? ", иначе " + rest.join(" или ") : ""}. Центр ночью и Сан-Хуан летом снимаем.`;
}

function marketLines(profile: BuyerProfile, ranked: DistrictFit[]): string[] {
  const inBudget = ranked.filter((f) => f.affordable).length;
  const lines = [
    `Город на историческом максимуме объявлений: ${formatM2(CITY.eurPerM2)}. За год ${formatPct(CITY.yoyPct)}, за три месяца ${formatPct(CITY.threeMonthPct)}. Испания растёт быстрее (${formatPct(CITY.spainYoyPct)}). Аликанте уже дорогой, но не самый жадный.`,
    CITY.note,
  ];
  const slice = ranked.filter((f) => f.affordable && f.lifeScore >= 52);
  if (slice.length === 0) {
    lines.push("В твоём срезе живых районов почти нет. Рынок не «подожди скидку». Ты просишь то, чего за эти деньги мало.");
  } else if (profile.want === "beach") {
    lines.push("Пляж продаёт август. Сан-Хуан за год ещё плюс. Кабо по Fotocasa чуть остыл. Не решай по субботе на песке.");
  } else {
    lines.push(
      `Под твой срез в бюджете примерно ${inBudget} районов из ${ranked.length}. Дешёвый метр в Ремедио — не скидка. Это другая жизнь.`,
    );
  }
  return lines.slice(0, 2);
}

function ignoreLines(profile: BuyerProfile, picks: DistrictFit[]): string[] {
  const lines: string[] = [];
  const ignored = ignoredFits(profile, picks);

  for (const f of ignored) {
    const d = f.district;
    let why = d.trap;
    if (profile.want === "beach" && d.scores.sea <= 4) why = "Это не море. Не плати за слово «Аликанте».";
    if (profile.want === "city" && d.scores.walkability <= 5 && d.scores.carNeed >= 7) {
      why = "Это не город. Это жить в машине.";
    }
    if (d.id === "centro" && profile.mustHaveElevator) why = "Лифт обязателен — Каско почти закрыт.";
    if (d.id === "cabo-huertas" && !profile.hasCar) why = "Без машины Кабо — остров на скале.";
    if (d.id === "vistahermosa" && !profile.hasCar) why = "Тихо здесь значит далеко. Без машины не сходится.";
    if (d.id === "playa-san-juan" && profile.want === "quiet") why = "Ты хотел тихо. Сан-Хуан летом орёт, зимой пустеет.";
    if (d.id === "playa-san-juan" && profile.want === "city") why = "Это курорт рядом с городом, не город.";
    if (d.id === "virgen-remedio") why = "Самый дешёвый метр и +25% за год. Не бери «пока дёшево».";
    if (d.id === "san-gabriel") why = "Не море за копейки. Порт и вода.";
    lines.push(`${d.nameRu} — ${why}`);
  }

  if (profile.want !== "beach") {
    lines.push("«5 минут до пляжа» через трассу — не море.");
  }
  if (profile.mustHaveElevator) {
    lines.push("Ático без лифта и bajo на шумной улице — сразу закрывать.");
  }
  lines.push("Доходность, лицензия turística, «инвест + жить» — не этот поиск.");

  return lines.slice(0, 7);
}

function actions(_profile: BuyerProfile, picks: DistrictFit[]): string[] {
  const first = picks[0];
  const list: string[] = [];
  if (first) {
    list.push(
      `Пройди ${first.district.nameRu} в будни утром и ещё раз после 21:00. ${first.district.viewRule}`,
    );
  } else {
    list.push("Не листай Idealista «на удачу». Сначала отпусти одно условие: море, комнаты или потолок.");
  }
  list.push(
    "В объявлении сразу закрывай: без лифта выше второго, «инвест», метры без плана, фото только заката.",
  );
  list.push(
    "На просмотре: nota simple, comunidad и долги дома, ориентация, сколько дверей — туристы. Две минуты у открытого окна. Август врёт. Нужен ещё январь.",
  );
  return list.slice(0, 3);
}

export function buildBriefing(profile: BuyerProfile): Briefing {
  const ranked = rankDistricts(profile);
  const picks = recommended(profile);
  const brokeLine = broke(profile, ranked);
  const conflictLine = conflict(profile, picks);

  let kind: VerdictKind = "path";
  let verdict = pathVerdict(profile, picks);
  if (brokeLine) {
    kind = "broke";
    verdict = brokeLine;
  } else if (conflictLine) {
    kind = "conflict";
    verdict = conflictLine;
  }

  const inBudget = ranked.filter((f) => f.affordable && matchesWant(f, profile)).length;
  const evidence = `срез: ${roomsRu(profile.minRooms)}, ${WANT_RU[profile.want]}, ${profile.hasCar ? "машина" : "без машины"} · медиана города ${formatM2(CITY.eurPerM2)} · ${inBudget} живых районов в бюджете`;

  return {
    kind,
    verdict,
    evidence,
    marketLines: marketLines(profile, ranked),
    recommended: picks,
    ignored: ignoreLines(profile, picks),
    actions: actions(profile, picks),
    traps: picks.map((p) => p.district.trap),
  };
}
