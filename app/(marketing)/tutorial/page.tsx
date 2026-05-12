import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Settings, BarChart2, Calendar, TrendingUp, DollarSign, FileText, Zap, Upload, AlertCircle } from "lucide-react";

export const metadata = {
  title: { absolute: "Tutorial — Tradiator" },
  description: "Learn how to use Tradiator step by step — from logging your first trade to reading your insights.",
};

const DISCORD = "https://discord.gg/uuyAxCavGd";

function TradiatorIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#111827"/>
      <rect x="4" y="7" width="24" height="4.5" rx="1.5" fill="#FFDE28"/>
      <polygon points="16,5 23,14 19.5,14 19.5,27 12.5,27 12.5,14 9,14" fill="#FFDE28"/>
    </svg>
  );
}

const STEPS = [
  {
    num: "01", emoji: "🔐",
    title: "Get Your Invite Code",
    desc: "Tradiator is invite-only. Join the Discord and request access. You'll get a single-use invite code.",
    steps: [
      "Join Discord at discord.gg/uuyAxCavGd",
      "Ask in #get-access for an invite code",
      "Go to app.tradiator.net/signup and enter your code, name, email, and password",
      "Your account is created with Premium access automatically",
    ],
    tip: "Each invite code is single-use and may have an expiry. Use it promptly.",
  },
  {
    num: "02", emoji: "🏦",
    title: "Add Your Trading Accounts",
    desc: "Create accounts for each prop firm evaluation or live account before logging trades. This keeps all your stats organized and filterable.",
    steps: [
      "Go to Settings → Accounts tab",
      "Click + Add Account",
      "Enter a name (e.g. 'Apex 50K #1'), firm, type (Eval / Funded / Live), and balance",
      "Create separate accounts for each eval — they can all be tracked individually",
      "Mark accounts as Blown when you fail them — tracks your survival rate",
    ],
    tip: "Name accounts clearly: 'Topstep 50K #1', 'Alpha Premium 50K #3'. Set Auto Commission in Settings to pre-fill commission on every trade.",
  },
  {
    num: "03", emoji: "📋",
    title: "Log Your First Trade",
    desc: "Log trades from the Dashboard quick buttons or the full trade form. Both save to the same trade history.",
    steps: [
      "From Dashboard, click 📈 Long or 📉 Short for a quick entry",
      "Or go to Trades → New Trade for the full form",
      "Fill in: Symbol, Direction, Contracts, and P&L",
      "Add Entry, Exit, and Stop prices — R-multiple calculates automatically",
      "Add Setup, Session, Grade, and Notes for better tracking",
      "If you made a mistake, select it from the Mistake dropdown",
      "For Eval/Funded accounts, toggle 'This trade blew the account' if it ended the account",
    ],
    tip: "Grade every trade: A+/A for textbook execution, B for OK, C/D for rule violations. This data becomes very useful in Insights.",
  },
  {
    num: "04", emoji: "📥",
    title: "Import from Tradovate",
    desc: "Already trading on Tradovate? Import your history directly instead of logging manually.",
    steps: [
      "In Tradovate, go to Account → Reports → Performance",
      "Export as CSV",
      "In Tradiator, go to Import CSV",
      "Select Tradovate as the platform and choose your account",
      "Upload the Performance.csv file — entry/exit prices, P&L, and commission import automatically",
    ],
    tip: "Use the Performance report — not Fills or Orders. Auto Commission in Settings fills in commission when the CSV doesn't include it.",
  },
  {
    num: "05", emoji: "📅",
    title: "Use the Playbook Calendar",
    desc: "The calendar shows every trading day color-coded by P&L. Click any day to see a full breakdown.",
    steps: [
      "Go to Playbook Calendar in the sidebar",
      "Use the Eval/Funded/Live pill tabs to filter by account type",
      "Green days = profitable, red days = loss",
      "Click any day to open the day screen",
      "On the day screen: see trade cards, stat cards, and write your journal entry",
      "Journal entry includes bias, mood, rating, pre-market plan, post-session notes, and improvement focus",
    ],
    tip: "Journal on green AND red days. The pattern of what you write on green days vs red days reveals a lot.",
  },
  {
    num: "06", emoji: "❌",
    title: "Build Your Playbook",
    desc: "Document your setups, recurring mistakes, and winning patterns in the Strategies section.",
    steps: [
      "Go to Strategies in the sidebar",
      "Use the 4 tabs: Strategies, Setups, Mistakes, Winners",
      "In Setups — document each setup with entry conditions, rules, and a screenshot",
      "In Mistakes — log every mistake you repeat (e.g. 'Chasing entries')",
      "In Winners — document patterns that keep repeating profitably",
      "Tag trades with a specific mistake when logging to track the cost over time",
    ],
    tip: "Be specific with mistakes. 'Bad trade' is useless. 'Entered outside killzone after missing the first setup' is actionable.",
  },
  {
    num: "07", emoji: "💸",
    title: "Track Prop Expenses & Payouts",
    desc: "The Prop Expenses & Payouts page tracks every dollar in and out across all your prop firms.",
    steps: [
      "Go to Prop Expenses & Payouts in the sidebar",
      "Click Add Expense to log eval fees, reset fees, and monthly fees",
      "Click Add Payout when you receive a withdrawal",
      "The All Activity table shows everything sorted by date",
      "Summary stats show your real net profit after all expenses and ROI on evals",
    ],
    tip: "Log expenses immediately when you pay them. You'll be surprised how much eval fees eat into profits.",
  },
  {
    num: "08", emoji: "⚡",
    title: "Read Your Insights",
    desc: "Insights breaks down your performance by every variable — setup, session, symbol, day of week, and grade.",
    steps: [
      "Go to Insights in the sidebar",
      "Use the Eval/Funded/Live pill tabs to see separate stats",
      "Scroll through sections: Core Stats, Trade Metrics, Long vs Short, Day of Week, Monthly, By Symbol, By Setup, By Session",
      "Find your highest win-rate setup and your worst session",
      "Look at the Blown account section (Eval/Funded tabs) for survival rate and blow-up P&L",
    ],
    tip: "Sort By Setup to find which setups actually make money. Stop trading the ones that don't.",
  },
  {
    num: "09", emoji: "📊",
    title: "Master the Dashboard",
    desc: "The dashboard shows your performance summary filtered by account type and date range.",
    steps: [
      "Use Eval / Funded / Live tabs to see stats for each account type separately",
      "The dashboard auto-opens the most profitable tab",
      "Use date range presets (Today, 1W, 1M, 3M, 6M, 1Y, All) or custom dates",
      "Green 'Active' and red 'Blown' badges show your account survival status",
      "Recent Trades shows your last 10 unique trades (deduped across copy-traded accounts)",
    ],
    tip: "Check the dashboard every morning before trading. Knowing your YTD P&L and win rate sets the right context.",
  },
  {
    num: "10", emoji: "🔧",
    title: "Settings & Preferences",
    desc: "Customize the app to match how you trade.",
    steps: [
      "Settings → Preferences: set Auto Commission to pre-fill commission on every new trade",
      "Settings → Accounts: add, edit, or mark accounts as blown",
      "Settings → Profile: update your display name and avatar",
      "Settings → Appearance: switch between Light, Dark, and Midnight themes",
      "Settings → Preferences: toggle the post-trade popup on/off",
    ],
    tip: "Set Auto Commission to your per-trade commission rate (e.g. $3.50 for 1 NQ contract). It saves time on every single trade entry.",
  },
];

