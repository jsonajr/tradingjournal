import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { TrendingUp, BarChart2, BookOpen, Shield, Zap, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Tradiator — Trade with Discipline",
  description: "The trading journal and discipline platform built for serious futures traders. Log every trade, enforce your rules, find your edge.",
};

const DISCORD = "https://discord.gg/uuyAxCavGd";

const TICKERS = [
  { sym: "NQ", val: "+2.4%", pos: "top-[18%] left-[6%]", rot: "-rotate-6" },
  { sym: "ES", val: "+1.1%", pos: "top-[28%] right-[5%]", rot: "rotate-4" },
  { sym: "CL", val: "-0.8%", pos: "top-[60%] left-[3%]", rot: "rotate-3" },
  { sym: "GC", val: "+0.5%", pos: "top-[55%] right-[4%]", rot: "-rotate-2" },
  { sym: "MNQ", val: "+2.4%", pos: "top-[78%] left-[8%]", rot: "-rotate-3" },
  { sym: "RTY", val: "-1.2%", pos: "top-[72%] right-[7%]", rot: "rotate-5" },
];

export default async function RootPage() {
  const profile = await getCurrentProfile();
  if (profile && !profile.banned) {
    redirect(profile.role === "admin" || profile.role === "moderator" ? "/admin" : "/dashboard");
  }

  return (
    // Force dark theme on landing page regardless of user system preference
    <div className="dark min-h-screen overflow-x-hidden" style={{ background: "hsl(224,27%,8%)", color: "hsl(210,40%,98%)" }}>

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[hsl(224,27%,8%)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <TrendingUp className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="text-sm font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-md px-3 py-1.5 text-sm text-white/50 transition-colors hover:text-white">Features</a>
            <Link href="/docs" className="rounded-md px-3 py-1.5 text-sm text-white/50 transition-colors hover:text-white">Docs</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-4 py-1.5 text-sm font-medium text-white/50 transition-colors hover:text-white">
              Sign in
            </Link>
            <a href={DISCORD} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-black shadow-md shadow-primary/20 transition-all hover:brightness-105">
              Get access <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-20" style={{ paddingTop: "56px" }}>

        {/* Grid texture */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gold glow */}
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(255,222,40,0.07)" }} />

        {/* Floating ticker symbols */}
        {TICKERS.map(({ sym, val, pos, rot }) => {
          const isPos = val.startsWith("+");
          return (
            <div key={sym}
              className={`pointer-events-none absolute hidden xl:flex ${pos} ${rot} items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-2 backdrop-blur-sm`}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-xs font-black text-white/70">{sym}</span>
              <span className={`text-[10px] font-semibold ${isPos ? "text-green-400" : "text-red-400"}`}>{val}</span>
            </div>
          );
        })}

        <div className="relative mx-auto max-w-4xl text-center">

          {/* Badge — with generous top spacing from nav */}
          <div className="mb-8 mt-16 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{ borderColor: "rgba(255,222,40,0.3)", background: "rgba(255,222,40,0.1)", color: "#FFDE28" }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#FFDE28" }} />
            Invite-only · Trading discipline platform
          </div>

          <h1 className="text-5xl font-black leading-[1.02] tracking-tight md:text-7xl lg:text-[84px]">
            Stop losing money<br />
            <span style={{ color: "#FFDE28" }}>to bad habits.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base text-white/50 md:text-lg">
            Tradiator is a trading journal and discipline system built for serious futures traders.
            Log every trade, enforce your rules, and find your real edge.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a href={DISCORD} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-7 py-3 text-sm font-bold text-black shadow-lg transition-all hover:brightness-105 hover:-translate-y-px"
              style={{ background: "#FFDE28", boxShadow: "0 8px 32px rgba(255,222,40,0.25)" }}>
              Request access <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/login"
              className="inline-flex items-center gap-2 rounded-md border px-7 py-3 text-sm font-medium text-white/50 transition-all hover:text-white"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/25">Join via Discord · Built for prop firm traders</p>
        </div>

        {/* ── DASHBOARD PREVIEW ── */}
        <div className="relative mx-auto mt-24 w-full max-w-5xl">
          <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/70"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Browser bar */}
            <div className="flex items-center gap-1.5 px-4 py-2.5"
              style={{ background: "hsl(223,26%,14%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <div className="ml-3 rounded px-3 py-0.5 font-mono text-[10px] text-white/30"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                app.tradiator.net/dashboard
              </div>
            </div>
            {/* App shell */}
            <div className="flex" style={{ background: "hsl(224,27%,8%)", height: "340px" }}>
              {/* Sidebar */}
              <div className="hidden w-48 flex-col border-r p-2 md:flex"
                style={{ background: "hsl(223,26%,11%)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="mb-3 border-b pb-3 px-2 text-[11px] font-black tracking-widest"
                  style={{ color: "#FFE133", borderColor: "rgba(255,255,255,0.07)" }}>TRADIATOR</div>
                {[["Dashboard", true],["Trades", false],["Eval Expenses & Payouts", false],["Playbook Calendar", false],["Strategies", false],["Insights", false]].map(([l, a]) => (
                  <div key={l as string}
                    className="mb-0.5 truncate rounded px-2.5 py-1.5 text-xs font-medium"
                    style={a ? { background: "rgba(255,222,40,0.1)", color: "#FFDE28" } : { color: "rgba(255,255,255,0.4)" }}>
                    {l as string}
                  </div>
                ))}
                <div className="mt-auto border-t pt-2 px-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="text-xs font-medium text-white/80">Hamza</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: "#FFDE28" }}>user · premium</div>
                </div>
              </div>
              {/* Main */}
              <div className="flex-1 overflow-hidden p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Welcome back, Hamza</div>
                    <div className="text-xs text-white/40">Your trading overview</div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="rounded px-2.5 py-1 text-[11px] font-semibold text-green-400"
                      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>📈 Long</div>
                    <div className="rounded px-2.5 py-1 text-[11px] font-semibold text-red-400"
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>📉 Short</div>
                  </div>
                </div>
                {/* Date filters */}
                <div className="mb-3 flex flex-wrap gap-1">
                  {["Today","1W","1M","3M","6M","1Y","All","Custom"].map((l) => (
                    <div key={l} className="rounded px-2 py-0.5 text-[10px] font-medium"
                      style={l === "All"
                        ? { border: "1px solid rgba(255,222,40,0.4)", background: "rgba(255,222,40,0.1)", color: "#FFDE28" }
                        : { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                      {l}
                    </div>
                  ))}
                </div>
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    ["Net P&L","+$4,820","#22c55e","142 trades"],
                    ["Win Rate","67.4%","#60a5fa","96W / 46L"],
                    ["Profit Factor","2.14","#22c55e",""],
                    ["Avg W / L","","","per trade"],
                    ["Best Day %","18.3%","#22c55e","Jan 9 · +$884"],
                    ["Best DOW","Tue","#FFDE28","+$1,840 avg"],
                  ].map(([label, val, color, sub], i) => (
                    <div key={i} className="rounded p-2"
                      style={{ background: "hsl(223,26%,11%)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-[9px] uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
                      {label === "Avg W / L" ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-[13px] font-black text-green-400">+$385</span>
                          <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.3)" }}>/</span>
                          <span className="text-[13px] font-black text-red-400">-$183</span>
                        </div>
                      ) : (
                        <div className="text-sm font-black leading-tight" style={{ color }}>{val}</div>
                      )}
                      {sub && <div className="text-[9px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</div>}
                    </div>
                  ))}
                </div>
                {/* Equity chart */}
                <div className="rounded p-2" style={{ background: "hsl(223,26%,11%)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-[10px] font-semibold mb-1 text-white/60">Equity Curve</div>
                  <svg width="100%" height="42" viewBox="0 0 380 42" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity=".25"/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0,38 C25,35 50,30 75,26 S110,19 135,15 S158,17 178,13 S210,8 235,5 S265,3 290,5 S325,2 355,1 L380,0"
                      fill="none" stroke="#22c55e" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                    <path d="M0,38 C25,35 50,30 75,26 S110,19 135,15 S158,17 178,13 S210,8 235,5 S265,3 290,5 S325,2 355,1 L380,0 L380,42 L0,42Z"
                      fill="url(#g)"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* glow */}
          <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full blur-[50px]"
            style={{ background: "rgba(255,222,40,0.07)" }} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mx-auto max-w-6xl px-6 py-28" id="features"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mb-4 text-center text-xs font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>
          Everything you need
        </div>
        <h2 className="mb-16 text-center text-3xl font-black tracking-tight text-white md:text-4xl">
          Built for traders who are serious<br className="hidden md:block" /> about improving
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BarChart2, title: "Live Dashboard", desc: "Net PnL, win rate, profit factor, best day, best DOW — filtered by Today, 1W, 1M, 3M, 6M, 1Y, or custom date range.", emoji: "📊" },
            { icon: BookOpen, title: "Playbook Calendar", desc: "Monthly calendar with daily P&L. Write your market bias, trading plan, mood, and post-session notes every day.", emoji: "📅" },
            { icon: TrendingUp, title: "Trade Log", desc: "Log every trade with symbol, direction, setup, session, grade, and R-multiple. Auto-calculated from entry, exit, and stop.", emoji: "📋" },
            { icon: Shield, title: "Discipline System", desc: "Pre-trade checklists and post-trade reflections enforce your rules after every single trade. Flags emotional and revenge trades.", emoji: "🛡️" },
            { icon: Zap, title: "Deep Insights", desc: "Best setups, top symbols, day-of-week breakdown, best month — find exactly where your edge lives and where it doesn't.", emoji: "⚡" },
            { icon: TrendingUp, title: "Prop Eval Tracker", desc: "Track every evaluation fee, reset, and payout per firm. See your true net profitability across all prop firms.", emoji: "🏆" },
          ].map(({ title, desc, emoji }) => (
            <div key={title}
              className="group rounded-xl p-6 transition-all duration-200 hover:[border-color:rgba(255,222,40,0.25)]"
              style={{ background: "hsl(223,26%,11%)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="mb-4 text-2xl">{emoji}</div>
              <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "hsl(223,26%,11%)" }}>
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              ["📐", "R-Multiple", "Auto-calculated"],
              ["🎨", "3 Themes", "Light · Dark · Midnight"],
              ["📥", "CSV Import", "Tradovate · ProjectX · Generic"],
              ["🔒", "Invite Only", "Serious traders only"],
            ].map(([icon, val, label]) => (
              <div key={val}>
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-base font-black" style={{ color: "#FFDE28" }}>{val}</div>
                <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden py-28" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
          style={{ background: "rgba(255,222,40,0.07)" }} />
        <div className="relative mx-auto max-w-xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Ready to trade<br /><span style={{ color: "#FFDE28" }}>with discipline?</span>
          </h2>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Tradiator is invite-only. Join the Discord to request access and start journaling today.
          </p>
          <a href={DISCORD} target="_blank" rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-md px-8 py-3 text-sm font-bold text-black shadow-lg transition-all hover:brightness-105"
            style={{ background: "#FFDE28", boxShadow: "0 8px 32px rgba(255,222,40,0.25)" }}>
            Join Discord <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "hsl(223,26%,11%)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <TrendingUp className="h-3 w-3 text-black" />
            </div>
            <span className="text-xs font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Link href="/docs" className="transition-colors hover:text-white">Docs</Link>
            <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
            <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Discord</a>
          </div>
        </div>
      </footer>

    </div>
  );
}