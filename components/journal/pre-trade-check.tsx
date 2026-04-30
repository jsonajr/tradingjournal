"use client";
import { useState, useEffect } from "react";
import { CheckSquare, Square, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  { id: "followed_setup",  label: "Did I follow my setup?" },
  { id: "emotional_trade", label: "Was this trade emotional?" },
  { id: "revenge_trade",   label: "Am I revenge trading?" },
  { id: "needs_break",     label: "Do I need to step away?" },
  { id: "executed_plan",   label: "Did I execute my plan?" },
] as const;

const CHECKLIST_ITEMS = [
  "Clear reason for this trade",
  "Know my risk before entering",
  "Not chasing or forcing",
  "Setup reviewed",
  "Right mental state",
];

type QuestionId = typeof QUESTIONS[number]["id"];
type Answers = Partial<Record<QuestionId, boolean>>;

interface PreTradeCheckProps {
  open: boolean;
  direction: "Long" | "Short";
  onPass: () => void;
  onCancel: () => void;
}

export function PreTradeCheck({ open, direction, onPass, onCancel }: PreTradeCheckProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [checklist, setChecklist] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false));
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const isWin = direction === "Long";
  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined);
  const canContinue = allAnswered && confirmed;

  const showWarning =
    answers.emotional_trade === true ||
    answers.revenge_trade === true ||
    answers.needs_break === true;

  useEffect(() => {
    if (!open) {
      setAnswers({});
      setChecklist(CHECKLIST_ITEMS.map(() => false));
      setConfirmed(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleContinue() {
    setSaving(true);
    try {
      await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade_id: null,
          trade_result: isWin ? "win" : "loss",
          followed_setup: answers.followed_setup ?? false,
          emotional_trade: answers.emotional_trade ?? false,
          revenge_trade: answers.revenge_trade ?? false,
          needs_break: answers.needs_break ?? false,
          executed_plan: answers.executed_plan ?? false,
          checklist: CHECKLIST_ITEMS.reduce((acc, item, i) => ({ ...acc, [item]: checklist[i] }), {}),
        }),
      });
    } catch { /* non-blocking */ }
    setSaving(false);
    onPass();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3">
      <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden flex flex-col max-h-[95dvh]">

        {/* Header — compact */}
        <div className={cn(
          "flex items-center gap-2.5 px-4 py-3 border-b border-white/10 shrink-0",
          isWin ? "bg-green-500/10" : "bg-red-500/10"
        )}>
          {isWin
            ? <TrendingUp className="h-5 w-5 text-green-400 shrink-0" />
            : <TrendingDown className="h-5 w-5 text-red-400 shrink-0" />
          }
          <div>
            <div className={cn("text-sm font-black leading-tight", isWin ? "text-green-400" : "text-red-400")}>
              {isWin ? "Logging a win — check yourself first." : "Logging a loss — check yourself first."}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Answer honestly before continuing</div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">

          {/* Questions — inline label + YES/NO */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">Questions</div>
            {QUESTIONS.map((q) => (
              <div key={q.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <span className="flex-1 text-sm text-white/90">{q.label}</span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: true }))}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold transition-all border",
                      answers[q.id] === true
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-white/15 text-white/40 hover:border-white/30 hover:text-white"
                    )}
                  >YES</button>
                  <button
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: false }))}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold transition-all border",
                      answers[q.id] === false
                        ? "bg-red-500 border-red-500 text-white"
                        : "border-white/15 text-white/40 hover:border-white/30 hover:text-white"
                    )}
                  >NO</button>
                </div>
              </div>
            ))}
          </div>

          {/* Warning — compact */}
          {showWarning && (
            <div className="flex gap-2.5 rounded-lg border border-red-500 bg-red-500/10 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-black text-red-400">Step away. Do not trade.</div>
                <div className="text-xs text-red-300/60 mt-0.5">You're showing signs of emotional trading. Come back with a clear head.</div>
              </div>
            </div>
          )}

          {/* Checklist — compact pills */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">Pre-trade checklist <span className="normal-case text-white/25">(optional)</span></div>
            <div className="space-y-1">
              {CHECKLIST_ITEMS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setChecklist((c) => c.map((v, idx) => idx === i ? !v : v))}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-all",
                    checklist[i]
                      ? "border-green-500/30 bg-green-500/10 text-green-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                  )}
                >
                  {checklist[i]
                    ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-green-400" />
                    : <Square className="h-3.5 w-3.5 shrink-0 text-white/25" />
                  }
                  <span className={checklist[i] ? "line-through text-green-400/50" : ""}>{item}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <button
            onClick={() => setConfirmed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all",
              confirmed
                ? "border-primary bg-primary/10 text-primary"
                : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
            )}
          >
            {confirmed
              ? <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
              : <Square className="h-4 w-4 shrink-0" />
            }
            <span className="text-sm font-medium">I'm in the right state to log this trade</span>
          </button>

        </div>

        {/* Footer — sticky */}
        <div className="shrink-0 border-t border-white/10 px-4 py-3 flex gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="border border-white/10 text-white/50 hover:text-white px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue || saving}
            className={cn(
              "flex-1 font-bold transition-all",
              canContinue
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            {saving ? "Saving..." : canContinue ? "✓ Log This Trade" : !allAnswered ? `Answer all questions (${Object.keys(answers).length}/5)` : "Confirm to continue"}
          </Button>
        </div>

      </div>
    </div>
  );
}