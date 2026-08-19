export interface ParsedDelta {
  oneMonth: number | null;
  threeMonths: number | null;
  twelveMonths: number | null;
}

export interface ParsedDistrict {
  name: string;
  saleEurPerM2: number | null;
  rentEurPerM2: number | null;
  saleDelta: ParsedDelta | null;
  rentDelta: ParsedDelta | null;
}

export interface ParsedPlace {
  name: string;
  saleEurPerM2: number;
  rentEurPerM2: number | null;
  asOf: string;
  yoyPct: number | null;
  rentYoyPct: number | null;
  threeMonthPct: number | null;
  districts: ParsedDistrict[];
}

interface EvoPoint {
  period: string;
  meanPriceSqm: number;
}

function periodToAsOf(period: string): string {
  if (!/^\d{8}$/.test(period)) return period;
  return `${period.slice(0, 4)}-${period.slice(4, 6)}`;
}

function shiftPeriod(period: string, months: number): string {
  const y = Number(period.slice(0, 4));
  const m = Number(period.slice(4, 6));
  const d = period.slice(6, 8);
  const dt = new Date(Date.UTC(y, m - 1 - months, 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}${mm}${d}`;
}

function deltaFromEvo(series: EvoPoint[], months: number): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  if (!last?.meanPriceSqm) return null;
  const want = shiftPeriod(last.period, months);
  const prev = series.find((p) => p.period === want);
  if (!prev?.meanPriceSqm) return null;
  return ((last.meanPriceSqm - prev.meanPriceSqm) / prev.meanPriceSqm) * 100;
}

function readDelta(raw: unknown): ParsedDelta | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const num = (k: string) => (typeof o[k] === "number" ? o[k] : null);
  return {
    oneMonth: num("oneMonth"),
    threeMonths: num("threeMonths"),
    twelveMonths: num("twelveMonths"),
  };
}

export function parseFotocasaIndex(html: string): ParsedPlace {
  const m = html.match(/id="__initial_props__">(\{[\s\S]*?)<\/script>/);
  if (!m) throw new Error("fotocasa: нет __initial_props__");
  const data = JSON.parse(m[1]) as {
    municipality?: {
      name?: string;
      medianPriceSqm?: number;
      meanPriceSqm?: number;
      priceEvolution?: { sale?: EvoPoint[]; rent?: EvoPoint[] };
      districts?: Array<{
        name?: string;
        medianPriceSqm?: number;
        medianRentPriceSqm?: number;
        sellPriceIndexDelta?: unknown;
        rentPriceIndexDelta?: unknown;
      }>;
    };
  };
  const mun = data.municipality;
  if (!mun?.name) throw new Error("fotocasa: нет municipality");
  const saleEvo = mun.priceEvolution?.sale ?? [];
  const rentEvo = mun.priceEvolution?.rent ?? [];
  const lastSale = saleEvo[saleEvo.length - 1];
  const lastRent = rentEvo[rentEvo.length - 1];
  const sale = lastSale?.meanPriceSqm ?? mun.meanPriceSqm ?? mun.medianPriceSqm;
  if (!sale) throw new Error("fotocasa: нет цены продажи");
  return {
    name: mun.name,
    saleEurPerM2: sale,
    rentEurPerM2: lastRent?.meanPriceSqm ?? null,
    asOf: lastSale?.period ? periodToAsOf(lastSale.period) : "unknown",
    yoyPct: deltaFromEvo(saleEvo, 12),
    rentYoyPct: deltaFromEvo(rentEvo, 12),
    threeMonthPct: deltaFromEvo(saleEvo, 3),
    districts: (mun.districts ?? []).map((d) => ({
      name: d.name ?? "",
      saleEurPerM2: d.medianPriceSqm ?? null,
      rentEurPerM2: d.medianRentPriceSqm ?? null,
      saleDelta: readDelta(d.sellPriceIndexDelta),
      rentDelta: readDelta(d.rentPriceIndexDelta),
    })),
  };
}
