import { describe, expect, it } from "vitest";
import { createCatalog } from "./catalog";
import { seedSnapshot } from "../collect/collect";

describe("catalog overlay", () => {
  it("keeps livability and overlays a live sale price", () => {
    const seed = seedSnapshot(new Date("2026-08-20T10:00:00Z"));
    seed.errors = [];
    seed.places.alicante.districts = seed.places.alicante.districts.map((d) =>
      d.id === "benalua" ? { ...d, saleEurPerM2: 3333, asOf: "2026-08" } : d,
    );
    const cat = createCatalog(seed);
    const b = cat.districtById("benalua");
    expect(b?.scores.walkability).toBe(8);
    expect(b?.price.eurPerM2).toBe(3333);
    expect(cat.marketOf("alicante").eurPerM2).toBe(seed.places.alicante.saleEurPerM2);
  });
});
