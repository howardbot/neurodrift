import { describe, expect, it } from "vitest";
import { EDUCATION, LABS, RECOGNITION } from "@/content/profile";
import { anchorOf, cityOf, monthLabel, parseMonth, parseRange, timeline, trailingMonth } from "@/lib/timeline";

describe("timeline dates", () => {
  it("reads the dates as the profile writes them", () => {
    expect(parseMonth("Sep. 2023")).toBe(2023 * 12 + 8);
    expect(parseMonth("May 2026")).toBe(2026 * 12 + 4);
    expect(parseRange("May 2024 — Present")).toEqual({ start: 2024 * 12 + 4, end: null });
    expect(parseRange("Sep. 2020 — May 2023")).toEqual({ start: 2020 * 12 + 8, end: 2023 * 12 + 4 });
    expect(trailingMonth("China Undergraduate Mathematical Contest in Modeling (CUMCM) · Oct. 2022")).toBe(2022 * 12 + 9);
    expect(monthLabel(2026 * 12 + 11)).toBe("Dec 2026");
    expect(parseMonth("sometime")).toBeNull();
  });

  it("can place every school, lab and award, in a city", () => {
    for (const e of EDUCATION) {
      expect(parseRange(e.years), e.school).not.toBeNull();
      expect(cityOf(`${e.school} ${e.detail}`), e.school).not.toBeNull();
    }
    for (const lab of LABS) {
      expect(parseRange(lab.years), lab.name).not.toBeNull();
      expect(cityOf(lab.institution), lab.name).not.toBeNull();
    }
    for (const r of RECOGNITION) expect(trailingMonth(r.detail), r.title).not.toBeNull();
    expect(new Set(LABS.map((l) => anchorOf(l.name))).size).toBe(LABS.length);
  });

  it("marks what is still going on and what is still to come", () => {
    const { spans, awards } = timeline(2026 * 12 + 9); // October 2026
    expect(spans).toHaveLength(EDUCATION.length + LABS.length);
    expect(awards).toHaveLength(RECOGNITION.length);
    const uw = spans.find((s) => s.name.includes("Wisconsin"))!;
    expect(uw.expected).toBe(true);
    for (const s of spans) {
      if (s.end !== null) expect(s.end, s.name).toBeGreaterThan(s.start);
      if (s.lane === "Research") expect(s.href, s.name).toBe(`#${anchorOf(s.name)}`);
    }
    expect(spans.filter((s) => s.end === null).map((s) => s.name).sort()).toEqual(LABS.filter((l) => /Present/.test(l.years)).map((l) => l.name).sort());
    // Within a lane, oldest first.
    for (const lane of ["Study", "Research"]) {
      const starts = spans.filter((s) => s.lane === lane).map((s) => s.start);
      expect(starts).toEqual([...starts].sort((a, b) => a - b));
    }
  });
});
