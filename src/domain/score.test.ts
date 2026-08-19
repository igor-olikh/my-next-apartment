import { describe, expect, it } from "vitest";
import { buildBriefing } from "./briefing";
import { cashToMoveIn } from "./money";
import { DEFAULT_PROFILE, flagListing, recommended } from "./score";
import type { BuyerProfile } from "./types";

const city: BuyerProfile = { ...DEFAULT_PROFILE };
const beach: BuyerProfile = { ...DEFAULT_PROFILE, want: "beach", maxBudgetEur: 320000, hasCar: true };
const quiet: BuyerProfile = { ...DEFAULT_PROFILE, want: "quiet", hasCar: true, maxBudgetEur: 280000 };
const broke: BuyerProfile = { ...DEFAULT_PROFILE, maxBudgetEur: 140000, minRooms: 3, want: "beach" };

describe("owner-occupier scoring", () => {
  it("city + no car + lift does not recommend cabo, casco, or remedio", () => {
    const ids = recommended(city).map((f) => f.district.id);
    expect(ids).not.toContain("cabo-huertas");
    expect(ids).not.toContain("centro");
    expect(ids).not.toContain("virgen-remedio");
    expect(ids).not.toContain("san-gabriel");
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.some((id) => ["benalua", "mercado", "ensanche", "pla-bon-repos"].includes(id))).toBe(true);
  });

  it("turning off the car kills cabo and vistahermosa", () => {
    const withCar = recommended({ ...quiet, hasCar: true }).map((f) => f.district.id);
    const noCar = recommended({ ...quiet, hasCar: false }).map((f) => f.district.id);
    expect(noCar).not.toContain("cabo-huertas");
    expect(noCar).not.toContain("vistahermosa");
    expect(withCar.includes("vistahermosa") || withCar.includes("cabo-huertas") || withCar.includes("campoamor")).toBe(
      true,
    );
  });

  it("beach with a car shortlists sea districts", () => {
    const ids = recommended(beach).map((f) => f.district.id);
    expect(ids.some((id) => ["albufereta", "cabo-huertas", "playa-san-juan"].includes(id))).toBe(true);
    expect(ids).not.toContain("virgen-remedio");
  });

  it("cheap listing in a fit district gets a look-why flag", () => {
    const flags = flagListing(
      {
        districtId: "benalua",
        priceEur: 160000,
        sqm: 80,
        rooms: 2,
        floor: 3,
        totalFloors: 6,
        elevator: true,
        daysOnMarket: 100,
        priceCuts: 2,
        hasAc: true,
      },
      city,
    );
    expect(flags.some((f) => f.code === "cheap" && f.severity === "good")).toBe(true);
    expect(flags.some((f) => f.code === "stale")).toBe(true);
  });

  it("fourth floor without elevator is a hard no", () => {
    const flags = flagListing(
      {
        districtId: "centro",
        priceEur: 240000,
        sqm: 78,
        rooms: 2,
        floor: 4,
        totalFloors: 5,
        elevator: false,
        daysOnMarket: 20,
        priceCuts: 0,
        hasAc: true,
      },
      city,
    );
    expect(flags.some((f) => f.code === "no-lift" && f.severity === "bad")).toBe(true);
    expect(flags.some((f) => f.code === "lift-must")).toBe(true);
  });

  it("closing cost is about 11%", () => {
    expect(cashToMoveIn(250000)).toBe(277500);
  });

  it("rewrites the memo when lifestyle changes", () => {
    const a = buildBriefing(city).verdict;
    const b = buildBriefing(beach).verdict;
    const c = buildBriefing(quiet).verdict;
    expect(a).not.toEqual(b);
    expect(b).not.toEqual(c);
    expect(a.toLowerCase()).toMatch(/город|беналуа|энсанче|меркадо|пла-дель/);
  });

  it("impossible beach budget says so", () => {
    const brief = buildBriefing(broke);
    expect(brief.kind === "broke" || brief.kind === "conflict").toBe(true);
    expect(brief.verdict.length).toBeGreaterThan(20);
  });
});
