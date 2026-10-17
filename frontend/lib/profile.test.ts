import { describe, expect, it } from "vitest";
import * as profile from "@/content/profile";
import { RESEARCH } from "@/content/research";

const slugs = new Set(RESEARCH.map((r) => r.slug));

describe("profile content", () => {
  it("links labs and work only to research stories that exist", () => {
    for (const lab of profile.LABS) for (const slug of lab.stories) expect(slugs, `${lab.name} → ${slug}`).toContain(slug);
    for (const w of profile.WORK.filter((w) => w.href?.startsWith("/research/"))) {
      expect(slugs, w.title).toContain(w.href!.replace("/research/", ""));
    }
  });

  it("publishes only the contact details the owner chose (no phone number)", () => {
    const text = JSON.stringify(profile);
    expect(text).not.toMatch(/\+?\(?\d{1,3}\)?[\s.-]?\d{3}[\s.-]\d{3}[\s.-]\d{4}/);
    expect(text).not.toMatch(/tel:/);
    expect(profile.PROFILE.email).toMatch(/@/);
    expect(profile.PROFILE.github).toMatch(/^https:\/\/github\.com\//);
  });
});
