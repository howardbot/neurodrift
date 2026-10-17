"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCurrentProject, type ProjectRef } from "@/components/CurrentProject";
import { Logo } from "@/components/Logo";
import { RESEARCH } from "@/content/research";

const SHORT_TITLES: Record<string, string> = {
  "cross-day-decoding": "Decoding across days",
  "shared-variability": "Shared variability",
  "3d-vision": "Seeing in 3D",
  "spike-sorting": "Spike sorting",
};

interface NavItem {
  href: string;
  label: string;
  active: (pathname: string) => boolean;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

// One list for the desktop sidebar and the phone menu, so the two cannot drift apart.
const NAV_SECTIONS: NavSection[] = [
  {
    heading: "Research",
    items: [
      { href: "/", label: "Overview", active: (p) => p === "/" },
      ...RESEARCH.map((r) => ({ href: `/research/${r.slug}`, label: SHORT_TITLES[r.slug] ?? r.title, active: (p: string) => p === `/research/${r.slug}` })),
    ],
  },
  {
    heading: "NeuroDrift tool",
    items: [
      { href: "/tool", label: "About", active: (p) => p === "/tool" },
      { href: "/projects", label: "Projects", active: (p) => p === "/projects" },
      { href: "/experiments", label: "Experiments", active: (p) => p.startsWith("/experiments") },
      { href: "/demo", label: "Demo", active: (p) => p === "/demo" },
      { href: "/documentation", label: "Documentation", active: (p) => p.startsWith("/documentation") },
    ],
  },
];

function projectItems(project: ProjectRef): NavItem[] {
  const base = `/projects/${project.id}`;
  return [
    { href: base, label: "Overview", active: (p) => p === base },
    { href: `${base}#sessions`, label: "Sessions", active: (p) => p.startsWith("/sessions") },
    { href: `${base}#analysis`, label: "Analysis", active: () => false },
  ];
}

/** Project navigation is shown inside the tool, not on the research pages. */
function useProjectNav(pathname: string): ProjectRef | null {
  const project = useCurrentProject();
  const isResearch = pathname === "/" || pathname.startsWith("/research");
  return project && !isResearch ? project : null;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 mt-5 px-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{children}</div>;
}

/** "page" for the page itself, "true" for a section the page belongs to (e.g. one experiment). */
function current(item: NavItem, pathname: string): "page" | "true" | undefined {
  if (!item.active(pathname)) return undefined;
  return item.href === pathname ? "page" : "true";
}

function NavLink({ href, children, active, ariaCurrent }: { href: string; children: React.ReactNode; active: boolean; ariaCurrent?: "page" | "true" }) {
  return (
    <Link
      href={href}
      aria-current={ariaCurrent}
      className={`group relative block rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent-600 before:transition-transform before:duration-300 dark:before:bg-accent-300 ${
        active
          ? "bg-accent-50 font-medium text-accent-800 before:scale-y-100 dark:bg-accent-500/10 dark:text-accent-100"
          : "text-zinc-600 before:scale-y-0 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
      }`}
    >
      <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">{children}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const project = useProjectNav(pathname);

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
      <Link href="/" className="group mb-2 flex items-center gap-2 rounded-md px-2.5 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
        <Logo />
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">Qin Liu</span>
          <span className="block text-[11px] text-zinc-500">Neuroscience research</span>
        </span>
      </Link>
      <nav aria-label="Site" className="overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading}>
            <Heading>{section.heading}</Heading>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} href={item.href} active={item.active(pathname)} ariaCurrent={current(item, pathname)}>{item.label}</NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {project && (
        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Current project</div>
          <div className="mb-2 truncate px-2.5 text-sm font-medium" title={project.name}>{project.name}</div>
          <nav aria-label="Current project" className="space-y-0.5">
            {projectItems(project).map((item) => (
              <NavLink key={item.href} href={item.href} active={item.active(pathname)} ariaCurrent={current(item, pathname)}>{item.label}</NavLink>
            ))}
          </nav>
        </div>
      )}
      <div className="mt-auto flex items-center gap-1.5 px-2.5 pt-4 text-[11px] text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
        NeuroDrift v0.1
      </div>
    </aside>
  );
}

function MenuLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const active = item.active(pathname);
  return (
    <Link
      href={item.href}
      aria-current={current(item, pathname)}
      onClick={onNavigate}
      className={`flex min-h-11 items-center rounded-md px-3 text-[15px] transition-colors ${
        active
          ? "bg-accent-50 font-medium text-accent-800 dark:bg-accent-500/15 dark:text-accent-100"
          : "text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800"
      }`}
    >
      {item.label}
    </Link>
  );
}

/**
 * Phone header: the logo and a "Menu" disclosure listing every destination of the desktop
 * sidebar, so each page is two taps away. A native <details>, so it works without
 * JavaScript; with it, the menu also closes on navigation, Escape and an outside tap.
 */
export function MobileHeader() {
  const pathname = usePathname();
  const project = useProjectNav(pathname);
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const lastPath = useRef(pathname);
  const close = () => {
    if (details.current) details.current.open = false;
  };

  // A menu opened before hydration stays open; afterwards, navigating closes it.
  useEffect(() => {
    if (details.current?.open) setOpen(true);
  }, []);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    close();
  }, [pathname]);

  // Always attached and checked against the live element, so there is no window between
  // opening the menu and the listeners arriving.
  useEffect(() => {
    const isOpen = () => details.current?.open === true;
    const onPointerDown = (e: PointerEvent) => {
      if (isOpen() && !details.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isOpen()) return;
      close();
      summary.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Scrolling the page away underneath the menu dismisses it.
  useEffect(() => {
    if (!open) return;
    const start = window.scrollY;
    const onScroll = () => Math.abs(window.scrollY - start) > 24 && close();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  const sections = project ? [...NAV_SECTIONS, { heading: `Current project · ${project.name}`, items: projectItems(project) }] : NAV_SECTIONS;

  return (
    <header
      data-sticky-header=""
      className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-zinc-200/80 bg-white px-4 dark:border-zinc-800/80 dark:bg-zinc-900 md:hidden"
    >
      <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2">
        <Logo size={18} />
        <span className="font-semibold">Qin Liu</span>
      </Link>
      <details
        ref={details}
        className="group ml-auto"
        onToggle={(e) => setOpen(e.currentTarget.open)}
        // Keyboard focus leaving the menu closes it, so the panel never covers the focused element.
        onBlur={(e) => {
          const to = e.relatedTarget as Node | null;
          if (to && !e.currentTarget.contains(to)) close();
        }}
      >
        <summary
          ref={summary}
          className="-mr-2 flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-zinc-700 [-webkit-tap-highlight-color:transparent] active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800 [&::-webkit-details-marker]:hidden"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h14M3 10h14M3 14h14" className="group-open:hidden" />
            <path d="M5 5l10 10M15 5L5 15" className="hidden group-open:block" />
          </svg>
          Menu
        </summary>
        <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-3rem)] animate-menu-in overflow-y-auto overscroll-contain border-b border-zinc-200 bg-white px-2 pb-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <nav aria-label="Site">
            {sections.map((section) => (
              <div key={section.heading}>
                <div className="truncate px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400" title={section.heading}>
                  {section.heading}
                </div>
                {section.items.map((item) => (
                  <MenuLink key={item.href} item={item} pathname={pathname} onNavigate={close} />
                ))}
              </div>
            ))}
          </nav>
        </div>
      </details>
    </header>
  );
}
