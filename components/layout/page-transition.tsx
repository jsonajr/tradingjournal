"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"idle" | "out" | "in">("idle");
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Start exit animation
      setTransitionStage("out");

      const outTimer = setTimeout(() => {
        // Swap content mid-animation
        setDisplayChildren(children);
        setTransitionStage("in");
        prevPathname.current = pathname;

        // Return to idle after enter completes
        const inTimer = setTimeout(() => {
          setTransitionStage("idle");
        }, 220);

        return () => clearTimeout(inTimer);
      }, 150);

      return () => clearTimeout(outTimer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <>
      <style>{`
        .page-transition {
          will-change: opacity, transform;
          transition: opacity 150ms ease, transform 150ms ease;
        }
        .page-transition[data-stage="idle"] {
          opacity: 1;
          transform: translateY(0px);
        }
        .page-transition[data-stage="out"] {
          opacity: 0;
          transform: translateY(6px);
        }
        .page-transition[data-stage="in"] {
          opacity: 0;
          transform: translateY(-6px);
          animation: pageEnter 220ms ease forwards;
        }
        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
      <div
        className="page-transition h-full"
        data-stage={transitionStage}
      >
        {displayChildren}
      </div>
    </>
  );
}