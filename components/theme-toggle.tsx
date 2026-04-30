"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "dark" | "light" | "midnight";

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  el.classList.remove("dark", "midnight");
  if (theme === "dark") el.classList.add("dark");
  if (theme === "midnight") { el.classList.add("dark"); el.classList.add("midnight"); }
}

export function ThemeToggle() {
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

  return (
    <Button variant="ghost" size="icon" onClick={cycle} title={`Theme: ${theme} (click to cycle)`}>
      {theme === "light" ? <Sun className="h-4 w-4" /> : theme === "midnight" ? <span className="text-xs">🌑</span> : <Moon className="h-4 w-4" />}
    </Button>
  );
}