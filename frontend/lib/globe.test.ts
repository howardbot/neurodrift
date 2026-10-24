import { describe, expect, it } from "vitest";
import { LAND_RUNS, LAND_SAMPLES, LATTICE_SIZE } from "@/content/globeLand";
import { PLACES } from "@/content/places";
import { decodeRuns, latticePoint, lonDelta, nearestLattice, toVec, view } from "@/lib/globe";

const land = new Set(decodeRuns(LAND_RUNS));

describe("globe land mask", () => {
  it("uses the same lattice as the generator", () => {
    for (const [i, lon, lat] of LAND_SAMPLES) {
      const [l, b] = latticePoint(i, LATTICE_SIZE);
      expect(l).toBeCloseTo(lon, 8);
      expect(b).toBeCloseTo(lat, 8);
      expect(land.has(i)).toBe(true);
    }
  });

  it("covers about 29% of the sphere, with land and sea where they belong", () => {
    expect(land.size / LATTICE_SIZE).toBeGreaterThan(0.27);
    expect(land.size / LATTICE_SIZE).toBeLessThan(0.31);
    expect(land.has(nearestLattice([-89.4, 43.07], LATTICE_SIZE))).toBe(true); // Madison
    // Inland points only: with dots ~180 km apart, a coastal city's nearest dot can be at sea.
    expect(land.has(nearestLattice([104, 35], LATTICE_SIZE))).toBe(true); // central China
    expect(land.has(nearestLattice([20, 5], LATTICE_SIZE))).toBe(true); // central Africa
    expect(land.has(nearestLattice([134, -25], LATTICE_SIZE))).toBe(true); // central Australia
    expect(land.has(nearestLattice([-150, 0], LATTICE_SIZE))).toBe(false); // central Pacific
    expect(land.has(nearestLattice([-30, 30], LATTICE_SIZE))).toBe(false); // central Atlantic
  });
});

describe("globe view", () => {
  it("turns any place to face the viewer, east to the right and north up", () => {
    for (const [lon, lat] of [[0, 0], [-89.4, 43.07], [120.38, 36.07], [170, -40]] as [number, number][]) {
      const [x, y, z] = view(toVec([lon, lat]), lon, lat);
      expect(x).toBeCloseTo(0, 9);
      expect(y).toBeCloseTo(0, 9);
      expect(z).toBeCloseTo(1, 9);
      expect(view(toVec([lon + 1, lat]), lon, lat)[0]).toBeGreaterThan(0);
      expect(view(toVec([lon, lat + 1]), lon, lat)[1]).toBeGreaterThan(0);
    }
  });

  it("takes the short way round", () => {
    expect(lonDelta(170, -170)).toBeCloseTo(20);
    expect(lonDelta(-170, 170)).toBeCloseTo(-20);
    expect(lonDelta(0, 90)).toBeCloseTo(90);
  });
});

describe("places", () => {
  it("have valid coordinates, unique ids and a known kind", () => {
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    for (const p of PLACES) {
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(p.lon)).toBeLessThanOrEqual(180);
      expect(["lived", "visited"]).toContain(p.kind);
    }
  });
});
