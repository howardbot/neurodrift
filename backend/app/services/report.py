"""Self-contained HTML report for a completed experiment.

One file with inline CSS and inline SVG heatmaps: no scripts, fonts, images or other
external requests, so it can be archived, e-mailed or printed as-is. Every piece of
user-supplied text (project, experiment and session names, failure reasons) is
HTML-escaped. Built from the stored results only; nothing is recomputed.
"""

from __future__ import annotations

import math
from datetime import datetime
from html import escape
from typing import Any

from app import __version__
from app.analysis.cross_session import summarise_by_distance, summarise_matrix
from app.db.base import utcnow
from app.models import Experiment, RecordingSession
from app.services.exports import iso, session_names, session_rows, unavailable_pairs

# Sent with the report so a browser blocks anything but inline styles, even if a future
# change were to introduce an external reference by mistake.
REPORT_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"

# Same sequential light → dark blue scale as the app's heatmaps; darker = "better".
BLUES: list[tuple[float, tuple[int, int, int]]] = [
    (0.0, (0xF4, 0xF7, 0xFB)),
    (0.25, (0xC9, 0xD9, 0xEE)),
    (0.5, (0x8F, 0xB0, 0xDA)),
    (0.75, (0x4F, 0x7F, 0xBE)),
    (1.0, (0x1F, 0x3F, 0x73)),
]

CSS = """
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: #ffffff; color: #27272a; font: 14px/1.55 ui-sans-serif, system-ui, -apple-system,
  "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
main { max-width: 1040px; margin: 0 auto; padding: 32px 20px 48px; }
header.top { border-bottom: 2px solid #1f3f73; padding-bottom: 12px; margin-bottom: 8px; }
.eyebrow { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: #2f5d9e; font-weight: 600; }
h1 { font-size: 24px; margin: 4px 0 2px; letter-spacing: -.01em; }
h2 { font-size: 17px; margin: 32px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e4e4e7; }
h3 { font-size: 14px; margin: 18px 0 6px; }
p { margin: 6px 0; }
.muted { color: #71717a; font-size: 12.5px; }
code, td.num { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.5px; }
table { border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 13px; }
th, td { border-bottom: 1px solid #e4e4e7; padding: 4px 8px; text-align: left; vertical-align: top; }
th { background: #f4f4f5; font-weight: 600; font-size: 12px; }
table.compact { width: auto; min-width: min(100%, 560px); }
td.num, th.num { text-align: right; white-space: nowrap; }
.scroll { overflow-x: auto; }
dl.config { display: grid; grid-template-columns: max-content 1fr; gap: 4px 16px; margin: 6px 0; }
dl.config dt { color: #71717a; }
dl.config dd { margin: 0; overflow-wrap: anywhere; }
figure { margin: 10px 0; break-inside: avoid; }
figure svg { max-width: 100%; height: auto; }
figcaption { font-size: 12.5px; color: #52525b; margin-top: 4px; }
details { margin: 6px 0; }
summary { cursor: pointer; color: #2f5d9e; font-size: 13px; }
.notice { border: 1px solid #fcd34d; background: #fffbeb; color: #78350f; padding: 8px 12px; border-radius: 4px; }
ul.notes li { margin: 4px 0; }
footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #e4e4e7; color: #71717a; font-size: 12px; }
@media print {
  main { padding: 0; max-width: none; }
  h2 { break-after: avoid; }
  details { display: block; }
  summary { display: none; }
}
"""


def _colour(t: float) -> str:
    t = min(1.0, max(0.0, t))
    for (t0, c0), (t1, c1) in zip(BLUES, BLUES[1:]):
        if t <= t1:
            f = (t - t0) / (t1 - t0)
            r, g, b = (round(a + f * (b - a)) for a, b in zip(c0, c1))
            return f"#{r:02x}{g:02x}{b:02x}"
    return "#1f3f73"


