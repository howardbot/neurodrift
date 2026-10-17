import { ResearchTransitions } from "@/components/ResearchTransitions";

// Moving from one research story to another plays a View Transition; see ResearchTransitions.
export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return <ResearchTransitions>{children}</ResearchTransitions>;
}
