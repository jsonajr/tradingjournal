"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PwaNavFix() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isStandalone = () =>
    typeof window !== "undefined" &&
    ((window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches);

  useEffect(() => {
    if (!isStandalone()) return;

    // Intercept all anchor clicks — prevent full page loads
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank"
      ) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      router.push(href);
    }

    document.addEventListener("click", handleClick, true);

    // Handle session expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/login");
    });

    // Check session when app comes back from background
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) router.push("/login");
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("visibilitychange", handleVisibility);
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null;
}