// The timeline on /about: dates as written in content/profile.ts ("Sep. 2023", "May 2026",
// "Present") turned into months, and the entries the timeline draws.

import { EDUCATION, LABS, RECOGNITION } from "@/content/profile";

/** Months since year 0 (January 2024 = 2024 × 12). */
export type Month = number;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DATE = /([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/;

export function parseMonth(text: string): Month | null {
  const m = DATE.exec(text);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]!.toLowerCase());
  return month < 0 ? null : Number(m[2]) * 12 + month;
}

/** "May 2024 — Present" → start and end; `end` is null for something still going on. */
export function parseRange(text: string): { start: Month; end: Month | null } | null {
  const [from, to] = text.split(/\s+[—–-]\s+/);
  const start = parseMonth(from ?? "");
  if (start === null || to === undefined) return null;
  if (/present/i.test(to)) return { start, end: null };
  const end = parseMonth(to);
  return end === null ? null : { start, end };
}

/** The date at the end of a line such as "Dean's List · May 2025". */
export function trailingMonth(text: string): Month | null {
  const m = /([A-Za-z]{3}[a-z]*\.?\s+\d{4})\s*$/.exec(text);
  return m ? parseMonth(m[1]!) : null;
}

export const monthLabel = (m: Month) => `${MONTHS[m % 12]![0]!.toUpperCase()}${MONTHS[m % 12]!.slice(1)} ${Math.floor(m / 12)}`;
export const monthOf = (d: Date): Month => d.getUTCFullYear() * 12 + d.getUTCMonth();

export type City = "Qingdao" | "Edinburgh" | "Madison" | "Chicago";
export const CITIES: City[] = ["Qingdao", "Edinburgh", "Madison", "Chicago"];

export function cityOf(text: string): City | null {
  if (/Qingdao|Ocean University of China/.test(text)) return "Qingdao";
  if (/Edinburgh|Heriot-Watt/.test(text)) return "Edinburgh";
  if (/Madison/.test(text)) return "Madison";
  if (/Chicago/.test(text)) return "Chicago";
  return null;
}

export const anchorOf = (name: string) => `lab-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export interface Span {
  id: string;
  lane: "Study" | "Research";
  name: string;
  detail: string;
  start: Month;
  /** null: still going on. */
  end: Month | null;
  /** The end lies ahead (an expected graduation). */
  expected: boolean;
  city: City;
  href: string;
}

export interface Award {
  id: string;
  name: string;
  detail: string;
  at: Month;
  href: string;
}

const must = <T,>(value: T | null, what: string): T => {
  if (value === null) throw new Error(`timeline: cannot read the date of ${what}`);
  return value;
};

/** Study and research as spans, oldest first within each lane, and awards as points. */
export function timeline(now: Month): { spans: Span[]; awards: Award[] } {
  const study: Span[] = EDUCATION.map((e) => {
    const r = must(parseRange(e.years), e.school);
    return {
      id: e.school,
      lane: "Study",
      name: e.school,
      detail: e.detail,
      start: r.start,
      end: r.end,
      expected: r.end !== null && r.end > now,
      city: must(cityOf(`${e.school} ${e.detail}`), e.school),
      href: "#education",
    };
  });
  const research: Span[] = LABS.map((lab) => {
    const r = must(parseRange(lab.years), lab.name);
    return {
      id: lab.name,
      lane: "Research",
      name: lab.name,
      detail: `${lab.institution} · ${lab.pi}`,
      start: r.start,
      end: r.end,
      expected: false,
      city: must(cityOf(lab.institution), lab.name),
      href: `#${anchorOf(lab.name)}`,
    };
  });
  const byStart = (a: Span, b: Span) => a.start - b.start || a.name.localeCompare(b.name);
  return {
    spans: [...study.sort(byStart), ...research.sort(byStart)],
    awards: RECOGNITION.map((r) => ({ id: r.title, name: r.title, detail: r.detail, at: must(trailingMonth(r.detail), r.title), href: "#education" })).sort(
      (a, b) => a.at - b.at,
    ),
  };
}
