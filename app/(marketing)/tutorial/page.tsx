import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata = {
  title: { absolute: "Tutorial — Tradiator" },
  description: "Learn how to use Tradiator step by step — from logging your first trade to reading your insights.",
};

const DISCORD = "https://discord.gg/uuyAxCavGd";

function TradiatorIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#0f1117"/>
      <rect x="13" y="2" width="3" height="9" rx="1.5" fill="#FFDE28" transform="rotate(-10 14.5 6)"/>
      <rect x="14.5" y="1" width="3" height="10" rx="1.5" fill="#FFDE28"/>
      <rect x="16" y="2" width="3" height="9" rx="1.5" fill="#FFDE28" transform="rotate(10 17.5 6)"/>
      <rect x="5" y="11" width="22" height="5" rx="2" fill="#FFDE28"/>
      <polygon points="5,11 5,16 1,13.5" fill="#FFDE28"/>
      <polygon points="27,11 27,16 31,13.5" fill="#FFDE28"/>
      <rect x="13" y="16" width="6" height="11" rx="2" fill="#FFDE28"/>
      <rect x="13" y="19" width="6" height="1.5" rx="0.5" fill="#c8a800"/>
      <rect x="13" y="22" width="6" height="1.5" rx="0.5" fill="#c8a800"/>
      <ellipse cx="16" cy="29" rx="4.5" ry="3" fill="#FFDE28"/>
    </svg>
  );
}

