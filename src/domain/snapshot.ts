import type { PlaceId } from "./types";

export interface SnapshotDistrict {
  id: string;
  sourceName: string;
  saleEurPerM2: number;
  rentEurPerM2: number | null;
  yoyPct: number | null;
  rentYoyPct: number | null;
  asOf: string;
  source: string;
}

export interface SnapshotPlace {
  saleEurPerM2: number;
  rentEurPerM2: number | null;
  asOf: string;
  yoyPct: number | null;
  rentYoyPct: number | null;
  threeMonthPct: number | null;
  source: string;
  districts: SnapshotDistrict[];
}

export interface MarketSnapshot {
  takenAt: string;
  source: "fotocasa";
  places: Record<PlaceId, SnapshotPlace>;
  tinsaEurPerM2: number | null;
  spainSaleEurPerM2: number | null;
  spainYoyPct: number | null;
  errors: string[];
}

export interface CollectStatus {
  lastCollectAt: string | null;
  lastOk: boolean;
  lastError: string | null;
  snapshotTakenAt: string | null;
  snapshotAsOf: string | null;
  nextCollectAt: string | null;
}