def _is_num(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _fmt(value: Any, spec: str, suffix: str = "") -> str:
    return f"{format(value, spec)}{suffix}" if _is_num(value) else "—"


def _ts(value: datetime | None) -> str:
    text = iso(value)
    return f"{text[:16].replace('T', ' ')} UTC" if text else "—"


def _heatmap_svg(
    names: list[str],
    matrix: list[list[Any]],
    *,
    uid: str,
    label: str,
    fmt: str,
    better: str,
    clip_min: float | None = None,
) -> str:
    """Train × test matrix as an SVG heatmap (rows = train, columns = test)."""
    n = len(names)
    cell = 46 if n <= 8 else 34 if n <= 16 else 22
    show_text = n <= 16
    label_w = max((len(s) for s in names), default=1) * 6.6 + 10
    left = 26 + label_w
    top = 26 + label_w * 0.72
    grid = n * cell
    width = left + grid + label_w * 0.72 + 12
    height = top + grid + 78

    finite = [float(v) for row in matrix for v in row if _is_num(v)]
    vmin = max(clip_min if clip_min is not None else -math.inf, min(finite)) if finite else 0.0
    vmax = max(finite) if finite else 1.0

    def position(v: float) -> float:
        t = 0.5 if vmax <= vmin else (max(v, vmin) - vmin) / (vmax - vmin)
        return 1 - t if better == "low" else t

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:.0f}" height="{height:.0f}" '
        f'viewBox="0 0 {width:.0f} {height:.0f}" role="img" aria-label="{escape(label)} matrix" '
        'font-family="ui-sans-serif, system-ui, sans-serif" font-size="11">',
        f'<text x="{left:.0f}" y="12" fill="#52525b" font-size="11">test session →</text>',
        f'<text transform="translate(12 {top + grid / 2:.0f}) rotate(-90)" text-anchor="middle" '
        'fill="#52525b" font-size="11">train session →</text>',
    ]
    for j, name in enumerate(names):
        x = left + j * cell + cell / 2
        y = top - 6
        parts.append(
            f'<text x="{x:.1f}" y="{y:.1f}" transform="rotate(-45 {x:.1f} {y:.1f})" fill="#3f3f46">{escape(name)}</text>'
        )
    for i, name in enumerate(names):
        y = top + i * cell + cell / 2
        parts.append(
            f'<text x="{left - 6:.1f}" y="{y:.1f}" dy=".35em" text-anchor="end" fill="#3f3f46">{escape(name)}</text>'
        )
        for j, value in enumerate(matrix[i]):
            x0, y0 = left + j * cell, top + i * cell
            pair = f"train {escape(name)} → test {escape(names[j])}"
            if _is_num(value):
                t = position(float(value))
                fill, ink, text = _colour(t), ("#ffffff" if t > 0.55 else "#18181b"), format(value, fmt)
            else:
                fill, ink, text = "#e4e4e7", "#71717a", "n/a"
            parts.append(
                f'<g><title>{pair}: {escape(label)} = {escape(text)}</title>'
                f'<rect x="{x0 + 0.5:.1f}" y="{y0 + 0.5:.1f}" width="{cell - 1}" height="{cell - 1}" fill="{fill}"/>'
            )
            if show_text:
                parts.append(
                    f'<text x="{x0 + cell / 2:.1f}" y="{y0 + cell / 2:.1f}" dy=".35em" text-anchor="middle" '
                    f'fill="{ink}" font-size="{11 if n <= 8 else 9.5}">{escape(text)}</text>'
                )
            parts.append("</g>")
        # Outline the diagonal (within-session reference) for orientation.
        d = left + i * cell
        parts.append(
            f'<rect x="{d + 0.5:.1f}" y="{top + i * cell + 0.5:.1f}" width="{cell - 1}" height="{cell - 1}" '
            'fill="none" stroke="#18181b" stroke-opacity=".35" stroke-dasharray="3 2"/>'
        )

    # Colour legend: light → dark always means worse → better.
    lx, ly, lw = left, top + grid + 36, min(240.0, max(140.0, grid))
    low_label, high_label = (vmax, vmin) if better == "low" else (vmin, vmax)
    parts += [
        f'<defs><linearGradient id="grad-{uid}">'
        + "".join(f'<stop offset="{t:.2f}" stop-color="{_colour(t)}"/>' for t, _ in BLUES)
        + "</linearGradient></defs>",
        f'<rect x="{lx:.0f}" y="{ly:.0f}" width="{lw:.0f}" height="10" fill="url(#grad-{uid})" stroke="#d4d4d8"/>',
        f'<text x="{lx:.0f}" y="{ly + 24:.0f}" fill="#52525b">{escape(_fmt(low_label, fmt))}</text>',
        f'<text x="{lx + lw:.0f}" y="{ly + 24:.0f}" text-anchor="end" fill="#52525b">{escape(_fmt(high_label, fmt))}</text>',
        f'<text x="{lx:.0f}" y="{ly - 6:.0f}" fill="#52525b">{escape(label)} '
        f'({"lower" if better == "low" else "higher"} = darker)</text>',
        "</svg>",
    ]
    return "".join(parts)


