# jsontrades — Trading Discipline Platform

Production-ready Next.js 15 + Supabase platform combining a trader-facing journal
and an admin dashboard. Single project, shared auth, shared database.

## Routes

| Route | Who | Description |
|---|---|---|
| `/`         | public         | Marketing landing page |
| `/login`    | public         | Sign in |
| `/signup`   | public         | Create account |
| `/pricing`  | public         | Subscription tiers (Free / Pro / Premium) |
| `/dashboard`| authed         | User dashboard with stats and recent activity |
| `/journal`  | authed         | Trade history, log new trades, CSV import |
| `/journal/calendar` | authed | Daily playbook calendar |
| `/settings` | authed         | Profile, accounts, preferences, subscription |
| `/admin`    | admin/mod      | Platform-wide stats |
| `/admin/users` | admin/mod   | User management |
| `/admin/users/[id]` | admin   | User detail with actions (ban, role, plan, cooldown) |
| `/admin/trades` | admin/mod  | All trades across all users |
| `/admin/cooldowns` | admin   | Active cooldowns and global rules |

After signing in, **admins go to `/admin`**, everyone else goes to `/dashboard`.

## Setup (15 minutes)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. **Project Settings → API** — copy these three values:
   - Project URL
   - `anon` public key
   - `service_role` key (keep secret)

### 2. Run the database schema

Open **SQL Editor** in Supabase → paste the entire contents of `supabase/schema.sql` → Run.

This creates: profiles, accounts, trades, journal_entries, cooldowns, cooldown_rules,
user_settings, subscriptions, and admin_logs tables, plus all RLS policies and triggers.

### 3. Disable public sign-ups (optional)

For an invite-only platform: **Authentication → Providers → Email → toggle off "Enable Sign Ups"**.
You can still create users manually via Authentication → Users → Add user.

### 4. Install and run

```bash
cp .env.example .env.local
# Fill in your Supabase URL + anon key + service-role key
npm install
npm run dev
```

Open `http://localhost:3000`.

### 5. Create your first admin

1. Go to `/signup` and create your account
2. Open Supabase SQL Editor and run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Sign in at `/login` — you'll be redirected to `/admin`

## Deploy to Vercel

```bash
git init && git add . && git commit -m "Initial commit"
gh repo create jsontrades-platform --public --push   # or push to GitHub manually
```

Then on [vercel.com/new](https://vercel.com/new):
1. Import your GitHub repo
2. Expand **Environment Variables** and add all three from `.env.local`
3. Click Deploy

That's it. Your platform is live at `your-project.vercel.app`.

## Stripe Integration (when ready)

Pricing page currently shows placeholder "Stripe Checkout coming soon" alerts.
To wire it up:

1. Create products in Stripe Dashboard for Pro and Premium
2. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_PRO_PRICE_ID=price_...
   STRIPE_PREMIUM_PRICE_ID=price_...
   ```
3. Create a checkout session route at `app/api/stripe/checkout/route.ts`
4. Create a webhook handler at `app/api/stripe/webhook/route.ts` that updates
   the `subscriptions` table on `customer.subscription.created`,
   `customer.subscription.updated`, and `customer.subscription.deleted` events
5. Point Stripe webhook to `https://your-domain.com/api/stripe/webhook`

## Tech Stack

- **Next.js 15** App Router + TypeScript
- **Supabase** Auth + Postgres + Row Level Security
- **shadcn/ui** + Tailwind CSS (dark mode)
- **Chart.js** via react-chartjs-2 for equity curves
- **Sonner** for toasts
- **Vercel** for deployment

## Project Structure

```
platform/
├── app/
│   ├── (auth)/         login, signup
│   ├── (marketing)/    pricing
│   ├── (app)/          dashboard, journal, calendar, settings, admin/*
│   ├── api/            trades, journal-entries, import-csv, admin/*
│   ├── globals.css     Tailwind + theme tokens
│   ├── layout.tsx      Root layout (dark mode, toaster)
│   └── page.tsx        Landing page
├── components/
│   ├── ui/             shadcn primitives
│   ├── layout/         sidebar, mobile-tab-bar, mobile-header
│   └── journal/        equity-chart
├── lib/
│   ├── supabase/       client / server / admin
│   ├── auth.ts         requireRole, apiRequireRole, logAdminAction
│   ├── csv.ts          Tradovate / ProjectX / generic CSV parser
│   └── utils.ts        cn, fmtMoney, calcRMultiple
├── supabase/
│   └── schema.sql      Full DB schema with RLS
└── middleware.ts       Refreshes Supabase session on every request
```

## Mobile Interface

The app auto-detects mobile viewports (< 768px):
- Desktop sidebar hides → bottom tab bar appears
- Mobile-only top header with sign-out button
- Tables scroll horizontally
- Modals go full-screen
- iOS safe-area insets respected

No separate mobile app needed — the responsive design handles everything.

## Security

- Every page in `(app)` group calls `requireRole()` server-side. Banned users are signed out.
- Every API route validates role via `apiRequireRole()`.
- Row Level Security on every table — even if a route bug bypasses checks, the database refuses leaks.
- The `service_role` key is only imported in `lib/supabase/admin.ts` and only used server-side.
- All admin actions are logged in `admin_logs` (admin ID, target, timestamp, JSON details).
- Banning a user immediately revokes all their sessions globally.

## CSV Import

Supports three formats:
- **Tradovate**: real export with `ContractName, EnteredAt, ExitedAt, EntryPrice, ExitPrice, Fees, PnL, Size, Type, TradeDay`
- **ProjectX**: `Date, Instrument, Side, Quantity, AvgPrice, Pnl, Fee`
- **Generic**: `date, symbol, direction, contracts, entry, exit, pnl, commission, setup, grade`

The parser handles quoted fields with commas, parentheses-as-negative numbers, and exact-then-partial header matching.

## What's Not Yet Wired Up

- **Stripe Checkout**: pricing page works but buttons show alerts; add keys to enable
- **Email confirmation**: Supabase sends emails by default; configure templates in Authentication → Email Templates
- **Password reset**: standard Supabase flow; add a `/reset-password` page when needed

These are typical follow-up tasks once the rest of the platform is verified.
