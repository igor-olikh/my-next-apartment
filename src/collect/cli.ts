import { collectLive, seedSnapshot } from "./collect";
import { loadSnapshot, saveSnapshot, saveStatus } from "../store/fsStore";

const prev = loadSnapshot() ?? seedSnapshot();
const snap = await collectLive(prev);
saveSnapshot(snap);
saveStatus({
  lastCollectAt: snap.takenAt,
  lastOk: snap.errors.length === 0,
  lastError: snap.errors.length ? snap.errors.join("; ") : null,
  snapshotTakenAt: snap.takenAt,
  snapshotAsOf: snap.places.alicante?.asOf ?? null,
  nextCollectAt: null,
});
console.log(JSON.stringify({ takenAt: snap.takenAt, errors: snap.errors, asOf: snap.places.alicante?.asOf }, null, 2));
