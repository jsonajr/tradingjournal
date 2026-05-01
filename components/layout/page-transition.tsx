"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<"visible" | "out" | "in">("visible");
  const prevPathname = useRef(pathname);
  const outTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname === prevPathname.current) {
      setDisplayChildren(children);
      return;
    }

    // Clear any in-flight timers
    if (outTimer.current) clearTimeout(outTimer.current);
    if (inTimer.current) clearTimeout(inTimer.current);

    // 1. Fade out current content
    setStage("out");

    // 2. After exit completes, swap content and fade in
    outTimer.current = setTimeout(() => {
      setDisplayChildren(children);
      prevPathname.current = pathname;
      setStage("in");

      // 3. Once enter completes, return to visible
      inTimer.current = setTimeout(() => {
        setStage("visible");
      }, 450);
    }, 200);

    return () => {
      if (outTimer.current) clearTimeout(outTimer.current);
      if (inTimer.current) clearTimeout(inTimer.current);
    };
  }, [pathname, children]);

  return (
    <>
      <style>{`
        .pt-wrap {
          will-change: opacity, transform;
        }
        .pt-wrap[data-stage="visible"] {
          opacity: 1;
          transform: translateY(0);
          transition: none;
        }
        .pt-wrap[data-stage="out"] {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 200ms ease, transform 200ms ease;
        }
        .pt-wrap[data-stage="in"] {
          animation: ptEnter 450ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes ptEnter {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="pt-wrap h-full" data-stage={stage}>
        {displayChildren}
      </div>
    </>
  );
}