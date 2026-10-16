"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface ProjectRef {
  id: string;
  name: string;
}

const Ctx = createContext<{ project: ProjectRef | null; setProject: (p: ProjectRef | null) => void }>({
  project: null,
  setProject: () => {},
});

export function CurrentProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectRef | null>(null);
  return <Ctx.Provider value={{ project, setProject }}>{children}</Ctx.Provider>;
}

export function useCurrentProject() {
  return useContext(Ctx).project;
}

/** Pages inside a project call this so the sidebar can show project navigation. */
export function useSetCurrentProject(project: ProjectRef | null | undefined) {
  const { setProject } = useContext(Ctx);
  const id = project?.id;
  const name = project?.name;
  useEffect(() => {
    if (id && name) setProject({ id, name });
  }, [id, name, setProject]);
}
