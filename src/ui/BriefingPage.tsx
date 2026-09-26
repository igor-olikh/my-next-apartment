import { useEffect, useMemo, useState } from "react";
import { mapsUrl } from "../data/maps";
import { SOURCES } from "../data/market";
import { buildBriefing } from "../domain/briefing";
import { cashToMoveIn, formatEur, formatM2, formatMonth, formatPct } from "../domain/money";
import type { CollectStatus, MarketSnapshot } from "../domain/snapshot";
import { DEFAULT_PROFILE, flagListing } from "../domain/score";
import { STATIC_CATALOG, createCatalog } from "../runtime/catalog";
import type { BuyerProfile, DistrictFit, Goal, LetFit, LifeWant, ListingFlag, PlaceId } from "../domain/types";

const WANTS: { id: LifeWant; label: string }[] = [
  { id: "quiet", label: "тихо" },
  { id: "city", label: "город" },
  { id: "beach", label: "море" },
];

const PLACES: { id: PlaceId; label: string }[] = [
  { id: "alicante", label: "Alicante" },
  { id: "campello", label: "El Campello" },
];

const LISTING_SEED: Record<PlaceId, string> = {
  alicante: "benalua",
  campello: "campello-pueblo",
};

function stamp(fit: DistrictFit): string {
  if (fit.outOfReach) return "в эти деньги не купить";
  if (fit.stretch) return "дорого, но это та жизнь";
  if (fit.lifeScore >= 68) return "подходит";
  return "можно, с оговоркой";
}

function letStamp(fit: LetFit): string {
  if (fit.stamp === "can_let") return "можно сдавать";
  if (fit.stamp === "caution") return "осторожно";
  return "не это";
}

