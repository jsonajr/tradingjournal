"use client";
/**
 * PWA Navigation Fix
 * 
 * On iOS standalone mode (saved to home screen), any full-page navigation
 * (server redirect, window.location, etc.) breaks out of standalone mode
 * and opens Safari with the address bar.
 * 
 * This component:
 * 1. Intercepts all <a> clicks and replaces them with client-side router.push()
 * 2. Detects when the Supabase session expires and handles it without a hard redirect
 * 3. Only runs when the app is in standalone mode (launched from home screen)
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PwaNavFix() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Only apply fixes when running as installed PWA
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (!isStandalone) return;

    // ── Fix 1: Intercept all anchor clicks ─────────────────────────────────
    // Prevents any <a href="..."> from causing a full page load
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Skip external links, anchors, mailto, tel
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank"
      ) return;

      // Skip if modifier keys held
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      router.push(href);
    }

    document.addEventListener("click", handleClick, true);

    // ── Fix 2: Handle auth state changes without hard redirect ─────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
      if (event === "TOKEN_REFRESHED") {
        // Session refreshed — no action needed, stay on current page
      }
    });

    // ── Fix 3: Refresh session on app focus (iOS background restore) ───────
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            router.push("/login");
          }
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return null;
}