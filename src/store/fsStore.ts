import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CollectStatus, MarketSnapshot } from "../domain/snapshot";
import { seedSnapshot } from "../collect/collect";

export function dataDir(): string {
  return process.env.DATA_DIR || join(process.cwd(), "data", "snapshots");
}

function latestPath(): string {
  return join(dataDir(), "latest.json");
}

function statusPath(): string {
  return join(dataDir(), "status.json");
}

export function loadSnapshot(): MarketSnapshot | null {
  try {
    const raw = readFileSync(latestPath(), "utf8");
    return JSON.parse(raw) as MarketSnapshot;
  } catch {
    return null;
  }
}

export function saveSnapshot(snap: MarketSnapshot): void {
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(latestPath(), JSON.stringify(snap, null, 2));
  const day = snap.takenAt.slice(0, 10);
  writeFileSync(join(dataDir(), `${day}.json`), JSON.stringify(snap, null, 2));
}

export function loadStatus(): CollectStatus {
  try {
    return JSON.parse(readFileSync(statusPath(), "utf8")) as CollectStatus;
  } catch {
    return {
      lastCollectAt: null,
      lastOk: false,
      lastError: null,
      snapshotTakenAt: null,
      snapshotAsOf: null,
      nextCollectAt: null,
    };
  }
}

export function saveStatus(status: CollectStatus): void {
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(statusPath(), JSON.stringify(status, null, 2));
}

export function loadOrSeed(): MarketSnapshot {
  return loadSnapshot() ?? seedSnapshot();
}

export const STALE_MS = 6 * 24 * 60 * 60 * 1000;

export function isStale(snap: MarketSnapshot, now = Date.now()): boolean {
  const t = Date.parse(snap.takenAt);
  if (!Number.isFinite(t)) return true;
  if (snap.errors[0]?.startsWith("seed:")) return true;
  return now - t > STALE_MS;
}
