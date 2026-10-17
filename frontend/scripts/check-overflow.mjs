#!/usr/bin/env node
// Dev-only phone layout check. Not part of the app or the Docker build (scripts/ is in
// .dockerignore) and Playwright is deliberately not a dependency: install it globally
// (`npm i -g playwright && npx playwright install chromium`) or point NODE_PATH at it.
//
// Usage, with the frontend and backend running (the backend needs at least one project,
// experiment and two sessions, e.g. after "Load Demo Project" and one experiment):
//   node scripts/check-overflow.mjs [--base http://localhost:3000] [--widths 375,320]
//
// For every route and width it fails when
//   1. document.scrollWidth is wider than the viewport;
//   2. visible content (an element or a run of text) sticks out past either edge without a
//      scrolling ancestor (overflow-x auto/scroll) holding it inside the viewport. Clipping
//      by overflow hidden/clip only counts for decorative (aria-hidden) content and for
//      text truncated with an ellipsis; anything else is content cut off;
//   3. a horizontally scrollable container does not scroll under a touch swipe;
//   4. a scroll-revealed block is still hidden after scrolling through the page;
//   5. a glossary term does not open on tap, its bubble leaves the viewport or overlaps
//      the sticky header, or a second tap, Escape or a tap elsewhere does not close it.
// The layout's own `overflow-x-clip` safety net is switched off while measuring, so
// overflow it would merely hide still counts.

import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE = arg("base", "http://localhost:3000").replace(/\/$/, "");
const WIDTHS = arg("widths", "375").split(",").map(Number);

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const root = execSync("npm root -g", { encoding: "utf8" }).trim();
    try {
      return createRequire(path.join(root, "noop.js"))("playwright");
    } catch {
      console.error("Playwright not found. Install it globally: npm i -g playwright && npx playwright install chromium");
      process.exit(2);
    }
  }
}

