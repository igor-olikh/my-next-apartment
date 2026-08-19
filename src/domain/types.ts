export type LifeWant = "quiet" | "city" | "beach";

export interface BuyerProfile {
  maxBudgetEur: number;
  minRooms: number;
  want: LifeWant;
  hasCar: boolean;
  mustHaveElevator: boolean;
}

export interface DistrictScores {
  walkability: number;
  quiet: number;
  services: number;
  sea: number;
  carNeed: number;
  summer: number;
  winter: number;
  stock: number;
  touristPressure: number;
  flood: number;
  hills: number;
  elevatorShare: number;
}

export interface DistrictPrice {
  eurPerM2: number;
  asOf: string;
  yoyPct: number | null;
  source: string;
  quality: "reported" | "estimated";
}

export interface District {
  id: string;
  nameRu: string;
  nameEs: string;
  character: string;
  trap: string;
  viewRule: string;
  scores: DistrictScores;
  price: DistrictPrice;
}

export interface CityMarket {
  nameRu: string;
  asOf: string;
  briefingDate: string;
  eurPerM2: number;
  tinsaEurPerM2: number;
  yoyPct: number;
  threeMonthPct: number;
  spainEurPerM2: number;
  spainYoyPct: number;
  source: string;
  note: string;
}

export interface DistrictFit {
  district: District;
  lifeScore: number;
  typicalAskEur: number;
  typicalSqm: number;
  cashToMoveIn: number;
  affordable: boolean;
  stretch: boolean;
  reasons: string[];
  warnings: string[];
  outOfReach: boolean;
}

export type VerdictKind = "path" | "conflict" | "broke";

export interface ListingInput {
  districtId: string;
  priceEur: number;
  sqm: number;
  rooms: number;
  floor: number | null;
  totalFloors: number | null;
  elevator: boolean | null;
  daysOnMarket: number | null;
  priceCuts: number | null;
  hasAc: boolean | null;
}

export type FlagSeverity = "good" | "warn" | "bad";

export interface ListingFlag {
  code: string;
  severity: FlagSeverity;
  text: string;
}

export interface Briefing {
  kind: VerdictKind;
  verdict: string;
  evidence: string;
  marketLines: string[];
  recommended: DistrictFit[];
  ignored: string[];
  actions: string[];
  traps: string[];
}
