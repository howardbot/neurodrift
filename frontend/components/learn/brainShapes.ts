// Shared schematic of a primate brain's left hemisphere, front to the left
// (viewBox 600 × 340). Used by the brain map and the brain-size comparison.

export const OUTLINE =
  "M70 210 C60 150, 110 80, 190 58 C270 32, 380 30, 460 48 C530 64, 585 120, 575 190 C568 240, 540 262, 500 268 C460 275, 440 300, 400 310 C340 326, 270 320, 235 296 C210 280, 210 262, 190 258 C150 268, 90 258, 70 210 Z";

export const SULCI = [
  { d: "M212 258 C260 236, 310 222, 368 206", label: "lateral fissure", at: [252, 258] as const },
  { d: "M330 36 C318 90, 300 150, 278 228", label: "central sulcus", at: [306, 200] as const },
  { d: "M372 118 C410 100, 450 92, 488 98", label: "intraparietal sulcus", at: [372, 136] as const },
  { d: "M270 286 C340 270, 420 250, 480 226", label: "", at: [0, 0] as const },
  { d: "M512 70 C524 120, 522 180, 508 236", label: "", at: [0, 0] as const },
  { d: "M112 150 C140 140, 170 138, 200 140", label: "", at: [0, 0] as const },
  { d: "M216 80 C206 120, 210 160, 232 196", label: "", at: [0, 0] as const },
];

