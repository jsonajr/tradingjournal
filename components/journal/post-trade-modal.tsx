"use client";
import { useState, useEffect } from "react";
import { CheckSquare, Square, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHECKLIST = [
  "Journal this trade",
  "Screenshot the setup",
  "Review any mistakes made",
  "Check if rules were followed",
  "Assess emotional state before next trade",
];

interface PostTradeModalProps {
  open: boolean;
  pnl: number;
  symbol: string;
  onDismiss: () => void;
}

export function PostTradeModal({ open, pnl, symbol, onDismiss }: PostTradeModalProps) {
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [pulse, setPulse] = useState(true);
  const allChecked = checked.every(Boolean);
  const isWin = pnl >= 0;

  useEffect(() => {
    if (!open) { setChecked(CHECKLIST.map(() => false)); return; }
    const t = setInterval(() => setPulse((p) => !p), 800);
    return () => clearInterval(t);
  }, [open]);

  if (!open) return null;

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => idx === i ? !v : v));
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-zinc-900 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Warning header */}
        <div
          className={`flex items-center justify-center gap-3 px-6 py-5 transition-colors duration-500 ${
            pulse ? "bg-amber-500/20" : "bg-amber-500/10"
          }`}
        >
          <AlertTriangle
            className={`h-8 w-8 text-amber-400 transition-transform duration-500 ${pulse ? "scale-110" : "scale-100"}`}
          />
          <div className="text-center">
            <div className="text-lg font-black uppercase tracking-widest text-amber-400">
              Post-Trade Routine
            </div>
            <div className="text-xs text-amber-400/70 uppercase tracking-wide mt-0.5">
              Do not skip this
            </div>
          </div>
          <AlertTriangle
            className={`h-8 w-8 text-amber-400 transition-transform duration-500 ${pulse ? "scale-110" : "scale-100"}`}
          />
        </div>

        {/* Trade summary */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="text-sm text-zinc-400">Trade logged</div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-300">{symbol}</span>
            <span className={`text-lg font-black ${isWin ? "text-green-400" : "text-red-400"}`}>
              {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Discipline messages */}
        <div className="px-6 pt-4 pb-2 space-y-1">
          <p className="text-sm font-bold text-white">⛔ Step away from the charts.</p>
          <p className="text-sm text-zinc-400">Journal this trade before taking another. Your edge depends on it.</p>
        </div>

        {/* Checklist */}
        <div className="px-6 py-4 space-y-3">
          {CHECKLIST.map((item, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-sm transition-all hover:border-amber-500/40 hover:bg-amber-500/5"
            >
              {checked[i]
                ? <CheckSquare className="h-5 w-5 shrink-0 text-green-400" />
                : <Square className="h-5 w-5 shrink-0 text-zinc-500" />
              }
              <span className={checked[i] ? "line-through text-zinc-500" : "text-zinc-200"}>{item}</span>
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <div className="px-6 pb-6">
          <Button
            onClick={onDismiss}
            disabled={!allChecked}
            className={`w-full py-6 text-base font-bold tracking-wide transition-all ${
              allChecked
                ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/25"
                : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {allChecked ? "✓ I have completed my post-trade routine" : `Complete all ${checked.filter(Boolean).length}/${CHECKLIST.length} items to continue`}
          </Button>
        </div>
      </div>
    </div>
  );
}