const STEPS = [
  {
    num: "01",
    title: "Get Your Invite Code",
    emoji: "🔐",
    desc: "Tradiator is invite-only. Join the Discord server and request access from an admin. You'll receive a unique invite code that can only be used once.",
    steps: [
      "Join the Discord server at discord.gg/uuyAxCavGd",
      "Ask in the #get-access channel for an invite code",
      "You'll receive a code like TRAD-X7K2",
      "Head to app.tradiator.net/signup and enter your code, name, email, and password",
      "Your account is created with Premium access automatically",
    ],
    tip: "Each invite code is single-use and may have an expiry date. Use it promptly.",
  },
  {
    num: "02",
    title: "Add Your Trading Account",
    emoji: "🏦",
    desc: "Before logging trades, create at least one trading account. This keeps your stats organized — especially if you trade multiple prop firms.",
    steps: [
      "Go to Settings (bottom left of the sidebar)",
      "Click the Accounts tab",
      "Click + Add Account",
      "Enter a name (e.g. 'Apex 150K' or 'Topstep 150K'), your firm, and starting balance",
      "Create separate accounts for each prop firm evaluation",
    ],
    tip: "Pro tip: name accounts clearly — 'Apex 150K', 'Topstep 150K', 'Alpha Futures 50K'. Much better than 'Account 1'.",
  },
  {
    num: "03",
    title: "Log Your First Trade",
    emoji: "📋",
    desc: "You can log trades two ways — the quick buttons on the dashboard, or the full trade form. Both save to the same trade log.",
    steps: [
      "From the Dashboard, click 📈 Long or 📉 Short for a quick entry",
      "Or go to Trades → New Trade for the full form",
      "Fill in: Symbol (NQ, ES, MNQ...), Direction, Contracts, and P&L",
      "Optionally add Entry, Exit, and Stop prices — R-multiple calculates automatically",
      "Add your Setup, Session, Grade, and Notes for better tracking",
      "Click Save Trade",
    ],
    tip: "R-Multiple = (Exit - Entry) / (Entry - Stop) for longs. Fill in your prices and it calculates instantly.",
  },
  {
    num: "04",
    title: "Write Your Daily Journal",
    emoji: "📅",
    desc: "The Playbook Calendar is where you write your pre-market plan and post-session notes. Every day is color-coded by P&L so you can spot patterns across months.",
    steps: [
      "Go to Playbook Calendar in the sidebar",
      "Click any day to open the journal editor",
      "Set your Market Bias (Bullish / Bearish / Neutral)",
      "Write your pre-session Trading Plan — key levels, setups to watch",
      "After the session, add Post-Session Notes and rate your day 1–5",
      "Mark whether you followed your rules (yes/no)",
      "Add tags like 'fomo', 'patient', 'choppy' to label the session type",
    ],
    tip: "Green days = profitable, red days = loss. The calendar makes your patterns visible at a glance.",
  },
  {
    num: "05",
    title: "Use the Discipline Tools",
    emoji: "🛡️",
    desc: "Tradiator has two built-in guardrails that fire around every trade to keep you honest.",
    steps: [
      "Pre-trade checklist: answer 5 questions before entering any trade",
      "If you flag 'emotional trade' or 'revenge trade', you get a warning popup",
      "Post-trade reflection: complete a 5-item checklist after logging a trade",
      "Items include: journal the trade, screenshot the setup, step away from charts",
      "You can toggle the post-trade popup on/off in Settings → Preferences",
    ],
    tip: "The post-trade popup is on by default. Leave it on for the first month — it builds the habit of reviewing before the next trade.",
  },
  {
    num: "06",
    title: "Build Your Strategy Library",
    emoji: "📐",
    desc: "Document every setup you trade. Strategies are separate from journal entries — they're your permanent playbook that evolves over time.",
    steps: [
      "Go to Strategies in the sidebar",
      "Click + New Strategy",
      "Give it a name (e.g. 'VWAP Reclaim'), description, and entry conditions",
      "Add the sessions it works in (NY Open, London, etc.)",
      "Add timeframes (5m, 15m, 1h)",
      "Tag it (momentum, breakout, ICT, etc.)",
      "Pick a color so it's visually distinct in your trade log",
    ],
    tip: "Writing your conditions in detail forces you to actually know the setup. Vague strategies = inconsistent execution.",
  },
  {
    num: "07",
    title: "Track Your Prop Firm Costs",
    emoji: "💸",
    desc: "The Eval Tracker is where you see your true profitability after all fees. Most traders are surprised how much evaluations actually cost.",
    steps: [
      "Go to Eval Expenses & Payouts in the sidebar",
      "Under Expenses, click + Add to log evaluation fees, resets, monthly fees",
      "Under Payouts, click + Add when you receive a withdrawal",
      "The summary cards show Total Payouts, Total Expenses, and Net Profit",
      "Track Apex, Topstep, and Alpha Futures separately to see which ones are actually worth it",
    ],
    tip: "Log expenses the day you pay them and payouts the day you receive them. Accuracy matters for true P&L.",
  },
  {
    num: "08",
    title: "Import Existing Trades",
    emoji: "📥",
    desc: "Already have trade history in Tradovate, ProjectX, or another platform? Import it in bulk via CSV so your stats start with real data.",
    steps: [
      "Export your trades from your platform as a CSV file",
      "For Tradovate: use the Trades report (not Fills)",
      "Go to Import in the sidebar",
      "Select your platform: Tradovate, ProjectX, or Generic",
      "Select the account to import into",
      "Paste your CSV content into the text area",
      "Preview the parsed rows, then click Import",
    ],
    tip: "Warning: importing the same CSV twice creates duplicates. Always check your trade count after importing.",
  },
  {
    num: "09",
    title: "Read Your Insights",
    emoji: "⚡",
    desc: "Once you have a month or more of trades, the Insights page tells you things about your trading you didn't know. This is where the real work happens.",
    steps: [
      "Go to Insights in the sidebar",
      "Check Win Rate, Profit Factor, and Avg R-Multiple first",
      "Look at Best Day of Week — do you trade better on Tuesdays? Worse on Fridays?",
      "Check Top Symbols — NQ making money but CL bleeding it?",
      "Check Top Setups — which setup actually makes you money vs which one you just like",
      "Check Journal Stats — did you follow your rules on your winning days?",
    ],
    tip: "Profit Factor above 1.5 means your winners outweigh your losers. Below 1.0 means you're net negative — fix that before scaling.",
  },
  {
    num: "10",
    title: "Customize Your Settings",
    emoji: "⚙️",
    desc: "Personalize Tradiator to fit your workflow.",
    steps: [
      "Settings → Profile: update your name and timezone",
      "Settings → Accounts: add/edit/remove trading accounts",
      "Settings → Preferences: toggle the post-trade reflection popup",
      "Settings → Sessions: view and revoke active login sessions across devices",
      "Settings → Danger Zone: clear all trades or delete your account (irreversible)",
      "Theme: switch between Light, Dark, and Midnight using the icon at the bottom of the sidebar",
    ],
    tip: "Set your timezone correctly — it affects how trade dates are displayed across the app.",
  },
];

