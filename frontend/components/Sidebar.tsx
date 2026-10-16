"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentProject } from "@/components/CurrentProject";
import { Logo } from "@/components/Logo";

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

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2.5">
        <Logo />
        <span className="text-[15px] font-semibold tracking-tight">NeuroDrift</span>
      </Link>
      <nav className="space-y-0.5">
        <NavLink href="/projects" active={pathname === "/projects"}>Projects</NavLink>
        <NavLink href="/experiments" active={pathname.startsWith("/experiments")}>Experiments</NavLink>
        <NavLink href="/demo" active={pathname === "/demo"}>Demo</NavLink>
        <NavLink href="/documentation" active={pathname.startsWith("/documentation")}>Documentation</NavLink>
      </nav>
      {project && projectBase && (
        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Current project</div>
          <div className="mb-2 truncate px-2.5 text-sm font-medium" title={project.name}>{project.name}</div>
          <nav className="space-y-0.5">
            <NavLink href={projectBase} active={pathname === projectBase}>Overview</NavLink>
            <NavLink href={`${projectBase}#sessions`} active={pathname.startsWith("/sessions")}>Sessions</NavLink>
            <NavLink href={`${projectBase}#analysis`} active={false}>Analysis</NavLink>
          </nav>
        </div>
      )}
      <div className="mt-auto px-2.5 text-[11px] text-zinc-400">v0.1 · single-user instance</div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={18} />
        <span className="font-semibold">NeuroDrift</span>
      </Link>
      <nav className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/projects">Projects</Link>
        <Link href="/experiments">Experiments</Link>
        <Link href="/documentation">Docs</Link>
      </nav>
    </header>
  );
}