export default function TutorialPage() {
  return (
    <div className="dark min-h-screen" style={{ background: "hsl(224,27%,8%)", color: "hsl(210,40%,98%)" }}>
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[hsl(224,27%,8%)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <TradiatorIcon size={26} />
            <span className="text-sm font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/docs" className="text-sm text-white/50 hover:text-white transition-colors">Docs</Link>
            <Link href="/dashboard" className="rounded-md px-4 py-1.5 text-sm font-semibold text-black" style={{ background: "#FFDE28" }}>Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{ borderColor: "rgba(255,222,40,0.3)", background: "rgba(255,222,40,0.1)", color: "#FFDE28" }}>
            <BookOpen className="h-3 w-3" /> Step-by-step guide
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Getting Started</h1>
          <p className="mt-4 text-base text-white/50 max-w-lg mx-auto">
            From your first login to reading your insights — everything you need to get the most out of Tradiator.
          </p>
        </div>bgvjk

        {/* Quick nav */}
        <div className="mb-14 flex flex-wrap gap-2 justify-center">
          {STEPS.map(s => (
            <a key={s.num} href={"#step-" + s.num}
              className="rounded-full border px-3 py-1 text-xs text-white/50 hover:text-white hover:border-white/30 transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              {s.emoji} {s.title}
            </a>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {STEPS.map((s, i) => (
            <div key={s.num} id={"step-" + s.num} className="rounded-xl p-6 scroll-mt-20"
              style={{ background: "hsl(223,26%,11%)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: "rgba(255,222,40,0.1)", border: "1px solid rgba(255,222,40,0.2)" }}>
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: "#FFDE28" }}>Step {s.num}</span>
                    <h2 className="text-lg font-black text-white">{s.title}</h2>
                  </div>
                  <p className="text-sm text-white/60 mb-4 leading-relaxed">{s.desc}</p>
                  <ol className="space-y-2 mb-4">
                    {s.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5"
                          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                          {j + 1}
                        </span>
                        <span className="text-white/70 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(255,222,40,0.07)", border: "1px solid rgba(255,222,40,0.15)", color: "rgba(255,222,40,0.9)" }}>
                    <span className="font-semibold">Tip:</span> {s.tip}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 rounded-xl p-8 text-center" style={{ background: "hsl(223,26%,11%)", border: "1px solid rgba(255,222,40,0.2)" }}>
          <div className="text-2xl mb-3">🎉</div>
          <h3 className="text-xl font-black text-white mb-2">You're all set</h3>
          <p className="text-sm text-white/50 mb-6 max-w-sm mx-auto">
            You now know how to use every feature in Tradiator. Head to the dashboard and start logging.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-bold text-black"
              style={{ background: "#FFDE28" }}>
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-2 rounded-md border px-6 py-2.5 text-sm font-medium text-white/60 hover:text-white"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}>
              Read the Docs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}