export default function TutorialPage() {
  return (
    <div className="dark min-h-screen overflow-x-hidden" style={{ background: "hsl(224,27%,8%)", color: "hsl(210,40%,98%)" }}>

      {/* NAV */}
      <header className="border-b border-white/8 bg-[hsl(224,27%,8%)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <TradiatorIcon size={26} />
            <span className="text-sm font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </Link>
          <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Link href="/" className="transition-colors hover:text-white flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Home</Link>
            <Link href="/docs" className="transition-colors hover:text-white">Docs</Link>
            <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Discord</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="mx-auto max-w-5xl px-6 py-16 border-b border-white/6">
        <div className="mb-4 text-xs font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>Getting Started</div>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl mb-4">How to use Tradiator</h1>
        <p className="text-lg max-w-xl" style={{ color: "rgba(255,255,255,0.5)" }}>
          A step-by-step walkthrough of every feature — from signing up to reading your insights after 30 days of trading.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {STEPS.map(({ num, title }) => (
            <a key={num} href={`#step-${num}`}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-all hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              {num} · {title}
            </a>
          ))}
        </div>
      </div>

      {/* STEPS */}
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-0">
        {STEPS.map(({ num, title, emoji, desc, steps, tip }, idx) => (
          <div key={num} id={`step-${num}`} className="flex gap-8 py-16 border-b border-white/6">
            {/* Left number */}
            <div className="hidden md:flex flex-col items-center gap-3 pt-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                style={{ background: "rgba(255,222,40,0.1)", border: "1px solid rgba(255,222,40,0.25)", color: "#FFDE28" }}>
                {num}
              </div>
              {idx < STEPS.length - 1 && (
                <div className="w-px flex-1 min-h-[40px]" style={{ background: "rgba(255,255,255,0.07)" }} />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{emoji}</span>
                <h2 className="text-xl font-black text-white">{title}</h2>
                <span className="md:hidden text-xs font-mono px-2 py-0.5 rounded" style={{ background: "rgba(255,222,40,0.1)", color: "#FFDE28" }}>{num}</span>
              </div>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</p>

              {/* Steps list */}
              <div className="space-y-2 mb-6">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold mt-0.5"
                      style={{ background: "rgba(255,222,40,0.12)", color: "#FFDE28" }}>
                      {i + 1}
                    </div>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{step}</span>
                  </div>
                ))}
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 rounded-lg px-4 py-3"
                style={{ background: "rgba(255,222,40,0.06)", border: "1px solid rgba(255,222,40,0.15)" }}>
                <span className="text-base shrink-0 mt-0.5">💡</span>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{tip}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="border-t border-white/6 py-20 text-center" style={{ background: "hsl(223,26%,11%)" }}>
        <div className="text-2xl mb-2">🏛️</div>
        <h2 className="text-2xl font-black text-white mb-3">Ready to enter the arena?</h2>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
          Join the Discord to get your invite code and start building your trading discipline today.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href={DISCORD} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-bold text-black transition-all hover:brightness-105"
            style={{ background: "#FFDE28" }}>
            Get access <ArrowRight className="h-4 w-4" />
          </a>
          <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>
            Back to home
          </Link>
        </div>
      </div>

    </div>
  );
}