"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

const EDGE = 16; // px kept clear of the viewport edges
const GAP = 8; // px between the word and the bubble

const supportsPopover = () => typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

/**
 * A word with a plain-language definition.
 *
 * The word is a native button that toggles a popover, so tapping it, tapping elsewhere and
 * Escape all work without JavaScript (the bubble is then centred on screen). With
 * JavaScript the bubble also opens on hover and keyboard focus, sits above the word (or
 * below it when there is no room), and is kept inside the viewport. Popovers render in the
 * top layer, so cards with `overflow: hidden` or transformed ancestors never clip them.
 */
export function Term({ children, def }: { children: ReactNode; def: string }) {
  const tipId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const pinned = useRef(false);
  const hideTimer = useRef<number | undefined>(undefined);

  function place() {
    const t = trigger.current;
    const b = tip.current;
    if (!t || !b) return;
    const r = t.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const { offsetWidth: w, offsetHeight: h } = b;
    const above = r.top - GAP - h >= EDGE / 2;
    const left = Math.min(Math.max(r.left + r.width / 2 - w / 2, EDGE), Math.max(EDGE, vw - EDGE - w));
    b.style.inset = "auto";
    b.style.margin = "0";
    b.style.left = `${Math.round(left)}px`;
    b.style.top = `${Math.round(above ? r.top - GAP - h : r.bottom + GAP)}px`;
    b.dataset.side = above ? "top" : "bottom";
  }

  function show() {
    window.clearTimeout(hideTimer.current);
    const b = tip.current;
    if (!b || !supportsPopover()) return;
    if (!b.matches(":popover-open")) b.showPopover();
    place();
  }

  function hide(force = false) {
    window.clearTimeout(hideTimer.current);
    if (pinned.current && !force) return;
    pinned.current = false;
    const b = tip.current;
    if (b?.matches(":popover-open")) b.hidePopover();
  }

  const hideSoon = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => hide(), 140);
  };

  useEffect(() => {
    const b = tip.current;
    const t = trigger.current;
    if (!b || !t) return;
    // Old browsers without the Popover API: fall back to the native title tooltip.
    if (!supportsPopover()) t.title = def;
    let raf = 0;
    const follow = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    const onToggle = (e: Event) => {
      const open = (e as ToggleEvent).newState === "open";
      if (!open) pinned.current = false;
      const method = open ? "addEventListener" : "removeEventListener";
      window[method]("scroll", follow, { passive: true, capture: true } as AddEventListenerOptions);
      window[method]("resize", follow);
    };
    b.addEventListener("toggle", onToggle);
    return () => {
      b.removeEventListener("toggle", onToggle);
      window.removeEventListener("scroll", follow, { capture: true });
      window.removeEventListener("resize", follow);
      cancelAnimationFrame(raf);
      window.clearTimeout(hideTimer.current);
    };
  }, [def]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        data-term-trigger=""
        popoverTarget={tipId}
        aria-describedby={tipId}
        className="cursor-help border-b border-dotted border-zinc-400 transition-colors hover:border-accent-500 hover:text-accent-700 dark:hover:text-accent-200"
        onClick={(e) => {
          // Take over from the declarative toggle: a tap pins the bubble open, a second tap closes it.
          if (!supportsPopover()) return;
          e.preventDefault();
          if (pinned.current) hide(true);
          else {
            pinned.current = true;
            show();
          }
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && show()}
        onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
        onFocus={show}
        onBlur={() => hide()}
      >
        {children}
      </button>
      <span
        ref={tip}
        id={tipId}
        popover="auto"
        role="tooltip"
        className="term-tip w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white p-2.5 text-left text-xs font-normal leading-relaxed text-zinc-700 shadow-xl shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        onPointerEnter={(e) => e.pointerType === "mouse" && window.clearTimeout(hideTimer.current)}
        onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
      >
        {def}
      </span>
    </>
  );
}
