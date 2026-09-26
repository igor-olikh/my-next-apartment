import { describe, expect, it } from "vitest";
import { DISTRICTS, placeOf } from "./districts";
import { DISTRICT_POINT, mapsUrl } from "./maps";

const BOX = {
  alicante: { lat: [38.32, 38.39], lon: [-0.53, -0.4] },
  campello: { lat: [38.39, 38.49], lon: [-0.42, -0.3] },
} as const;

describe("district map links", () => {
  it("pins every district inside its own town", () => {
    expect(Object.keys(DISTRICT_POINT).sort()).toEqual(DISTRICTS.map((d) => d.id).sort());
    for (const d of DISTRICTS) {
      const p = DISTRICT_POINT[d.id];
      const box = BOX[placeOf(d)];
      expect(p.place).toBe(placeOf(d));
      expect(p.lat).toBeGreaterThan(box.lat[0]);
      expect(p.lat).toBeLessThan(box.lat[1]);
      expect(p.lon).toBeGreaterThan(box.lon[0]);
      expect(p.lon).toBeLessThan(box.lon[1]);
      expect(mapsUrl(d.id)).toBe(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.lat},${p.lon}`)}`,
      );
    }
  });
});
