/** WCAG relative luminance of an sRGB colour given as 0–255 channels. */
export function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Black or white, whichever reads better on `background`. One of the two always reaches
 * at least ~4.58:1, so text drawn on any fill colour meets WCAG AA for normal-size text.
 */
export function readableInk(background: [number, number, number]): "#000000" | "#ffffff" {
  return contrast(background, [0, 0, 0]) >= contrast(background, [255, 255, 255]) ? "#000000" : "#ffffff";
}
