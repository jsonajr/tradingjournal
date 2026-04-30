"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "midnight";

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  el.classList.remove("dark", "midnight");
  if (theme === "dark") el.classList.add("dark");
  if (theme === "midnight") { el.classList.add("dark"); el.classList.add("midnight"); }
}

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("tj_theme") ?? "dark") as Theme;
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function cycle() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "midnight" : "light";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("tj_theme", next);
  }

  if (compact) {
    return (
      <button onClick={cycle} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors" title={`Theme: ${theme}`}>
        {theme === "light" ? <Sun className="h-5 w-5" /> : theme === "midnight" ? <span className="text-base leading-5">🌑</span> : <Moon className="h-5 w-5" />}
        <span className="text-[9px] w-full text-center">{theme === "light" ? "Light" : theme === "midnight" ? "Mid" : "Dark"}</span>
      </button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycle} title={`Theme: ${theme} (click to cycle)`}>
      {theme === "light" ? <Sun className="h-4 w-4" /> : theme === "midnight" ? <span className="text-xs">🌑</span> : <Moon className="h-4 w-4" />}
    </Button>
  );
}