import { STATIC_CATALOG, type Catalog } from "../runtime/catalog";
import { formatEur, formatM2, formatPct } from "./money";
import { findRentOpportunities } from "./rent";
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
    if (profile.place === "campello") {
      return `Море в Кампельо за ${formatEur(profile.maxBudgetEur)} почти не купить. Пляж посёлка ~3 305 €/м², Мучависта 4 532. Посёлок дешевле, но это не песок под окном.`;
    }
    return `Море в Аликанте за ${formatEur(profile.maxBudgetEur)} почти не купить. Сан-Хуан ~4 100 €/м². Рядом Эль-Кампельо: пляж посёлка 3 305, посёлок 2 199.`;
  }
  if (picks.length === 0 && profile.want === "beach" && !profile.hasCar) {
    if (profile.place === "campello") {
      return "Море без машины в Кампельо почти пусто. Либо пляж у трамвая, либо машина, либо не море.";
    }
    return "Море без машины в этом бюджете почти пусто. Либо Альбуферета у трамвая, либо Эль-Кампельо у L1, либо машина, либо не море.";
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
    if (profile.place === "campello") {
      return `Это не Аликанте. Город здесь — посёлок. С ${formatEur(profile.maxBudgetEur)}, ${roomsInstr(profile.minRooms)}, ${car} смотри ${head}${rest.length ? ", потом " + rest.join(" и ") : ""}.`;
    }
    return `С ${formatEur(profile.maxBudgetEur)}, ${roomsInstr(profile.minRooms)}, ${car} смотри ${head}${rest.length ? ", потом " + rest.join(" и ") : ""}. Море будет прогулкой, не адресом.`;
  }
  if (profile.want === "beach") {
    if (profile.place === "campello") {
      return `Море в Кампельо — ${head}${rest.length ? " или " + rest.join(" / ") : ""}. Мучависта дороже Сан-Хуана, не экономия. ${lift}`.trim();
    }
    return `Море за эти деньги — ${head}${rest.length ? " или " + rest.join(" / ") : ""}. Не первая линия как план А. ${lift}`.trim();
  }
  if (profile.place === "campello") {
    return `Тихо в Кампельо за ${formatEur(profile.maxBudgetEur)} — ${head}${rest.length ? ", иначе " + rest.join(" или ") : ""}. Мучависта летом снимаем.`;
  }
  return `Тихо за ${formatEur(profile.maxBudgetEur)} — ${head}${rest.length ? ", иначе " + rest.join(" или ") : ""}. Центр ночью и Сан-Хуан летом снимаем.`;
}

function marketLines(profile: BuyerProfile, ranked: DistrictFit[], cat: Catalog): string[] {
  const m = cat.marketOf(profile.place);
  const lines =
    profile.place === "campello"
      ? [
          `Эль-Кампельо ${formatM2(m.eurPerM2)}, за год ${formatPct(m.yoyPct)}, за три месяца ${formatPct(m.threeMonthPct)}. После бешеного 2025 рост почти встал. Аликанте город — 2 705.`,
          m.note,
        ]
      : [
          `Город на историческом максимуме объявлений: ${formatM2(m.eurPerM2)}. За год ${formatPct(m.yoyPct)}, за три месяца ${formatPct(m.threeMonthPct)}. Испания растёт быстрее (${formatPct(m.spainYoyPct)}). Аликанте уже дорогой, но не самый жадный.`,
          m.note,
        ];
  if (profile.place === "alicante" && profile.want === "beach") {
    lines[1] =
      "Пляж продаёт август. Сан-Хуан ещё плюс. Рядом Эль-Кампельо: свой город, то же море, посёлок 2 199 €/м². Мучависта уже дороже Сан-Хуана.";
  }
  if (ranked.filter((f) => f.affordable && f.lifeScore >= 52).length === 0) {
    lines.push("В твоём срезе живых районов почти нет. Рынок не «подожди скидку». Ты просишь то, чего за эти деньги мало.");
  }
  return lines.slice(0, 2);
}

function ignoreLines(profile: BuyerProfile, picks: DistrictFit[], skipIds: Set<string>, cat: Catalog): string[] {
  const lines: string[] = [];
  const ignored = ignoredFits(profile, picks, cat);

  for (const f of ignored) {
    const d = f.district;
    if (skipIds.has(d.id)) continue;
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
    if (d.id === "muchavista") why = "Дороже Сан-Хуана. Это курортная полоса, не посёлок.";
    if (d.id === "campello-pueblo" && profile.want === "beach") why = "Посёлок живой, но песок не под окном.";
    lines.push(`${d.nameRu} — ${why}`);
  }

  if (profile.want !== "beach") {
    lines.push("«5 минут до пляжа» через трассу — не море.");
  }
  if (profile.mustHaveElevator) {
    lines.push("Ático без лифта и bajo на шумной улице — сразу закрывать.");
  }
  lines.push("Лицензия turística и «инвест + жить» — не этот поиск. Живая аренда жильцов — сигнал, что район работает.");

  return lines.slice(0, 7);
}

function actions(profile: BuyerProfile, picks: DistrictFit[]): string[] {
  const first = picks[0];
  const list: string[] = [];
  if (first) {
    list.push(
      `Пройди ${first.district.nameRu} в будни утром и ещё раз после 21:00. ${first.district.viewRule}`,
    );
  } else {
    list.push("Не листай Idealista «на удачу». Сначала отпусти одно условие: море, комнаты или потолок.");
  }
  if (profile.place === "alicante" && profile.want === "beach") {
    list.push("Сравни Сан-Хуан с Эль-Кампельо в один день: трамвай L1, посёлок и пляж посёлка. Мучависту не принимай за экономию.");
  } else if (profile.place === "campello") {
    list.push("Не путай посёлок, пляж Кампельо и Мучависту. Три разных рынка. Один день — три прогулки.");
  } else {
    list.push(
      "В объявлении сразу закрывай: без лифта выше второго, «инвест», метры без плана, фото только заката.",
    );
  }
  list.push(
    "На просмотре: nota simple, comunidad и долги дома, ориентация, сколько дверей — туристы. Две минуты у открытого окна. Август врёт. Нужен ещё январь.",
  );
  return list.slice(0, 3);
}

export function buildBriefing(profile: BuyerProfile, cat: Catalog = STATIC_CATALOG): Briefing {
  const ranked = rankDistricts(profile, cat);
  const picks = recommended(profile, cat);
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
  const m = cat.marketOf(profile.place);
  const evidence = `срез: ${roomsRu(profile.minRooms)}, ${WANT_RU[profile.want]}, ${profile.hasCar ? "машина" : "без машины"} · медиана ${m.nameRu.toLowerCase()} ${formatM2(m.eurPerM2)} · ${inBudget} живых районов в бюджете`;
  const rentOps = findRentOpportunities(profile, picks, cat);
  const rentKeep = new Set(rentOps.filter((o) => o.kind !== "yield_trap").map((o) => o.districtId));

  return {
    kind,
    verdict,
    evidence,
    marketLines: marketLines(profile, ranked, cat),
    recommended: picks,
    rentOps,
    ignored: ignoreLines(profile, picks, rentKeep, cat),
    actions: actions(profile, picks),
    traps: picks.map((p) => p.district.trap),
  };
}
