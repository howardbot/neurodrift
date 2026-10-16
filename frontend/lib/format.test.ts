import { describe, expect, it } from "vitest";
import { binCenters, countUpFrame, formatBytes, formatDuration, formatNumber } from "@/lib/format";
import { parseErrorBody } from "@/lib/api";
import { suggestSessionName } from "@/components/UploadSessionForm";

describe("format", () => {
  it("formats bytes, numbers and durations", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatNumber(8000)).toBe("8,000");
    expect(formatNumber(0.12345)).toBe("0.123");
    expect(formatNumber(null)).toBe("—");
    expect(formatDuration(159.98)).toBe("2 min 40 s");
  });

  it("builds count-up frames that keep the target's separators", () => {
    expect(countUpFrame("103,680", 0)).toBe("0");
    expect(countUpFrame("103,680", 0.5)).toBe("51,840");
    expect(countUpFrame("103,680", 1)).toBe("103,680");
    expect(countUpFrame("146", 0.5)).toBe("73");
    expect(countUpFrame("146", 2)).toBe("146");
    expect(countUpFrame("10⁻¹⁵", 0.5)).toBe("10⁻¹⁵");
  });

  it("computes histogram bin centres", () => {
    expect(binCenters([0, 1, 3])).toEqual([0.5, 2]);
  });

  it("suggests safe session names", () => {
    expect(suggestSessionName("R1_D01.npz")).toBe("R1_D01");
    expect(suggestSessionName("../day 3 (good).npz")).toBe("day 3 _good_");
  });
});

describe("parseErrorBody", () => {
  it("handles string, dataset-validation and pydantic error shapes", () => {
    expect(parseErrorBody(404, { detail: "Project not found" }).message).toBe("Project not found");
    const v = parseErrorBody(422, { detail: { message: "bad file", errors: ["Missing required array 'X'."] } });
    expect(v.message).toBe("bad file");
    expect(v.details).toEqual(["Missing required array 'X'."]);
    const p = parseErrorBody(422, { detail: [{ loc: ["body", "name"], msg: "Field required" }] });
    expect(p.details).toEqual(["name: Field required"]);
    expect(parseErrorBody(502, null).message).toBe("Request failed (502)");
  });
});

import { ranks, spearman } from "@/lib/stats";

describe("stats", () => {
  it("ranks with ties and computes Spearman", () => {
    expect(ranks([10, 20, 20, 5])).toEqual([2, 3.5, 3.5, 1]);
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
    expect(spearman([1, 2], [1, 2])).toBeNull();
  });
});
