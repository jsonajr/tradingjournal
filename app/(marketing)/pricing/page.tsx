import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, TrendingUp } from "lucide-react";

const TIERS = [
  {
    name: "Free",
    plan: "free",
    price: "$0",
    period: "forever",
    features: ["Manual trade logging", "Up to 100 trades/month", "Basic dashboard", "Daily journal", "CSV import", "1 trading account", "Eval expense tracker"],
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Premium",
    plan: "premium",
    price: "$29",
    period: "/month",
    popular: true,
    features: ["Everything in Free", "Unlimited trades", "Unlimited accounts", "Advanced analytics", "Cooldown rules", "Admin dashboard access", "Priority support", "Early access to new features"],
    cta: "Start Premium",
    href: "/signup?plan=premium",
  },
];

export default async function PricingPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-bold">JsonTrades</span>
          </Link>
          <nav className="flex items-center gap-2">
            {profile ? (
              <Button size="sm" asChild>
                <Link href={profile.role === "admin" ? "/admin" : "/dashboard"}>Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link href="/login">Login</Link></Button>
                <Button size="sm" asChild><Link href="/signup">Get Started</Link></Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="text-4xl font-bold md:text-5xl">Simple, fair pricing</h1>
            <p className="mt-3 text-muted-foreground">Start free, upgrade when you&apos;re ready. Cancel anytime.</p>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
            {TIERS.map((t) => (
              <Card key={t.name} className={t.popular ? "border-primary shadow-lg shadow-primary/20" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{t.name}</h2>
                    {t.popular && <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-bold uppercase tracking-wide text-primary">Popular</span>}
                  </div>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{t.price}</span>
                    <span className="text-sm text-muted-foreground">{t.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={t.popular ? "default" : "outline"}
                    asChild={!profile || t.plan === "free"}
                    onClick={profile && t.plan !== "free" ? () => alert("Stripe Checkout coming soon.") : undefined}
                  >
                    {!profile || t.plan === "free"
                      ? <Link href={profile ? "/dashboard" : t.href}>{profile ? "Go to dashboard" : t.cta}</Link>
                      : <span>{t.cta}</span>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}