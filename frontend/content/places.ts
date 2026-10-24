// Places on the /places globe. This repository is public: list cities, not addresses, and only
// what you are happy for anyone to read.

export type PlaceKind = "lived" | "visited";

export interface Place {
  id: string;
  name: string;
  /** Country, or region and country. */
  region: string;
  lat: number;
  lon: number;
  kind: PlaceKind;
  /** Optional: years, e.g. "2020 — 2023" or "2024". */
  when?: string;
  /** Optional: one short line. */
  note?: string;
}

export const KIND_LABEL: Record<PlaceKind, string> = { lived: "Lived & studied", visited: "Visited" };

export const PLACES: Place[] = [
  { id: "madison", name: "Madison", region: "Wisconsin, USA", lat: 43.0731, lon: -89.4012, kind: "lived", when: "2023 —", note: "University of Wisconsin–Madison" },
  { id: "qingdao", name: "Qingdao", region: "China", lat: 36.0671, lon: 120.3826, kind: "lived", when: "2020 — 2023", note: "Ocean University of China" },
];
