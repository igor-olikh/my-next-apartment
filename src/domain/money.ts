/** Resale in Comunitat Valenciana since 1 Jun 2026: ITP 9% + ~2% notary/registry/gestoría. */
export const ITP_RATE = 0.09;
export const FORMALITIES_RATE = 0.02;

export function cashToMoveIn(priceEur: number): number {
  return Math.round(priceEur * (1 + ITP_RATE + FORMALITIES_RATE));
}

export function typicalSqm(minRooms: number): number {
  if (minRooms >= 4) return 110;
  if (minRooms >= 3) return 95;
  if (minRooms >= 2) return 78;
  return 50;
}

export function typicalAsk(eurPerM2: number, minRooms: number): number {
  return Math.round(eurPerM2 * typicalSqm(minRooms));
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " €";
}

export function formatM2(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " €/м²";
}

export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;
}
