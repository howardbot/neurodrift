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

// Below the cerebrum, for the brain map only: the cerebellum and the brainstem running down
// to the spinal cord.
export const CEREBELLUM = "M440 292 C446 268, 480 258, 516 262 C548 266, 566 284, 560 306 C554 326, 526 336, 494 334 C462 332, 436 316, 440 292 Z";
export const CEREBELLUM_FOLIA = ["M452 300 C480 292, 520 292, 552 300", "M456 314 C486 306, 520 306, 548 314", "M468 326 C490 320, 516 320, 536 326"];
export const BRAINSTEM = "M394 296 C400 330, 404 364, 400 410 L428 410 C428 366, 434 330, 446 300 Z";
