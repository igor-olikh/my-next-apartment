import { useMemo, useState } from "react";
import { CITY, SOURCES } from "../data/market";
import { DISTRICTS } from "../data/districts";
import { buildBriefing } from "../domain/briefing";
import { cashToMoveIn, formatEur, formatM2, formatPct } from "../domain/money";
import { DEFAULT_PROFILE, flagListing } from "../domain/score";
import type { BuyerProfile, DistrictFit, LifeWant, ListingFlag, RentKind } from "../domain/types";

const WANTS: { id: LifeWant; label: string }[] = [
  { id: "quiet", label: "тихо" },
  { id: "city", label: "город" },
  { id: "beach", label: "море" },
];

function stamp(fit: DistrictFit): string {
  if (fit.outOfReach) return "только если поднять потолок";
  if (fit.stretch) return "впритык";
  if (fit.lifeScore >= 68) return "тебе да";
  return "компромисс";
}

function rentStamp(kind: RentKind): string {
  if (kind === "rent_instead") return "снять";
  if (kind === "people_pay") return "люди снимают";
  return "осторожно";
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

  const brief = useMemo(() => buildBriefing(profile), [profile]);

  function patch(p: Partial<BuyerProfile>) {
    setProfile((prev) => ({ ...prev, ...p }));
    setFlags(null);
  }

  return (
    <div className="page">
      <header className="letterhead">
        <p className="kicker">Следующая квартира</p>
        <p className="place">Аликанте · жить, не сдавать</p>
        <p className="dates">
          Брифинг {CITY.briefingDate} · снимок рынка {CITY.asOf}
        </p>
      </header>

      <form className="profile" onSubmit={(e) => e.preventDefault()}>
        <p className="hint">Это не анкета. Подвинь — текст перепишется.</p>
        <label className="field">
          <span>Потолок</span>
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
          <span className="lbl">Комнаты</span>
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
        <div className="row">
          <span className="lbl">Жизнь</span>
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
              да
            </button>
          </div>
        </div>
        <div className="row">
          <span className="lbl">Лифт</span>
          <div className="stamps">
            <button
              type="button"
              className={profile.mustHaveElevator ? "on" : ""}
              onClick={() => patch({ mustHaveElevator: true })}
            >
              обязателен
            </button>
            <button
              type="button"
              className={!profile.mustHaveElevator ? "on" : ""}
              onClick={() => patch({ mustHaveElevator: false })}
            >
              не фильтр
            </button>
          </div>
        </div>
      </form>

      <section className="verdict">
        <p className="section">Вердикт</p>
        <h1>{brief.verdict}</h1>
        <p className="evidence">{brief.evidence}</p>
      </section>

      <section>
        <p className="section">Что мы знаем сейчас</p>
        <p className="nums">
          <span>
            {formatM2(CITY.eurPerM2)}
            <small>город</small>
          </span>
          <span>
            {formatPct(CITY.yoyPct)}
            <small>за год</small>
          </span>
          <span>
            {formatM2(CITY.tinsaEurPerM2)}
            <small>оценка банка</small>
          </span>
          <span>
            {formatPct(CITY.threeMonthPct)}
            <small>за 3 месяца</small>
          </span>
        </p>
        {brief.marketLines.map((line) => (
          <p key={line} className="body">
            {line}
          </p>
        ))}
      </section>

      <section>
        <p className="section">Где жить</p>
        {brief.recommended.length === 0 ? (
          <p className="body">Тройки нет. Сначала отпусти одно условие.</p>
        ) : (
          brief.recommended.map((fit, i) => (
            <article key={fit.district.id} className="district">
              <p className="ord">
                {i + 1} · {stamp(fit)}
              </p>
              <h2>{fit.district.nameRu}</h2>
              <p className="es">{fit.district.nameEs}</p>
              <p className="body">{fit.district.character}</p>
              <ul>
                {fit.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="price">
                Твоя квартира, ориентир: {formatEur(fit.typicalAskEur)} за ~{fit.typicalSqm} м².
                С налогом и оформлением ≈ {formatEur(fit.cashToMoveIn)}.
                {fit.district.price.quality === "estimated" ? " Цена района — оценка." : ""}
              </p>
              <p className="trap">Ловушка: {fit.district.trap}</p>
              <p className="rule">Без чего не смотреть: {fit.district.viewRule}</p>
            </article>
          ))
        )}
        <p className="note">Остальные районы не забыты. Они ниже, в отказе.</p>
      </section>

      {brief.rentOps.length > 0 && (
        <section>
          <p className="section">Аренда, которую нельзя пропустить</p>
          <p className="body">
            Не сдача туристам. Если люди здесь живут за свои деньги — район работает. Иногда снять умнее, чем купить
            край.
          </p>
          {brief.rentOps.map((op) => (
            <article key={op.kind + op.districtId} className="district">
              <p className="ord">{rentStamp(op.kind)}</p>
              <h2>{op.headline}</h2>
              <p className="body">{op.why}</p>
              <p className="trap">{op.caution}</p>
            </article>
          ))}
        </section>
      )}

      <section>
        <p className="section">Что игнорировать</p>
        <ul className="ignore">
          {brief.ignored.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="section">Что делать</p>
        <ol className="do">
          {brief.actions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section className="check">
        <p className="section">Пришло объявление</p>
        <p className="body">Не каталог. Одна карточка с сайта — суд за 10 секунд.</p>
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
              {DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameRu}
                </option>
              ))}
            </select>
          </label>
          <label>
            Цена €
            <input
              type="number"
              value={listing.priceEur}
              onChange={(e) => setListing({ ...listing, priceEur: Number(e.target.value) })}
            />
          </label>
          <label>
            м²
            <input
              type="number"
              value={listing.sqm}
              onChange={(e) => setListing({ ...listing, sqm: Number(e.target.value) })}
            />
          </label>
          <label>
            Комнаты
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
            Дней висит
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
          <button type="submit">Суд</button>
        </form>
        {flags && (
          <ul className="flags">
            {flags.length === 0 ? (
              <li>Ничего кричащего. Всё равно: comunidad, ориентация, соседи-туристы.</li>
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
          Квартира за {formatEur(listing.priceEur)} ≈ {formatEur(cashToMoveIn(listing.priceEur))} чтобы въехать (ITP
          9% + оформление).
        </p>
      </section>

      <footer>
        <p>
          {CITY.source}. {CITY.note} Система не покупает за тебя. Нет в модели: ремонт, ориентация, реальный шум,
          долги на доме, nota simple.
        </p>
        <ul>
          {SOURCES.map((s) => (
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