def _values_table(names: list[str], matrix: list[list[Any]], fmt: str) -> str:
    head = "".join(f'<th class="num">{escape(n)}</th>' for n in names)
    body = "".join(
        f"<tr><th>{escape(name)}</th>"
        + "".join(f'<td class="num">{_fmt(v, fmt)}</td>' for v in row)
        + "</tr>"
        for name, row in zip(names, matrix, strict=True)
    )
    return (
        '<details><summary>Show values</summary><div class="scroll"><table>'
        f"<thead><tr><th>train \\ test</th>{head}</tr></thead><tbody>{body}</tbody></table></div></details>"
    )


def _config_section(experiment: Experiment) -> str:
    c = experiment.config
    tf = float(c.get("train_fraction", 0.8))
    outputs = c.get("outputs")
    rows = [
        ("Decoder", f"Ridge regression (α = {c['alpha']:g})" if c.get("decoder") == "ridge" else "Linear regression (OLS)"),
        ("Neural preprocessing", "z-score with training-block mean/SD" if c.get("zscore") else "none (zero-variance features dropped)"),
        ("Outputs", ", ".join(f"Y{o}" for o in outputs) if outputs else "all"),
        ("Split", f"train on first {tf:.0%} · test on last {1 - tf:.0%} of each session (contiguous blocks)"),
        ("PCA components (k)", str(c.get("n_components", "—"))),
        ("Random seed", str(experiment.random_seed)),
        ("Sessions (in order)", " → ".join(session_names(experiment))),
        ("Software", " · ".join(f"{k} {v}" for k, v in experiment.software.items()) or "—"),
        ("Experiment id", str(experiment.id)),
        ("Created / finished", f"{_ts(experiment.created_at)} / {_ts(experiment.finished_at)}"),
    ]
    items = "".join(f"<dt>{escape(k)}</dt><dd>{escape(v)}</dd>" for k, v in rows)
    return f'<section><h2>Experiment configuration</h2><dl class="config">{items}</dl></section>'


def _sessions_section(rows: list[dict[str, Any]]) -> str:
    head = (
        "<tr><th>#</th><th>Session</th><th>Subject</th><th>Recording date</th>"
        '<th class="num">Bins</th><th class="num">Neurons</th>'
        '<th class="num">Within r</th><th class="num">Out-transfer r</th><th class="num">In-transfer r</th>'
        '<th class="num">Within angle</th><th class="num">Mean angle to others</th></tr>'
    )
    body = "".join(
        "<tr>"
        f'<td class="num">{r["position"]}</td><td><code>{escape(r["session"])}</code></td>'
        f'<td>{escape(r["subject"] or "—")}</td><td>{escape(r["recording_date"] or "—")}</td>'
        f'<td class="num">{_fmt(r["n_samples"], ",d")}</td><td class="num">{_fmt(r["n_neurons"], "d")}</td>'
        f'<td class="num">{_fmt(r["within_r"], ".3f")}</td><td class="num">{_fmt(r["out_transfer_r"], ".3f")}</td>'
        f'<td class="num">{_fmt(r["in_transfer_r"], ".3f")}</td>'
        f'<td class="num">{_fmt(r["within_angle_deg"], ".1f", "°")}</td>'
        f'<td class="num">{_fmt(r["out_mean_angle_deg"], ".1f", "°")}</td>'
        "</tr>"
        for r in rows
    )
    return (
        "<section><h2>Session summary</h2>"
        '<p class="muted">Within = diagonal cell (held-out block of the same session). Out-transfer = mean r when this '
        "session's decoder is tested on the other sessions; in-transfer = mean r when the other sessions' decoders are "
        "tested on this session. Mean angle to others uses this session as the training session. Transfer means "
        "exclude the diagonal.</p>"
        f'<div class="scroll"><table><thead>{head}</thead><tbody>{body}</tbody></table></div></section>'
    )


