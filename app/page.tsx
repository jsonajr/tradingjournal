import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BookOpen, BarChart3, Clock, Lock, Shield, Sparkles, TrendingUp, ArrowRight } from "lucide-react";

export default async function LandingPage() {
  const profile = await getCurrentProfile();
  if (profile && !profile.banned) {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-bold">Apex</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/pricing" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block px-3 py-2">
              Pricing
            </Link>
            <Button variant="ghost" size="sm" asChild><Link href="/login">Login</Link></Button>
            <Button size="sm" asChild><Link href="/signup">Get Started</Link></Button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Built for prop firm traders
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Trade with <span className="text-primary">discipline</span>,<br />
              not adrenaline.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              The trading journal with built-in cooldowns, real analytics, and admin-controlled rules to keep you accountable and consistent.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free forever for individuals. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-b py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Everything you need to trade consistently</h2>
            <p className="mt-3 text-muted-foreground">From journaling to analytics to risk control — all in one place.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Feature icon={<BookOpen className="h-5 w-5" />} title="Daily Journal" description="Calendar-based playbook journal. Log your bias, mood, plan, and post-session reflections to spot patterns over time." />
            <Feature icon={<TrendingUp className="h-5 w-5" />} title="Trade Tracking" description="Log trades manually or import from Tradovate, ProjectX, and other platforms. Auto-calculates R-multiple, win rate, and profit factor." />
            <Feature icon={<Clock className="h-5 w-5" />} title="Cooldown System" description="Force yourself to take breaks after losses or daily limits. Admin-set global rules for prop firm teams." />
            <Feature icon={<BarChart3 className="h-5 w-5" />} title="Real Analytics" description="Equity curve, win/loss distribution, performance by setup and session. See what's actually working." />
            <Feature icon={<Shield className="h-5 w-5" />} title="Admin Controls" description="Coaches and prop firm operators can monitor traders, set discipline rules, and view aggregate stats." />
            <Feature icon={<Lock className="h-5 w-5" />} title="Your Data, Secure" description="Row-level security on every table. Only you can see your trades. Admins see only what they need to." />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Three steps to consistency</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Step n={1} title="Sign up" description="Create your account and connect your trading accounts. Set up cooldown rules that match your strategy." />
            <Step n={2} title="Trade and journal" description="Log every trade. Reflect daily on your plan, execution, and mood. The system enforces your rules automatically." />
            <Step n={3} title="Review and improve" description="Use analytics to identify what works. Eliminate setups that lose money. Double down on what wins." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Ready to trade like a pro?</h2>
            <p className="mt-3 text-muted-foreground">Start your free account today. Upgrade when you're ready for advanced features.</p>
            <div className="mt-8">
              <Button size="lg" asChild><Link href="/signup">Get Started Free</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 text-sm text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} Apex Trading Platform</div>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 transition-colors hover:border-primary/50">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">{icon}</div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({ n, title, description }: { n: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">{n}</div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
