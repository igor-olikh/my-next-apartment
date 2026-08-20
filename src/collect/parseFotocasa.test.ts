import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mapFotocasaDistrict } from "./map";
import { parseFotocasaIndex } from "./parseFotocasa";

const dir = dirname(fileURLToPath(import.meta.url));

describe("fotocasa index parser", () => {
  it("reads El Campello sale, rent and mapped barrios", () => {
    const html = readFileSync(join(dir, "fixtures/campello.html"), "utf8");
    const p = parseFotocasaIndex(html);
    expect(p.name).toMatch(/Campello/i);
    expect(p.saleEurPerM2).toBeGreaterThan(3000);
    expect(p.rentEurPerM2).toBeGreaterThan(10);
    expect(p.asOf).toBe("2026-08");
    const mucha = p.districts.find((d) => d.name.includes("Muchavista"));
    expect(mucha?.saleEurPerM2).toBeGreaterThan(4000);
    expect(mapFotocasaDistrict("Playa Muchavista")?.ids).toEqual(["muchavista"]);
    expect(mapFotocasaDistrict("San Gabriel - Palmeral - Urbanova")).toBeNull();
  });

  it("reads Alicante city districts", () => {
    const html = readFileSync(join(dir, "fixtures/alicante.html"), "utf8");
    const p = parseFotocasaIndex(html);
    expect(p.name).toMatch(/Alicante/i);
    expect(p.saleEurPerM2).toBeGreaterThan(2500);
    expect(mapFotocasaDistrict("Centro")?.ids).toEqual(["centro"]);
    expect(mapFotocasaDistrict("Benalúa - Babel")?.ids).toEqual(["benalua"]);
  });
});
