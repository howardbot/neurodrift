"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentProject } from "@/components/CurrentProject";
import { Logo } from "@/components/Logo";
import { RESEARCH } from "@/content/research";

const SHORT_TITLES: Record<string, string> = {
  "cross-day-decoding": "Decoding across days",
  "shared-variability": "Shared variability",
  "3d-vision": "Seeing in 3D",
  "spike-sorting": "Spike sorting",
};

function Heading({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 mt-5 px-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">{children}</div>;
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
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
  const project = useCurrentProject();
  const projectBase = project ? `/projects/${project.id}` : null;
  const isResearch = pathname === "/" || pathname.startsWith("/research");

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white/80 px-3 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 md:flex">
      <Link href="/" className="group mb-2 flex items-center gap-2 rounded-md px-2.5 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60">
        <Logo />
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">Qin Liu</span>
          <span className="block text-[11px] text-zinc-500">Neuroscience research</span>
        </span>
      </Link>
      <nav className="overflow-y-auto">
        <Heading>Research</Heading>
        <div className="space-y-0.5">
          <NavLink href="/" active={pathname === "/"}>Overview</NavLink>
          {RESEARCH.map((r) => (
            <NavLink key={r.slug} href={`/research/${r.slug}`} active={pathname === `/research/${r.slug}`}>
              {SHORT_TITLES[r.slug] ?? r.title}
            </NavLink>
          ))}
        </div>
        <Heading>NeuroDrift tool</Heading>
        <div className="space-y-0.5">
          <NavLink href="/tool" active={pathname === "/tool"}>About</NavLink>
          <NavLink href="/projects" active={pathname === "/projects"}>Projects</NavLink>
          <NavLink href="/experiments" active={pathname.startsWith("/experiments")}>Experiments</NavLink>
          <NavLink href="/demo" active={pathname === "/demo"}>Demo</NavLink>
          <NavLink href="/documentation" active={pathname.startsWith("/documentation")}>Documentation</NavLink>
        </div>
      </nav>
      {project && projectBase && !isResearch && (
        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Current project</div>
          <div className="mb-2 truncate px-2.5 text-sm font-medium" title={project.name}>{project.name}</div>
          <nav className="space-y-0.5">
            <NavLink href={projectBase} active={pathname === projectBase}>Overview</NavLink>
            <NavLink href={`${projectBase}#sessions`} active={pathname.startsWith("/sessions")}>Sessions</NavLink>
            <NavLink href={`${projectBase}#analysis`} active={false}>Analysis</NavLink>
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

const MOBILE_LINKS = [
  { href: "/#projects", label: "Research", match: (p: string) => p === "/" || p.startsWith("/research") },
  { href: "/tool", label: "NeuroDrift", match: (p: string) => p === "/tool" || p === "/demo" || p.startsWith("/documentation") },
  { href: "/projects", label: "Data", match: (p: string) => /^\/(projects|sessions|experiments)/.test(p) },
];

export function MobileHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-zinc-200/80 bg-white/80 px-4 py-2 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 md:hidden">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <Logo size={18} />
        <span className="font-semibold">Qin Liu</span>
      </Link>
      <nav className="-mr-2 ml-auto flex gap-1 overflow-x-auto whitespace-nowrap text-sm">
        {MOBILE_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-3 py-1 transition-colors ${
              l.match(pathname)
                ? "bg-accent-50 font-medium text-accent-800 dark:bg-accent-500/15 dark:text-accent-100"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
