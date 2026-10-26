import { describe, expect, it } from "vitest";
import { LAND_RUNS, LAND_SAMPLES, LATTICE_SIZE } from "@/content/globeLand";
import { DOT_REGIONS, REGION_CODES } from "@/content/globeRegions";
import { BY_COUNTRY, PLACES } from "@/content/places";
import { decodeRuns, latticePoint, lonDelta, nearestLattice, shadeOf, toVec, view } from "@/lib/globe";

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
  it("have valid coordinates, unique ids and names, and a country", () => {
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    expect(new Set(PLACES.map((p) => p.name)).size).toBe(PLACES.length);
    for (const p of PLACES) {
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(p.lon)).toBeLessThanOrEqual(180);
      expect(p.country.length).toBeGreaterThan(1);
    }
  });

  it("are grouped by country without losing any", () => {
    expect(BY_COUNTRY.flatMap((g) => g.places)).toHaveLength(PLACES.length);
    expect(BY_COUNTRY.map((g) => g.country)).toEqual(["China", "South Korea", "United States", "Mexico", "Canada", "United Arab Emirates"]);
  });
});


describe("globe regions", () => {
  const landOrder = decodeRuns(LAND_RUNS);
  const regions = DOT_REGIONS.split(",");
  const regionOf = (p: [number, number]) => {
    const k = landOrder.indexOf(nearestLattice(p, LATTICE_SIZE));
    return k >= 0 && regions[k] ? REGION_CODES[parseInt(regions[k], 36)] : undefined;
  };

  it("has one entry per land dot, all pointing into the code table", () => {
    expect(regions).toHaveLength(landOrder.length);
    for (const r of regions) if (r) expect(REGION_CODES[parseInt(r, 36)]).toBeDefined();
  });

  it("puts dots well inside a region in that region", () => {
    // Points far from borders: dots are ~180 km apart, so a city near a border (Madison is
    // ~70 km from Illinois) can have its nearest dot across it.
    expect(regionOf([-89.9, 44.6])).toBe("US-WI"); // central Wisconsin
    expect(regionOf([102.7, 30.6])).toBe("CN-SC"); // central Sichuan
    expect(regionOf([-99.5, 31.5])).toBe("US-TX"); // central Texas
    expect(regionOf([128.0, 47.5])).toBe("CN-HL"); // central Heilongjiang
    expect(regionOf([-124.5, 54.0])).toBe("CA-BC"); // central British Columbia
  });

  it("uses region codes that exist, and shades most visited regions", () => {
    const withDots = new Set(REGION_CODES);
    const visited = [...new Set(PLACES.map((p) => p.region))];
    for (const code of visited) expect(code).toMatch(/^[A-Z]{2}-[A-Z0-9]{1,3}$/);
    // Shanghai and Seoul are smaller than the gap between dots; their pins mark them.
    expect(visited.filter((c) => !withDots.has(c)).sort()).toEqual(["CN-SH", "KR-11"]);
  });
});

describe("shading", () => {
  const regions = new Set(PLACES.map((p) => p.region));
  const countries = new Set(PLACES.map((p) => p.region.slice(0, 2)));
  const landOrder = decodeRuns(LAND_RUNS);
  const dotRegions = DOT_REGIONS.split(",");
  const shadeAt = (p: [number, number]) => {
    const k = landOrder.indexOf(nearestLattice(p, LATTICE_SIZE));
    const code = k >= 0 && dotRegions[k] ? REGION_CODES[parseInt(dotRegions[k], 36)] : undefined;
    return shadeOf(code, regions, countries);
  };

  it("is dark in a visited region, tinted elsewhere in a visited country, grey otherwise", () => {
    expect(shadeOf("US-TX", regions, countries)).toBe(2);
    expect(shadeOf("US-WY", regions, countries)).toBe(1);
    expect(shadeOf("FR-IDF", regions, countries)).toBe(0);
    expect(shadeOf(undefined, regions, countries)).toBe(0);
  });

  it("gives the globe's dots the right shade", () => {
    expect(shadeAt([-99.5, 31.5])).toBe(2); // central Texas
    expect(shadeAt([-107.5, 43])).toBe(1); // Wyoming
    expect(shadeAt([128.9, 36.4])).toBe(1); // South Korea outside Seoul
    expect(shadeAt([2.5, 46.5])).toBe(0); // France
  });
});
