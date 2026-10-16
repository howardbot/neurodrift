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
//   1. document.scrollWidth is wider than the viewport, or
//   2. a visible element sticks out past the right edge without an ancestor that scrolls
//      or clips it (overflow-x auto/scroll/hidden) inside the viewport, or
//   3. a glossary term does not open on tap, its bubble leaves the viewport or is covered,
//      or a second tap, Escape or a tap elsewhere does not close it.
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

// Runs in the page. Returns elements that stick out past the right edge.
function measure() {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  const flagged = new Set();
  const clips = (el) => ["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(el).overflowX);
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || style.position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.right <= vw + 0.5) continue;
    // Effective right edge after clipping by scrolling/clipping ancestors.
    let right = r.right;
    let invisible = false;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).opacity === "0") invisible = true;
      if (clips(a)) right = Math.min(right, a.getBoundingClientRect().right);
    }
    if (invisible || style.opacity === "0" || right <= vw + 0.5) continue;
    flagged.add(el);
    // Report the outermost offender only: its children are implied.
    let nested = false;
    for (let a = el.parentElement; a; a = a.parentElement) if (flagged.has(a)) nested = true;
    if (nested) continue;
    const label = `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.className.baseVal ?? el.className).trim().split(/\s+/).slice(0, 4).join(".")}`;
    offenders.push({ label, right: Math.round(r.right), width: Math.round(r.width), text: (el.textContent ?? "").trim().slice(0, 50) });
  }
  return { vw, scrollWidth: document.documentElement.scrollWidth, offenders: offenders.slice(0, 12) };
}

async function checkTooltips(page) {
  const count = await page.locator("[data-term-trigger]").count();
  const bad = [];
  const state = (i) =>
    page.locator("[role=tooltip]").nth(i).evaluate((t) => {
      const r = t.getBoundingClientRect();
      const open = t.matches(":popover-open") || (r.width > 0 && getComputedStyle(t).visibility !== "hidden");
      const hit = open ? document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(12, r.height / 2)) : null;
      return { open, left: r.left, right: r.right, top: r.top, bottom: r.bottom, vw: document.documentElement.clientWidth, vh: window.innerHeight, covered: open && !t.contains(hit) };
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
    if (s.covered) bad.push(`"${word}": tooltip is covered by another element`);
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
  for (const route of list) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: ".overflow-x-clip { overflow-x: visible !important; }" });
    // Scroll through so scroll-revealed content and lazy figures are laid out.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 600) await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(900);
    const m = await page.evaluate(measure);
    const tips = await checkTooltips(page);
    const problems = [];
    if (m.scrollWidth > m.vw) problems.push(`page scrolls sideways: scrollWidth ${m.scrollWidth} > ${m.vw}`);
    for (const o of m.offenders) problems.push(`sticks out to ${o.right}px (width ${o.width}): ${o.label} "${o.text}"`);
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
