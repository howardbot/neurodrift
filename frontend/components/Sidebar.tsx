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
      className={`block rounded px-2.5 py-1.5 text-sm ${
        active
          ? "bg-zinc-200/70 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
      }`}
    >
      {children}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const project = useCurrentProject();
  const projectBase = project ? `/projects/${project.id}` : null;
  const isResearch = pathname === "/" || pathname.startsWith("/research");

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
      <Link href="/" className="mb-2 flex items-center gap-2 px-2.5">
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
      <div className="mt-auto px-2.5 pt-4 text-[11px] text-zinc-400">NeuroDrift v0.1</div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <Logo size={18} />
        <span className="font-semibold">Qin Liu</span>
      </Link>
      <nav className="flex gap-3 overflow-x-auto whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/#projects">Research</Link>
        <Link href="/tool">NeuroDrift</Link>
        <Link href="/projects">Data</Link>
      </nav>
    </header>
  );
}