def _summary_section(experiment: Experiment) -> str:
    result = experiment.result
    assert result is not None
    dm = result.decoder["matrices"]
    sm = result.subspace["matrices"] if result.subspace else None
    metrics: list[tuple[str, list[list[Any]], str]] = [
        ("Decoder mean Pearson r", dm["mean_r"], ".3f"),
        ("Decoder mean R²", dm["mean_r2"], ".3f"),
        ("Decoder mean RMSE", dm["mean_rmse"], ".3f"),
    ]
    if sm:
        metrics += [
            ("Mean principal angle (°)", sm["mean_angle"], ".1f"),
            ("Alignment index", sm["alignment_index"], ".3f"),
        ]
    rows = ""
    for label, matrix, fmt in metrics:
        s = summarise_matrix(matrix)
        rows += (
            f"<tr><td>{escape(label)}</td><td class=\"num\">{_fmt(s['mean_diagonal'], fmt)}</td>"
            f"<td class=\"num\">{_fmt(s['mean_off_diagonal'], fmt)}</td></tr>"
        )
    n = len(dm["mean_r"])
    by_r = summarise_by_distance(dm["mean_r"])
    by_angle = summarise_by_distance(sm["mean_angle"]) if sm else None
    dist_rows = "".join(
        f'<tr><td class="num">{d["distance"]}{" (diagonal)" if d["distance"] == 0 else ""}</td>'
        f'<td class="num">{_fmt(d["mean"], ".3f")}</td>'
        f'<td class="num">{_fmt(by_angle[k]["mean"], ".1f", "°") if by_angle else "—"}</td>'
        f'<td class="num">{d["n_pairs"]}</td></tr>'
        for k, d in enumerate(by_r)
    )
    n_unavailable = len(unavailable_pairs(experiment))
    return (
        "<section><h2>Within- vs cross-session summary</h2>"
        f'<p>{n} sessions, {n * n} train → test cells ({n} within-session, {n * (n - 1)} cross-session); '
        f"{n_unavailable} could not be computed.</p>"
        '<table class="compact"><thead><tr><th>Measure</th><th class="num">Within-session (diagonal mean)</th>'
        f'<th class="num">Cross-session (off-diagonal mean)</th></tr></thead><tbody>{rows}</tbody></table>'
        "<h3>By session distance</h3>"
        '<p class="muted">Distance |i − j| counts positions in the experiment\'s session order, not days. Means are '
        "descriptive: cells at the same distance share sessions and are not independent samples.</p>"
        '<table class="compact"><thead><tr><th class="num">Distance</th><th class="num">Mean decoder r</th>'
        '<th class="num">Mean principal angle</th><th class="num">Cells</th></tr></thead>'
        f"<tbody>{dist_rows}</tbody></table></section>"
    )


def _decoder_section(experiment: Experiment, names: list[str]) -> str:
    result = experiment.result
    assert result is not None
    matrix = result.decoder["matrices"]["mean_r"]
    tf = float(experiment.config.get("train_fraction", 0.8))
    svg = _heatmap_svg(names, matrix, uid="decoder", label="mean r", fmt=".2f", better="high")
    return (
        "<section><h2>Decoder generalisation matrix</h2>"
        f"<p>Mean Pearson r between predicted and actual behaviour, averaged over outputs. Rows are training "
        f"sessions and columns are test sessions. The decoder for each row is trained on the first {tf:.0%} of that "
        f"session; every cell in a column is evaluated on the last {1 - tf:.0%} of the column's session, restricted "
        "to the neurons the two sessions share. The dashed diagonal is a held-out within-session estimate.</p>"
        f"<figure>{svg}<figcaption>Cells marked n/a could not be computed (e.g. neurons could not be aligned)."
        f"</figcaption></figure>{_values_table(names, matrix, '.3f')}</section>"
    )


def _subspace_section(experiment: Experiment, names: list[str]) -> str:
    result = experiment.result
    assert result is not None
    if not result.subspace:
        return (
            "<section><h2>Neural subspace matrix</h2><p class=\"notice\">This experiment was run before subspace "
            "analysis was available. Run a new experiment to compute it.</p></section>"
        )
    sub = result.subspace
    matrix = sub["matrices"]["mean_angle"]
    chance = [float(v) for row in sub["matrices"]["chance_mean_angle"] for v in row if _is_num(v)]
    chance_text = (
        f"≈ {sum(chance) / len(chance):.1f}° (range {min(chance):.1f}–{max(chance):.1f}° across cells)" if chance else "—"
    )
    svg = _heatmap_svg(names, matrix, uid="subspace", label="mean angle (°)", fmt=".1f", better="low")
    return (
        "<section><h2>Neural subspace matrix</h2>"
        f"<p>Mean principal angle (degrees) between top-{sub.get('n_components', '?')} PCA subspaces fit "
        "independently on the training block of the row session and on the test block of the column session, "
        "using the neurons both share — the same data as the matching decoder cell. Lower = more similar. The "
        "diagonal compares two blocks of the same session (estimation noise plus within-session non-stationarity), "
        f"so it is a reference rather than 0°. Chance level for random subspaces of the same size: {chance_text}.</p>"
        f"<figure>{svg}<figcaption>Darker = smaller angle (more similar subspaces).</figcaption></figure>"
        f"{_values_table(names, matrix, '.2f')}</section>"
    )


