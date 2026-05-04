import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { TrendingUp, BarChart2, BookOpen, Shield, Zap, ArrowRight, Check, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Tradiator — Trade with Discipline",
  description: "The trading journal and discipline platform built for serious futures traders. Log every trade, enforce your rules, find your edge.",
};

export default async function RootPage() {
  const profile = await getCurrentProfile();
  if (profile && !profile.banned) {
    redirect(profile.role === "admin" || profile.role === "moderator" ? "/admin" : "/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <TrendingUp className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="text-sm font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#pricing" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
            <Link href="/docs" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">Docs</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-black transition-all hover:brightness-105 shadow-md shadow-primary/20">
              Get access <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-14 pb-20">
        {/* Grid texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--border)) 1px,transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gold glow */}
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[140px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Invite-only · Trading discipline platform
          </div>

          <h1 className="text-5xl font-black leading-[1.02] tracking-tight md:text-7xl lg:text-[84px]">
            Stop losing money<br />
            <span className="text-primary">to bad habits.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base text-muted-foreground md:text-lg">
            Tradiator is a trading journal and discipline system built for serious futures traders.
            Log every trade, enforce your rules, and find your real edge.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-bold text-black shadow-lg shadow-primary/25 transition-all hover:brightness-105 hover:-translate-y-px">
              Request access <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-md border border-border px-7 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground">
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/50">Invite code required · Built for prop firm traders</p>
        </div>

        {/* ── DASHBOARD PREVIEW ── */}
        <div className="relative mx-auto mt-20 w-full max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-border shadow-2xl shadow-black/60">
            {/* Browser bar */}
            <div className="flex items-center gap-1.5 border-b border-border bg-card px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <div className="ml-3 rounded border border-border bg-background/50 px-3 py-0.5 font-mono text-[10px] text-muted-foreground">
                app.tradiator.net/dashboard
              </div>
            </div>
            {/* App shell */}
            <div className="flex bg-background" style={{ height: "340px" }}>
              {/* Sidebar */}
              <div className="hidden w-48 flex-col border-r border-border bg-card p-2 md:flex">
                <div className="mb-3 border-b border-border pb-3 px-2 text-[11px] font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</div>
                {[["Dashboard", true],["Trades", false],["Eval Expenses & Payouts", false],["Playbook Calendar", false],["Strategies", false],["Insights", false]].map(([l, a]) => (
                  <div key={l as string} className={`mb-0.5 truncate rounded px-2.5 py-1.5 text-xs font-medium ${a ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>{l as string}</div>
                ))}
                <div className="mt-auto border-t border-border pt-2 px-2">
                  <div className="text-xs font-medium">Hamza</div>
                  <div className="text-[9px] uppercase tracking-wider text-primary">user · premium</div>
                </div>
              </div>
              {/* Main */}
              <div className="flex-1 overflow-hidden p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">Welcome back, Hamza</div>
                    <div className="text-xs text-muted-foreground">Your trading overview</div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="rounded border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-500">📈 Long</div>
                    <div className="rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-500">📉 Short</div>
                  </div>
                </div>
                {/* Date filters */}
                <div className="mb-3 flex flex-wrap gap-1">
                  {["Today","1W","1M","3M","6M","1Y","All","Custom"].map((l) => (
                    <div key={l} className={`rounded px-2 py-0.5 text-[10px] font-medium border ${l==="All"?"border-primary/40 bg-primary/10 text-primary":"border-border text-muted-foreground"}`}>{l}</div>
                  ))}
                </div>
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    ["Net P&L","+$4,820","text-green-500","142 trades"],
                    ["Win Rate","67.4%","text-blue-400","96W / 46L"],
                    ["Profit Factor","2.14","text-green-500",""],
                    ["Avg W / L","","","per trade"],
                    ["Best Day %","18.3%","text-green-500","Jan 9 · +$884"],
                    ["Best DOW","Tue","text-primary","+$1,840 avg"],
                  ].map(([label, val, cls, sub], i) => (
                    <div key={i} className="rounded border border-border bg-card p-2">
                      <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
                      {label === "Avg W / L" ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-[13px] font-black text-green-500">+$385</span>
                          <span className="text-[8px] text-muted-foreground">/</span>
                          <span className="text-[13px] font-black text-red-500">-$183</span>
                        </div>
                      ) : (
                        <div className={`text-sm font-black leading-tight ${cls}`}>{val}</div>
                      )}
                      {sub && <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
                    </div>
                  ))}
                </div>
                {/* Equity chart */}
                <div className="rounded border border-border bg-card p-2">
                  <div className="text-[10px] font-semibold mb-1">Equity Curve</div>
                  <svg width="100%" height="42" viewBox="0 0 380 42" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity=".2"/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0,38 C25,35 50,30 75,26 S110,19 135,15 S158,17 178,13 S210,8 235,5 S265,3 290,5 S325,2 355,1 L380,0" fill="none" stroke="#22c55e" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
                    <path d="M0,38 C25,35 50,30 75,26 S110,19 135,15 S158,17 178,13 S210,8 235,5 S265,3 290,5 S325,2 355,1 L380,0 L380,42 L0,42Z" fill="url(#g)"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* glow */}
          <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full bg-primary/8 blur-[50px]" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="mx-auto max-w-6xl px-6 py-28" id="features">
        <div className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-primary">Everything you need</div>
        <h2 className="mb-16 text-center text-3xl font-black tracking-tight md:text-4xl">
          Built for traders who are serious<br className="hidden md:block" /> about improving
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BarChart2, title: "Live Dashboard", desc: "Net PnL, win rate, profit factor, best day, best DOW — filtered by Today, 1W, 1M, 3M, 6M, 1Y, or custom date range." },
            { icon: BookOpen, title: "Playbook Calendar", desc: "Monthly calendar with daily P&L. Write your market bias, trading plan, mood, and post-session notes every day." },
            { icon: TrendingUp, title: "Trade Log", desc: "Log every trade with symbol, direction, setup, session, grade, and R-multiple. Auto-calculated from entry, exit, and stop." },
            { icon: Shield, title: "Discipline System", desc: "Pre-trade checklists and post-trade reflections enforce your rules after every single trade. Flags emotional and revenge trades." },
            { icon: Zap, title: "Deep Insights", desc: "Best setups, top symbols, day-of-week breakdown, best month — find exactly where your edge lives and where it doesn't." },
            { icon: TrendingUp, title: "Prop Eval Tracker", desc: "Track every evaluation fee, reset, and payout per firm. See your true net profitability across all prop firms." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              ["R-Multiple", "Auto-calculated"],
              ["3 Themes", "Light · Dark · Midnight"],
              ["CSV Import", "Tradovate · ProjectX · Generic"],
              ["Invite Only", "Serious traders only"],
            ].map(([val, label]) => (
              <div key={val}>
                <div className="text-lg font-black text-primary">{val}</div>
                <div className="mt-1 text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="mx-auto max-w-4xl px-6 py-28" id="pricing">
        <div className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-primary">Pricing</div>
        <h2 className="mb-3 text-center text-3xl font-black tracking-tight md:text-4xl">Simple, honest pricing</h2>
        <p className="mb-14 text-center text-sm text-muted-foreground">Start free. Upgrade when you're ready. No lock-in.</p>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-xl border border-border bg-card p-8">
            <div className="mb-1 text-sm font-semibold text-muted-foreground">Free</div>
            <div className="mb-6 flex items-end gap-1">
              <span className="text-4xl font-black">$0</span>
              <span className="mb-1 text-sm text-muted-foreground">forever</span>
            </div>
            <ul className="mb-8 space-y-3">
              {["Manual trade logging","Up to 100 trades / month","Basic dashboard","Daily journal & calendar","CSV import","1 trading account","Eval expense tracker"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="flex w-full items-center justify-center rounded-md border border-border py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              Get started free
            </Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-xl border border-primary/50 bg-card p-8 shadow-xl shadow-primary/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">Most Popular</span>
            </div>
            <div className="mb-1 text-sm font-semibold text-primary">Premium</div>
            <div className="mb-6 flex items-end gap-1">
              <span className="text-4xl font-black">$29</span>
              <span className="mb-1 text-sm text-muted-foreground">/ month</span>
            </div>
            <ul className="mb-8 space-y-3">
              {["Everything in Free","Unlimited trades","Unlimited accounts","Advanced analytics & insights","Strategy library","Cooldown & discipline rules","Priority support","Early access to new features"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{f}
                </li>
              ))}
            </ul>
            <Link href="/signup?plan=premium" className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-bold text-black shadow-md shadow-primary/20 transition-all hover:brightness-105">
              Start Premium <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden border-t border-border py-28">
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--border)) 1px,transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[90px]" />
        <div className="relative mx-auto max-w-xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Ready to trade<br /><span className="text-primary">with discipline?</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Tradiator is invite-only. Request access with an invite code and start journaling today.
          </p>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-bold text-black shadow-lg shadow-primary/25 transition-all hover:brightness-105">
            Request access <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <TrendingUp className="h-3 w-3 text-black" />
            </div>
            <span className="text-xs font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/docs" className="transition-colors hover:text-foreground">Docs</Link>
            <Link href="/login" className="transition-colors hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">Sign up</Link>
            <a href="https://discord.gg/uuyAxCavGd" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">Discord</a>
          </div>
        </div>
      </footer>

    </div>
  );
}