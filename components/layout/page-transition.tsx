"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        @keyframes ptEnter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pt-wrap {
          animation: ptEnter 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
      <div key={pathname} className="pt-wrap h-full">
        {children}
      </div>
    </>
  );
}