def _notes_section(experiment: Experiment) -> str:
    result = experiment.result
    assert result is not None
    cells = [c for row in result.decoder["cells"] for c in row]
    notes = [
        "Decoder transfer, neural representation change and behaviour change are separate measurements. A lower "
        "cross-session decoder score is not by itself evidence of representational drift: behaviour, recording "
        "quality and the set of recorded neurons also differ between sessions.",
        "Behaviour change is not summarised in this report; the app's pair comparison view shows behaviour "
        "distributions for any train → test pair.",
        "Any co-variation between principal angles and decoder performance across pairs is descriptive. Pairs share "
        "sessions and are not independent, and an association does not show that representational change causes "
        "decoder degradation.",
        "No uncertainty estimates (e.g. bootstrap confidence intervals) are computed, so differences between "
        "individual cells have not been tested for significance.",
        "The decoder maps a single time bin of neural activity to the same bin of behaviour (no lags). Splits are "
        "contiguous blocks, never shuffled, because neighbouring bins are autocorrelated.",
    ]
    n_index = sum(c.get("alignment") == "index" for c in cells if c.get("status") == "ok")
    if n_index:
        notes.append(
            f"{n_index} cell(s) had no neuron IDs in one or both sessions; neuron identity was assumed by column "
            "index for those pairs."
        )
    unavailable = unavailable_pairs(experiment)
    if unavailable:
        reasons = sorted({p["reason"] for p in unavailable if p["reason"]})
        notes.append(
            f"{len(unavailable)} cell(s) could not be computed"
            + (": " + "; ".join(reasons[:5]) if reasons else "")
            + "."
        )
    r2 = [v for row in result.decoder["matrices"]["mean_r2"] for v in row if _is_num(v)]
    if r2 and min(r2) < 0:
        notes.append("Some R² values are negative (worse than predicting the test-block mean); they are reported unclipped.")
    if result.subspace:
        degenerate = sum(
            bool(c.get("degenerate")) for row in result.subspace["cells"] for c in row if c.get("status") == "ok"
        )
        if degenerate:
            notes.append(
                f"{degenerate} subspace cell(s) have 2k > n (too few neurons for the number of components), which "
                "forces some principal angles to 0°; treat those angles with caution."
            )
    items = "".join(f"<li>{escape(note)}</li>" for note in notes)
    return f'<section><h2>Interpretation notes</h2><ul class="notes">{items}</ul></section>'


def render_report(experiment: Experiment, metadata: dict[str, RecordingSession]) -> str:
    """Render the full report as one HTML document (UTF-8 string)."""
    if experiment.result is None:
        raise ValueError("Experiment has no stored results")
    names = session_names(experiment)
    project = experiment.project.name
    title = f"{project} · {experiment.name} · NeuroDrift report"
    body = "".join(
        [
            '<header class="top"><div class="eyebrow">NeuroDrift report</div>'
            f"<h1>{escape(project)}</h1>"
            f'<p>Experiment <strong>{escape(experiment.name)}</strong> · {len(names)} sessions · '
            f'generated {_ts(utcnow())}</p></header>',
            _config_section(experiment),
            _sessions_section(session_rows(experiment, metadata)),
            _decoder_section(experiment, names),
            _subspace_section(experiment, names),
            _summary_section(experiment),
            _notes_section(experiment),
            f"<footer>Generated by NeuroDrift {escape(__version__)} from stored experiment results "
            f"(experiment {escape(str(experiment.id))}). Analyses ran with "
            f"{escape(' · '.join(f'{k} {v}' for k, v in experiment.software.items()) or 'unknown software versions')}."
            "</footer>",
        ]
    )
    return (
        '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        f"<title>{escape(title)}</title><style>{CSS}</style></head>"
        f"<body><main>{body}</main></body></html>\n"
    )
