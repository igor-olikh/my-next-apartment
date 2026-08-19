import express from "express";
import cron from "node-cron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectLive } from "../collect/collect";
import { isStale, loadOrSeed, loadStatus, saveSnapshot, saveStatus } from "../store/fsStore";
import type { CollectStatus, MarketSnapshot } from "../domain/snapshot";

const PORT = Number(process.env.PORT || 8080);
const TZ = "Europe/Madrid";

let snapshot: MarketSnapshot = loadOrSeed();
let status: CollectStatus = {
  ...loadStatus(),
  snapshotTakenAt: snapshot.takenAt,
  snapshotAsOf: snapshot.places.alicante?.asOf ?? null,
};

function nextSundaySix(): string {
  const now = new Date();
  const utc = now.getTime();
  // cron will fire; this is display-only
  const d = new Date(utc);
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7 || 7));
  d.setUTCHours(4, 0, 0, 0); // 06:00 Madrid ≈ 04:00 UTC in summer
  return d.toISOString();
}

async function collectNow(reason: string): Promise<void> {
  console.log(`collect start (${reason})`);
  try {
    const next = await collectLive(snapshot);
    snapshot = next;
    saveSnapshot(next);
    const ok = next.errors.length === 0;
    status = {
      lastCollectAt: next.takenAt,
      lastOk: ok,
      lastError: ok ? null : next.errors.join("; "),
      snapshotTakenAt: next.takenAt,
      snapshotAsOf: next.places.alicante?.asOf ?? null,
      nextCollectAt: nextSundaySix(),
    };
    saveStatus(status);
    console.log(`collect done ok=${ok} errors=${next.errors.length}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    status = {
      ...status,
      lastCollectAt: new Date().toISOString(),
      lastOk: false,
      lastError: msg,
      nextCollectAt: nextSundaySix(),
    };
    saveStatus(status);
    console.error("collect failed", msg);
  }
}

const app = express();
app.disable("x-powered-by");

app.get("/api/snapshot", (_req, res) => {
  res.json(snapshot);
});

app.get("/api/status", (_req, res) => {
  res.json(status);
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, stale: isStale(snapshot), asOf: status.snapshotAsOf });
});

const prod = process.env.NODE_ENV === "production";
if (prod) {
  const here = dirname(fileURLToPath(import.meta.url));
  const dist = join(here, "..", "..", "dist");
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path === "/healthz") return next();
    res.sendFile(join(dist, "index.html"));
  });
}

cron.schedule(
  "0 6 * * 0",
  () => {
    void collectNow("cron");
  },
  { timezone: TZ },
);

app.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
  status.nextCollectAt = nextSundaySix();
  if (isStale(snapshot)) {
    void collectNow("boot-stale");
  } else {
    console.log("snapshot fresh, skip boot collect");
    saveSnapshot(snapshot);
    saveStatus({ ...status, nextCollectAt: nextSundaySix() });
  }
});