export function BriefingPage() {
  const [profile, setProfile] = useState<BuyerProfile>(DEFAULT_PROFILE);
  const [listing, setListing] = useState({
    districtId: "benalua",
    priceEur: 210000,
    sqm: 78,
    rooms: 2,
    floor: 3,
    elevator: true,
    daysOnMarket: 40,
  });
  const [flags, setFlags] = useState<ListingFlag[] | null>(null);
  const [catalog, setCatalog] = useState(STATIC_CATALOG);
  const [status, setStatus] = useState<CollectStatus | null>(null);

  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("goal");
    if (g === "let" || g === "live") {
      setProfile((prev) => ({ ...prev, goal: g }));
    }
    void Promise.all([
      fetch("/api/snapshot").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/status").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([snap, st]: [MarketSnapshot | null, CollectStatus | null]) => {
        if (snap?.places) setCatalog(createCatalog(snap));
        if (st) setStatus(st);
      })
      .catch(() => {
        /* офлайн */
      });
  }, []);

  const brief = useMemo(() => buildBriefing(profile, catalog), [profile, catalog]);
  const market = catalog.marketOf(profile.place);
  const placeDistricts = catalog.districtsIn(profile.place);

  function patch(p: Partial<BuyerProfile>) {
    setProfile((prev) => ({ ...prev, ...p }));
    setFlags(null);
    if (p.place) {
      setListing((prev) => ({ ...prev, districtId: LISTING_SEED[p.place!] }));
    }
  }

  return (
    <div className="page">
      <header className="letterhead">
        <p className="kicker">Следующая квартира</p>
        <p className="give">
          {profile.goal === "let" ? (
            <>
              Это ответ: <strong>куда купить, чтобы сдавать жильцам</strong>, не туристам. Не каталог. Не Airbnb.
              Три района, грубый процент, чего не брать.
            </>
          ) : (
            <>
              Это ответ: <strong>куда смотреть жильё, чтобы жить самому</strong>, за твои деньги. Не каталог
              объявлений. Три района, цена, чего избегать.
            </>
          )}
        </p>
        <p className="dates">
          {market.nameRu}. Цены из объявлений, {market.asOf}. Сами обновляются.
          {status?.lastOk === false && status.lastError ? " Последний заход за ценами не вышел — на экране прошлый снимок." : ""}
        </p>
      </header>

      <form className="profile" onSubmit={(e) => e.preventDefault()}>
        <p className="hint">Поставь условия. Текст ниже — ответ только на выбранный вопрос.</p>
        <div className="row">
          <span className="lbl">Зачем</span>
          <div className="stamps">
            {(
              [
                { id: "live" as Goal, label: "жить" },
                { id: "let" as Goal, label: "сдавать" },
              ] as const
            ).map((g) => (
              <button
                key={g.id}
                type="button"
                className={profile.goal === g.id ? "on" : ""}
                onClick={() => patch({ goal: g.id })}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span className="lbl">Город</span>
          <div className="stamps">
            {PLACES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={profile.place === p.id ? "on" : ""}
                onClick={() => patch({ place: p.id })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Бюджет</span>
          <input
            type="range"
            min={150000}
            max={550000}
            step={10000}
            value={profile.maxBudgetEur}
            onChange={(e) => patch({ maxBudgetEur: Number(e.target.value) })}
          />
          <b>{formatEur(profile.maxBudgetEur)}</b>
        </label>
        <div className="row">
          <span className="lbl">Спальни</span>
          <div className="stamps">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={profile.minRooms === n ? "on" : ""}
                onClick={() => patch({ minRooms: n })}
              >
                {n === 4 ? "4+" : n}
              </button>
            ))}
          </div>
        </div>
        {profile.goal === "live" && (
          <>
            <div className="row">
              <span className="lbl">Хочу</span>
              <div className="stamps">
                {WANTS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={profile.want === w.id ? "on" : ""}
                    onClick={() => patch({ want: w.id })}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="row">
              <span className="lbl">Машина</span>
              <div className="stamps">
                <button type="button" className={!profile.hasCar ? "on" : ""} onClick={() => patch({ hasCar: false })}>
                  нет
                </button>
                <button type="button" className={profile.hasCar ? "on" : ""} onClick={() => patch({ hasCar: true })}>
                  есть
                </button>
              </div>
            </div>
          </>
        )}
        <div className="row">
          <span className="lbl">Лифт</span>
          <div className="stamps">
            <button
              type="button"
              className={profile.mustHaveElevator ? "on" : ""}
              onClick={() => patch({ mustHaveElevator: true })}
            >
              нужен
            </button>
            <button
              type="button"
              className={!profile.mustHaveElevator ? "on" : ""}
              onClick={() => patch({ mustHaveElevator: false })}
            >
              не важен
            </button>
          </div>
        </div>
      </form>

      <section className="verdict">
        <p className="section">Куда тебе</p>
        <h1>{brief.verdict}</h1>
        <p className="evidence">{brief.evidence}</p>
      </section>

      <section>
        <p className="section">Что происходит с ценами</p>
        <p className="nums">
          <span>
            {formatM2(market.eurPerM2)}
            <small>просят в объявлениях</small>
          </span>
          <span>
            {formatPct(market.yoyPct)}
            <small>за год</small>
          </span>
          {market.tinsaEurPerM2 != null && (
            <span>
              {formatM2(market.tinsaEurPerM2)}
              <small>примерно думает банк</small>
            </span>
          )}
        </p>
        {brief.marketLines.map((line) => (
          <p key={line} className="body">
            {line}
          </p>
        ))}
      </section>

      <section>
        <p className="section">{profile.goal === "let" ? "Куда купить под сдачу" : "Смотри эти районы"}</p>
        {profile.goal === "let" ? (
          brief.letPicks.length === 0 ? (
            <p className="body">Под сдачу жильцам в эти деньги почти нечего. Не бери пляж «ради процента».</p>
          ) : (
            brief.letPicks.map((fit, i) => (
              <article key={fit.district.id} className="district">
                <p className="ord">
                  {i + 1}. {letStamp(fit)}
                </p>
                <h2>
                  <a href={mapsUrl(fit.district.id)} target="_blank" rel="noreferrer">
                    {fit.district.nameEs}
                  </a>
                </h2>
                <p className="body">{fit.district.character}</p>
                <p className="price">
                  Купить похожую квартиру: около {formatEur(fit.typicalAskEur)}. Жилец за твои метры — примерно{" "}
                  {formatMonth(fit.monthEur)}. Грубо {fit.yieldPct.toFixed(1)}% в год с цены покупки, до налога и пустых
                  месяцев.
                  {fit.stretch ? " Покупка больше бюджета: торг или меньше метров." : ""}
                </p>
                {fit.reasons.map((r) => (
                  <p key={r} className="body">
                    {r}
                  </p>
                ))}
                <p className="trap">Осторожно: {fit.district.trap}</p>
              </article>
            ))
          )
        ) : brief.recommended.length === 0 ? (
          <p className="body">Под эти условия покупать почти нечего. Подвинь бюджет, спальни или «хочу».</p>
        ) : (
          brief.recommended.map((fit, i) => (
            <article key={fit.district.id} className="district">
              <p className="ord">
                {i + 1}. {stamp(fit)}
              </p>
              <h2>
                <a href={mapsUrl(fit.district.id)} target="_blank" rel="noreferrer">
                  {fit.district.nameEs}
                </a>
              </h2>
              <p className="body">{fit.district.character}</p>
              <p className="price">
                Похожая квартира в этом районе: около {formatEur(fit.typicalAskEur)}. Чтобы заехать, сверху налог —
                выйдет примерно {formatEur(fit.cashToMoveIn)}.
                {fit.stretch ? " Это больше твоего бюджета: либо торг, либо меньше метров, либо другой район ниже." : ""}
                {fit.outOfReach ? " В твои деньги это не покупается." : ""}
              </p>
              <p className="trap">Осторожно: {fit.district.trap}</p>
              <p className="rule">Если пойдёшь смотреть: {fit.district.viewRule}</p>
            </article>
          ))
        )}
      </section>

      <section>
        <p className="section">Сделай на этой неделе</p>
        <ol className="do">
          {brief.actions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="section">Сюда не ходи</p>
        <ul className="ignore">
          {brief.ignored.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="check">
        <p className="section">Увидел объявление</p>
        <p className="body">Впиши цифры с карточки. Скажет: дорого, странно дёшево, или лифт — нет.</p>
        <form
          className="listing"
          onSubmit={(e) => {
            e.preventDefault();
            setFlags(
              flagListing(
                {
                  districtId: listing.districtId,
                  priceEur: listing.priceEur,
                  sqm: listing.sqm,
                  rooms: listing.rooms,
                  floor: listing.floor,
                  totalFloors: listing.floor != null ? Math.max(listing.floor + 1, 5) : null,
                  elevator: listing.elevator,
                  daysOnMarket: listing.daysOnMarket,
                  priceCuts: listing.daysOnMarket >= 90 ? 1 : 0,
                  hasAc: null,
                },
                profile,
                catalog,
              ),
            );
          }}
        >
          <label>
            Район
            <select
              value={listing.districtId}
              onChange={(e) => setListing({ ...listing, districtId: e.target.value })}
            >
              {placeDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEs}
                </option>
              ))}
            </select>
          </label>
          <label>
            Цена в объявлении, €
            <input
              type="number"
              value={listing.priceEur}
              onChange={(e) => setListing({ ...listing, priceEur: Number(e.target.value) })}
            />
          </label>
          <label>
            Метры
            <input
              type="number"
              value={listing.sqm}
              onChange={(e) => setListing({ ...listing, sqm: Number(e.target.value) })}
            />
          </label>
          <label>
            Спальни
            <input
              type="number"
              value={listing.rooms}
              onChange={(e) => setListing({ ...listing, rooms: Number(e.target.value) })}
            />
          </label>
          <label>
            Этаж
            <input
              type="number"
              value={listing.floor}
              onChange={(e) => setListing({ ...listing, floor: Number(e.target.value) })}
            />
          </label>
          <label>
            Сколько дней висит
            <input
              type="number"
              value={listing.daysOnMarket}
              onChange={(e) => setListing({ ...listing, daysOnMarket: Number(e.target.value) })}
            />
          </label>
          <label className="check-lift">
            <input
              type="checkbox"
              checked={listing.elevator}
              onChange={(e) => setListing({ ...listing, elevator: e.target.checked })}
            />
            Есть лифт
          </label>
          <button type="submit">Проверить</button>
        </form>
        {flags && (
          <ul className="flags">
            {flags.length === 0 ? (
              <li>В цифрах ничего странного. Всё равно сходи и послушай улицу вечером.</li>
            ) : (
              flags.map((f) => (
                <li key={f.code} className={f.severity}>
                  {f.text}
                </li>
              ))
            )}
          </ul>
        )}
        <p className="note">
          К цене в объявлении сверху налог штата, около 11%. За {formatEur(listing.priceEur)} въехать выйдет примерно{" "}
          {formatEur(cashToMoveIn(listing.priceEur))}.
        </p>
      </section>

      <footer>
        <p>
          Цифры берём из открытых индексов объявлений. Раз в неделю сами. Это не то, что в итоге заплатят при сделке.
          Система не покупает за тебя.
        </p>
        {status?.lastError ? <p>Заход за ценами не вышел: {status.lastError}. На экране прошлые цифры.</p> : null}
        <ul>
          {SOURCES.slice(0, 4).map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
