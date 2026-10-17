import type { Metadata } from "next";
import { CurrentProjectProvider } from "@/components/CurrentProject";
import { PauseOffscreenAnimations } from "@/components/PauseOffscreenAnimations";
import { MobileHeader, Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Qin Liu — Neuroscience research", template: "%s · Qin Liu" },
  description:
    "Neuroscience research explained for everyone: decoding movement across days, shared variability between brain areas, 3D vision, and spike sorting — plus NeuroDrift, a tool for measuring decoder stability.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <PauseOffscreenAnimations />
        <CurrentProjectProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
              <MobileHeader />
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">{children}</main>
            </div>
          </div>
        </CurrentProjectProvider>
      </body>
    </html>
  );
}
