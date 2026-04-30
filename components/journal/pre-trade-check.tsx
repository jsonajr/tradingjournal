"use client";
import { useState, useEffect } from "react";
import { CheckSquare, Square, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QUESTIONS = [
  { id: "followed_setup",  label: "Did I follow my setup?" },
  { id: "emotional_trade", label: "Was this trade emotional?" },
  { id: "revenge_trade",   label: "Am I trying to revenge trade?" },
  { id: "needs_break",     label: "Do I need to step away from the charts?" },
  { id: "executed_plan",   label: "Did I execute according to my plan?" },
] as const;

const CHECKLIST_ITEMS = [
  "I have a clear reason for this trade",
  "I know my risk before entering",
  "I am not chasing or forcing this trade",
  "I have reviewed my setup",
  "I am in the right mental state to trade",
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
  const allChecked = checklist.every(Boolean);
  const canContinue = allAnswered && allChecked && confirmed;

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
    } catch {
      // non-blocking
    }
    setSaving(false);
    onPass();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/95 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg min-h-screen md:min-h-0 md:my-6 md:rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden">

        {/* Header */}
        <div className={cn(
          "px-6 py-5 border-b border-white/10",
          isWin ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
        )}>
          <div className="flex items-center gap-3">
            {isWin
              ? <TrendingUp className="h-7 w-7 text-green-400 shrink-0" />
              : <TrendingDown className="h-7 w-7 text-red-400 shrink-0" />
            }
            <div>
              <div className={cn("text-lg font-black leading-tight", isWin ? "text-green-400" : "text-red-400")}>
                {isWin ? "About to log a win — check yourself first." : "About to log a loss — check yourself first."}
              </div>
              <div className="text-xs text-white/40 mt-0.5 uppercase tracking-wide">
                Answer everything honestly before you continue
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 space-y-6">

          {/* Questions */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
              Answer all questions
            </div>
            <div className="space-y-3">
              {QUESTIONS.map((q) => (
                <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-white mb-3">{q.label}</div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: true }))}
                      className={cn(
                        "flex-1 rounded-lg py-3 text-sm font-bold transition-all border",
                        answers[q.id] === true
                          ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20"
                          : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                      )}
                    >
                      YES
                    </button>
                    <button
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: false }))}
                      className={cn(
                        "flex-1 rounded-lg py-3 text-sm font-bold transition-all border",
                        answers[q.id] === false
                          ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20"
                          : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                      )}
                    >
                      NO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          {showWarning && (
            <div className="rounded-xl border-2 border-red-500 bg-red-500/10 p-4 flex gap-3">
              <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-base font-black text-red-400 uppercase tracking-wide">
                  Step away. Do not take another trade.
                </div>
                <div className="text-sm text-red-300/70 mt-1">
                  You are showing signs of emotional or reactive trading. Close the platform and come back with a clear head.
                </div>
              </div>
            </div>
          )}

          {/* Checklist */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
              Pre-trade checklist
            </div>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setChecklist((c) => c.map((v, idx) => idx === i ? !v : v))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all",
                    checklist[i]
                      ? "border-green-500/40 bg-green-500/10 text-green-300"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  )}
                >
                  {checklist[i]
                    ? <CheckSquare className="h-5 w-5 shrink-0 text-green-400" />
                    : <Square className="h-5 w-5 shrink-0 text-white/30" />
                  }
                  <span className={checklist[i] ? "line-through text-green-400/60" : ""}>{item}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <button
            onClick={() => setConfirmed((c) => !c)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
              confirmed
                ? "border-primary bg-primary/10 text-primary"
                : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
            )}
          >
            {confirmed
              ? <CheckSquare className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
              : <Square className="h-5 w-5 shrink-0 mt-0.5" />
            }
            <span className="text-sm font-medium">I reviewed my state and I am ready to log this trade</span>
          </button>

          {!canContinue && (
            <div className="text-xs text-white/30 text-center">
              {!allAnswered && `Answer all ${QUESTIONS.length} questions · `}
              {!allChecked && `Complete checklist · `}
              {!confirmed && `Check confirmation`}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="flex-1 border border-white/10 text-white/50 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!canContinue || saving}
              className={cn(
                "flex-1 py-6 text-base font-bold tracking-wide transition-all",
                canContinue
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              )}
            >
              {saving ? "Saving..." : canContinue ? "✓ Log This Trade" : "Complete all steps"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}