async function getJson(url) {
  const res = await fetch(BASE + url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function routes() {
  const list = ["/", "/research/cross-day-decoding", "/research/shared-variability", "/research/3d-vision", "/research/spike-sorting", "/tool", "/projects", "/experiments", "/demo", "/documentation"];
  try {
    const [project] = await getJson("/api/projects");
    if (project) {
      list.push(`/projects/${project.id}`);
      const sessions = await getJson(`/api/projects/${project.id}/sessions`);
      if (sessions[0]) list.push(`/sessions/${sessions[0].id}`);
      const [experiment] = (await getJson(`/api/projects/${project.id}/experiments`)).filter((e) => e.status === "completed");
      if (experiment) {
        list.push(`/experiments/${experiment.id}`);
        if (sessions.length > 1) list.push(`/projects/${project.id}/compare/${sessions[0].id}/${sessions[1].id}?experiment=${experiment.id}`);
      }
    }
  } catch (e) {
    console.warn(`Skipping data routes (${e.message}). Start the backend and load the demo project to check them.`);
  }
  return list;
}

// Runs in the page. Returns content that sticks out past either edge of the viewport.
function measure() {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  const flagged = new Set();
  const overflowX = (el) => getComputedStyle(el).overflowX;
  const scrolls = (el) => ["auto", "scroll"].includes(overflowX(el));
  const decorative = (el) => !!el.closest("[aria-hidden=true], canvas");
  const label = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.className?.baseVal ?? el.className ?? "").trim().split(/\s+/).slice(0, 4).join(".")}`;

  // Clip [left, right] by every scrolling ancestor, and by clipping (overflow hidden/clip)
  // ancestors only for decorative content: clipped text or controls are content cut off.
  // `from` is the first box that can clip: the parent of an element, or the element that
  // holds a text run.
  function visibleSpan(el, from, left, right) {
    let invisible = false;
    for (let a = from; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.opacity === "0" || cs.visibility === "hidden") invisible = true;
      const ox = cs.overflowX;
      const clips = ox === "hidden" || ox === "clip";
      if (ox === "auto" || ox === "scroll" || (clips && (decorative(el) || cs.textOverflow === "ellipsis"))) {
        const r = a.getBoundingClientRect();
        left = Math.max(left, r.left);
        right = Math.min(right, r.right);
      }
    }
    return { left, right, invisible };
  }

  function report(el, kind, r, text) {
    flagged.add(el);
    for (let a = el.parentElement; a; a = a.parentElement) if (flagged.has(a)) return;
    offenders.push({ label: label(el), kind, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), text: (text ?? el.textContent ?? "").trim().slice(0, 50) });
  }

  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || style.position === "fixed" || style.opacity === "0") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || (r.right <= vw + 0.5 && r.left >= -0.5)) continue;
    // Decorative layers may bleed past an edge (check 1 still catches them widening the page);
    // boxes entirely left of the screen are deliberately off-screen (measuring nodes, sr-only).
    if (decorative(el) || r.right <= 0) continue;
    const span = visibleSpan(el, el.parentElement, r.left, r.right);
    if (span.invisible) continue;
    if (span.right > vw + 0.5 || span.left < -0.5) report(el, span.right > vw + 0.5 ? "right edge" : "left edge", r);
  }

  // Text runs can overflow without their element's box doing so.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || !n.textContent.trim() || el.closest("svg, script, style, [aria-hidden=true]")) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width === 0 || r.right <= 0 || (r.right <= vw + 0.5 && r.left >= -0.5)) continue;
      const span = visibleSpan(el, el, r.left, r.right);
      if (span.invisible) continue;
      if (span.right > vw + 0.5 || span.left < -0.5) {
        report(el, "text", r, n.textContent);
        break;
      }
    }
  }
  return {
    vw,
    scrollWidth: document.documentElement.scrollWidth,
    hiddenReveals: document.querySelectorAll('[data-reveal="hidden"]').length,
    offenders: offenders.slice(0, 12),
  };
}

// Every horizontally scrollable container must actually scroll under a finger swipe (a
// chart's drag layer can swallow it, leaving content that is reachable only on desktop).
async function checkSwipes(page, cdp) {
  const bad = [];
  const n = await page.evaluate(() => {
    const list = [...document.querySelectorAll("*")].filter((el) => {
      const ox = getComputedStyle(el).overflowX;
      return (ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 1 && el.clientHeight > 20 && !el.closest("[data-sticky-header]");
    });
    list.forEach((el, i) => el.setAttribute("data-swipe-check", String(i)));
    return list.length;
  });
  for (let i = 0; i < n; i++) {
    const box = await page.locator(`[data-swipe-check="${i}"]`).evaluate((el) => {
      el.scrollIntoView({ block: "center", behavior: "instant" });
      el.scrollLeft = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      return { x: r.left + r.width * 0.75, y: Math.min(Math.max(r.top + r.height / 2, 60), vh - 20), label: `${el.tagName.toLowerCase()}.${String(el.className).split(/\s+/).slice(0, 3).join(".")}` };
    });
    await page.waitForTimeout(150);
    const steps = 10;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x, y: box.y }] });
    for (let k = 1; k <= steps; k++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x - (k * 160) / steps, y: box.y }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(400);
    const moved = await page.locator(`[data-swipe-check="${i}"]`).evaluate((el) => el.scrollLeft);
    if (moved < 20) bad.push(`horizontal swipe does not scroll ${box.label} (scrollLeft ${Math.round(moved)})`);
  }
  return bad;
}

async function checkTooltips(page) {
  const count = await page.locator("[data-term-trigger]").count();
  const bad = [];
  const state = (i) =>
    page.locator("[role=tooltip]").nth(i).evaluate((t) => {
      const r = t.getBoundingClientRect();
      const open = t.matches(":popover-open") || (r.width > 0 && getComputedStyle(t).visibility !== "hidden");
      // A top-layer popover always wins elementFromPoint, so test overlap with the header geometrically.
      const h = document.querySelector("[data-sticky-header]")?.getBoundingClientRect();
      const overHeader = !!h && h.height > 0 && r.top < h.bottom - 0.5 && r.bottom > h.top;
      return { open, left: r.left, right: r.right, top: r.top, bottom: r.bottom, vw: document.documentElement.clientWidth, vh: window.innerHeight, covered: open && overHeader };
    });
  // Poll rather than sleep: pages with a WebGL demo can keep the main thread busy for a
  // second or more under software rendering (headless CI, no GPU).
  const until = async (i, open) => {
    for (let t = 0; t < 5000; t += 50) {
      const s = await state(i);
      if (s.open === open) return s;
      await page.waitForTimeout(50);
    }
    return null;
  };
  for (let i = 0; i < count; i++) {
    const trigger = page.locator("[data-term-trigger]").nth(i);
    const word = (await trigger.textContent())?.trim();
    await trigger.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    await trigger.tap();
    const s = await until(i, true);
    if (!s) {
      bad.push(`"${word}": tooltip did not open on tap`);
      continue;
    }
    await page.waitForTimeout(200); // let the open animation settle before measuring
    Object.assign(s, await state(i));
    if (s.left < -0.5 || s.right > s.vw + 0.5) bad.push(`"${word}": tooltip spans x ${Math.round(s.left)}–${Math.round(s.right)} of ${s.vw}px`);
    if (s.top < -0.5 || s.bottom > s.vh + 0.5) bad.push(`"${word}": tooltip spans y ${Math.round(s.top)}–${Math.round(s.bottom)} of ${s.vh}px`);
    if (s.covered) bad.push(`"${word}": tooltip overlaps the sticky header`);
    await trigger.tap();
    if (!(await until(i, false))) bad.push(`"${word}": second tap did not close it`);
    await trigger.tap();
    await until(i, true);
    await page.keyboard.press("Escape");
    if (!(await until(i, false))) bad.push(`"${word}": Escape did not close it`);
    await trigger.tap();
    await until(i, true);
    await page.touchscreen.tap(4, s.vh - 4);
    if (!(await until(i, false))) bad.push(`"${word}": tapping elsewhere did not close it`);
  }
  return { count, bad };
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const list = await routes();
let failures = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  for (const route of list) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: ".overflow-x-clip { overflow-x: visible !important; }" });
    // Scroll through slowly so every scroll-revealed block is shown and lazy content is laid
    // out; anything still hidden would escape the measurement, so it fails the route.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height + 800; y += 300) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(1000);
    const m = await page.evaluate(measure);
    const problems = [];
    if (m.hiddenReveals) problems.push(`${m.hiddenReveals} scroll-revealed block(s) still hidden after scrolling through`);
    if (m.scrollWidth > m.vw) problems.push(`page scrolls sideways: scrollWidth ${m.scrollWidth} > ${m.vw}`);
    for (const o of m.offenders) problems.push(`${o.kind} overflow: ${o.left}..${o.right}px (width ${o.width}): ${o.label} "${o.text}"`);
    problems.push(...(await checkSwipes(page, cdp)));
    const tips = await checkTooltips(page);
    problems.push(...tips.bad);
    failures += problems.length ? 1 : 0;
    console.log(`${problems.length ? "FAIL" : "ok  "} ${width}px ${route}${tips.count ? ` (${tips.count} tooltips)` : ""}`);
    for (const p of problems) console.log(`       - ${p}`);
  }
  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} route/width combination(s) failed.` : "\nAll routes fit the viewport.");
process.exit(failures ? 1 : 0);
