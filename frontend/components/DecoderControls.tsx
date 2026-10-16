"use client";

import type { DecoderKind } from "@/types/api";
import { outputLabel } from "@/lib/format";

export interface DecoderSettings {
  decoder: DecoderKind;
  alpha: number;
  zscore: boolean;
  outputs: number[];
}

/** Shared decoder/preprocessing controls (session page and experiment configuration). */
export function DecoderControls({
  value,
  onChange,
  nOutputs,
}: {
  value: DecoderSettings;
  onChange: (v: DecoderSettings) => void;
  nOutputs: number;
}) {
  const toggleOutput = (j: number) => {
    const next = value.outputs.includes(j) ? value.outputs.filter((o) => o !== j) : [...value.outputs, j].sort((a, b) => a - b);
    if (next.length) onChange({ ...value, outputs: next });
  };
  return (
    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <div>
        <label className="label" htmlFor="dec-kind">Decoder</label>
        <select id="dec-kind" className="input" value={value.decoder} onChange={(e) => onChange({ ...value, decoder: e.target.value as DecoderKind })}>
          <option value="ridge">Ridge</option>
          <option value="linear">Linear regression (OLS)</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="dec-alpha">Ridge α</label>
        <input
          id="dec-alpha"
          type="number"
          min="0.000001"
          step="any"
          className="input font-mono"
          disabled={value.decoder !== "ridge"}
          value={value.alpha}
          onChange={(e) => onChange({ ...value, alpha: Number(e.target.value) })}
        />
      </div>
      <div>
        <span className="label">Neural preprocessing</span>
        <label className="flex items-center gap-2 py-1.5">
          <input type="checkbox" checked={value.zscore} onChange={(e) => onChange({ ...value, zscore: e.target.checked })} />
          Z-score (training stats)
        </label>
      </div>
      <div>
        <span className="label">Outputs</span>
        <div className="flex flex-wrap gap-x-3 py-1.5">
          {Array.from({ length: nOutputs }, (_, j) => (
            <label key={j} className="flex items-center gap-1.5">
              <input type="checkbox" checked={value.outputs.includes(j)} onChange={() => toggleOutput(j)} />
              {outputLabel(j, nOutputs)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function defaultDecoderSettings(nOutputs: number): DecoderSettings {
  return { decoder: "ridge", alpha: 1, zscore: true, outputs: Array.from({ length: nOutputs }, (_, j) => j) };
}
