import { STATIC_CATALOG, type Catalog } from "../runtime/catalog";
import { cityYieldPct, ignoredLet, recommendedLet } from "./let";
import { formatEur, formatM2, formatPct } from "./money";
import { ignoredFits, matchesWant, rankDistricts, recommended } from "./score";
import type { Briefing, BuyerProfile, DistrictFit, LetFit, VerdictKind } from "./types";

const WANT_RU = {
  quiet: "тихо",
  city: "город",
  beach: "море",
} as const;

function roomsRu(n: number): string {
  if (n === 1) return "1 спальню";
  if (n === 2) return "2 спальни";
  if (n === 3) return "3 спальни";
  return `${n} спальни`;
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
  const bank = m.tinsaEurPerM2;
  const lines =
    profile.place === "campello"
      ? [
          `В Эль-Кампельо продавцы просят ${formatM2(m.eurPerM2)}. За год ${formatPct(m.yoyPct)} — рост почти остановился. Это не Аликанте, это соседний город у того же моря.`,
          "Посёлок дешевле пляжа. Мучависта — продолжение Сан-Хуана, и она уже дороже. Не путай три разных места: посёлок, пляж Кампельо, Мучависта.",
        ]
      : [
          `Продавцы в объявлениях просят ${formatM2(m.eurPerM2)}. За год жильё подорожало на ${formatPct(m.yoyPct)}.`,
          bank
            ? `Банк обычно оценивает дешевле (около ${formatM2(bank)}). Разница — запас торга, не повод переплачивать «как все».`
            : m.note,
        ];
  if (profile.place === "alicante" && profile.want === "beach") {
    lines[1] =
      "Пляж в августе врёт. Сан-Хуан дорогой. Рядом свой город Эль-Кампельо: то же море, посёлок сильно дешевле. Переключи место сверху, если хочешь море.";
  }
  if (ranked.filter((f) => f.affordable && f.lifeScore >= 52).length === 0) {
    lines.push("Под эти условия почти нечего купить. Не жди скидку из воздуха. Отпусти море, комнату или бюджет.");
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
    lines.push("Последний этаж без лифта и первый этаж на шумной улице — сразу закрывать.");
  }
  lines.push("Объявления «для туристов» и «инвест + жить» — не твой поиск. Ты ищешь дом, в котором проснёшься в январе.");

  return lines.slice(0, 7);
}

function letVerdict(profile: BuyerProfile, picks: LetFit[], cat: Catalog): string {
  const cityY = cityYieldPct(profile.place, cat);
  if (picks.length === 0) {
    return `Под сдачу жильцам в ${formatEur(profile.maxBudgetEur)} живого пути нет. Не бери пляж и дешёвый край «ради процента».`;
  }
  const names = picks.map((p) => p.district.nameRu);
  const top = picks[0];
  return `Чтобы сдавать жильцам, не туристам: смотри ${names.join(", ")}. В ${top.district.nameRu} жилец за год даёт примерно ${top.yieldPct.toFixed(1)}% с цены покупки. В городе обычно ${cityY.toFixed(1)}%. Это до налога и пустых месяцев.`;
}

function letMarketLines(profile: BuyerProfile, cat: Catalog): string[] {
  const m = cat.marketOf(profile.place);
  const rent = cat.placeRent(profile.place);
  const cityY = cityYieldPct(profile.place, cat);
  return [
    `Покупка в ${m.nameRu}: продавцы просят ${formatM2(m.eurPerM2)}. Аренда жильцам: около ${rent.eurPerM2} € за метр в месяц.`,
    `Грубо по городу жилец за год даёт ${cityY.toFixed(1)}% от цены покупки. Дальше налог, пустые месяцы, ремонт. Пляж для гостей сюда не кладём.`,
  ];
}

function letActions(picks: LetFit[]): string[] {
  const first = picks[0];
  const list: string[] = [];
  if (first) {
    list.push(
      `Пройди ${first.district.nameRu} в будний день. Смотри, кто живёт в подъезде круглый год, не чемоданы.`,
    );
  } else {
    list.push("Не покупай «под туристов». Сначала жильцы на месяцы.");
  }
  list.push("В объявлении закрывай: лицензия туриста, только лето, дом без лифта выше второго.");
  list.push("На просмотре спроси: сколько платят за дом каждый месяц, сколько квартир пустует зимой.");
  return list.slice(0, 3);
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
    "На просмотре спроси: кто живёт в доме круглый год, сколько платят за дом каждый месяц, куда окна. Постой две минуты у открытого окна. Лето врёт — нужен ещё зимний день.",
  );
  return list.slice(0, 3);
}

export function buildBriefing(profile: BuyerProfile, cat: Catalog = STATIC_CATALOG): Briefing {
  if (profile.goal === "let") {
    const letPicks = recommendedLet(profile, cat);
    const cityY = cityYieldPct(profile.place, cat);
    const inBudget = letPicks.filter((f) => f.affordable).length;
    const n =
      inBudget === 1
        ? "1 район в бюджете"
        : inBudget >= 2 && inBudget <= 4
          ? `${inBudget} района в бюджете`
          : `${inBudget} районов в бюджете`;
    return {
      kind: letPicks.length === 0 ? "broke" : "path",
      verdict: letVerdict(profile, letPicks, cat),
      evidence: `Ищем: купить и сдать жильцам, ${roomsRu(profile.minRooms)}. ${n}. По городу грубо ${cityY.toFixed(1)}% в год до налога.`,
      marketLines: letMarketLines(profile, cat),
      recommended: [],
      letPicks,
      ignored: ignoredLet(profile, letPicks, cat),
      actions: letActions(letPicks),
      traps: letPicks.map((p) => p.district.trap),
    };
  }

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
  const n = inBudget === 1 ? "1 подходящий район" : inBudget >= 2 && inBudget <= 4 ? `${inBudget} подходящих района` : `${inBudget} подходящих районов`;
  const evidence = `Ищем: ${roomsRu(profile.minRooms)}, ${WANT_RU[profile.want]}, ${profile.hasCar ? "с машиной" : "без машины"}. В твои деньги сейчас ${n}. Метр в ${m.nameRu} просят ${formatM2(m.eurPerM2)}.`;

  return {
    kind,
    verdict,
    evidence,
    marketLines: marketLines(profile, ranked, cat),
    recommended: picks,
    letPicks: [],
    ignored: ignoreLines(profile, picks, new Set(), cat),
    actions: actions(profile, picks),
    traps: picks.map((p) => p.district.trap),
  };
}
