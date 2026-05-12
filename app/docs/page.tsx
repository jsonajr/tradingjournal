import Link from "next/link";

export const metadata = {
  title: { absolute: "Docs — Tradiator" },
  description: "Complete reference documentation for every feature in Tradiator.",
};

export default function DocsPage() {
  return (
    <div className="dark min-h-screen" style={{ background: "hsl(224,27%,8%)", color: "hsl(210,40%,98%)" }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[hsl(224,27%,8%)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="7" fill="#111827"/>
              <rect x="4" y="7" width="24" height="4.5" rx="1.5" fill="#FFDE28"/>
              <polygon points="16,5 23,14 19.5,14 19.5,27 12.5,27 12.5,14 9,14" fill="#FFDE28"/>
            </svg>
            <span className="text-sm font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/tutorial" className="text-sm text-white/50 hover:text-white transition-colors">Tutorial</Link>
            <Link href="/dashboard" className="rounded-md px-4 py-1.5 text-sm font-semibold text-black" style={{ background: "#FFDE28" }}>Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12 flex gap-8">

        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-6 text-sm">
            {[
              { label: "Getting Started", links: [["Overview","#overview"],["Accounts","#accounts"],["Auto Commission","#auto-commission"]] },
              { label: "Trading", links: [["Logging Trades","#logging"],["CSV Import","#import"],["Trade Detail","#trade-detail"],["Mass Edit","#mass-edit"]] },
              { label: "Journal", links: [["Playbook Calendar","#calendar"],["Day Screen","#day-screen"],["Journal Entries","#journal-entries"]] },
              { label: "Strategy", links: [["Setups","#setups"],["Mistakes","#mistakes"],["Winners","#winners"]] },
              { label: "Analytics", links: [["Dashboard","#dashboard"],["Insights","#insights"]] },
              { label: "Prop Tracking", links: [["Expenses & Payouts","#expenses"],["Blown Accounts","#blown"]] },
            ].map(sec => (
              <div key={sec.label}>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,222,40,0.7)" }}>{sec.label}</div>
                {sec.links.map(([label, href]) => (
                  <a key={href} href={href} className="block py-1 text-white/50 hover:text-white transition-colors">{label as string}</a>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 max-w-3xl space-y-16">

          {/* Overview */}
          <section id="overview">
            <h1 className="text-3xl font-black text-white mb-2">Documentation</h1>
            <p className="text-white/50 mb-8">Complete reference for every feature in Tradiator.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { href:"/tutorial", label:"New here?", sub:"Start with the step-by-step tutorial", emoji:"📖" },
                { href:"#dashboard", label:"Dashboard", sub:"Account overview, P&L, equity curve", emoji:"📊" },
                { href:"#logging", label:"Logging Trades", sub:"Manual entry and CSV import", emoji:"📋" },
                { href:"#mistakes", label:"Mistakes", sub:"Track what's costing you money", emoji:"❌" },
              ].map(c => (
                <a key={c.href} href={c.href} className="flex items-start gap-3 rounded-xl p-4 transition-colors hover:border-white/20"
                  style={{ background: "hsl(223,26%,11%)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-xl">{c.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{c.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{c.sub}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <Divider />

          {/* Accounts */}
          <section id="accounts">
            <SectionHeader emoji="🏦" title="Accounts" />
            <Body>
              Accounts are the foundation of Tradiator. Every trade belongs to an account, and your stats are filtered by account type across the entire app.
            </Body>
            <SubSection title="Account types">
              <Row label="Eval" desc="Prop firm evaluation — tracked separately with active/blown status and survival rate." />
              <Row label="Funded" desc="Passed evaluation, now trading a funded account." />
              <Row label="Live" desc="Your own personal capital." />
              <Row label="PA" desc="Personal account / paper trading." />
            </SubSection>
            <SubSection title="Creating an account">
              <Steps items={[
                "Settings → Accounts tab → + Add Account",
                "Enter name, firm, type (Eval/Funded/Live), platform, size, and start date",
                "Each prop firm eval should be its own account — e.g. 'Apex 50K #1', 'Apex 50K #2'",
              ]} />
            </SubSection>
            <SubSection title="Marking an account blown">
              <Body>When an Eval or Funded account is failed, mark it blown to track your survival rate.</Body>
              <Steps items={[
                "Settings → Accounts → click the Blown toggle on any Eval/Funded account",
                "Or toggle 'This trade blew the account' when logging the losing trade",
                "Blown accounts show a 💥 icon instead of E/F in the account list",
                "Reversible — uncheck the toggle to restore the account to Active",
              ]} />
            </SubSection>
          </section>

          <Divider />

          {/* Auto Commission */}
          <section id="auto-commission">
            <SectionHeader emoji="💰" title="Auto Commission" />
            <Body>
              Auto Commission pre-fills the commission field on every new trade so you never forget to log it.
            </Body>
            <Steps items={[
              "Settings → Preferences → Auto Commission",
              "Enter your per-trade commission (e.g. $3.50 for 1 NQ contract on Tradovate)",
              "Save — every new trade now defaults to this amount",
              "The commission field is still editable per-trade if you need a different value",
              "When importing CSV, the auto commission is used as fallback if the CSV has no commission column",
            ]} />
            <Note>Tradovate charges $1.75 per fill per contract. 1 contract = $3.50/trade (entry + exit). 2 contracts = $7.00/trade.</Note>
          </section>

          <Divider />

          {/* Logging Trades */}
          <section id="logging">
            <SectionHeader emoji="📋" title="Logging Trades" />
            <Body>There are three ways to log trades: the dashboard quick buttons, the full trade form, or CSV import.</Body>
            <SubSection title="Full trade form (Trades → New Trade)">
              <Row label="Symbol" desc="ES, NQ, MES, MNQ, CL, GC, RTY, YM, or any custom symbol." />
              <Row label="Direction" desc="Long or Short." />
              <Row label="Contracts" desc="Number of contracts traded." />
              <Row label="P&L" desc="Gross P&L before commission. Required." />
              <Row label="Entry / Exit / Stop" desc="Optional. Stop price is used to calculate R-multiple automatically." />
              <Row label="Commission" desc="Auto-filled from your Auto Commission setting." />
              <Row label="Setup" desc="Which setup you traded. Used in Insights breakdown." />
              <Row label="Session" desc="London, NY Open, NY AM, NY PM, Asia." />
              <Row label="Grade" desc="A+/A/B/C/D — your execution quality." />
              <Row label="Mistake" desc="Optional — select a mistake from your Mistakes playbook to tag this trade." />
              <Row label="Blown account" desc="Appears for Eval/Funded only. Marks the account as Failed." />
            </SubSection>
            <SubSection title="R-Multiple">
              <Body>R-multiple is calculated automatically if you provide Entry, Exit, and Stop prices. Formula: (Exit − Entry) ÷ (Entry − Stop) for longs. Negative for losses.</Body>
            </SubSection>
          </section>

          <Divider />

          {/* CSV Import */}
          <section id="import">
            <SectionHeader emoji="📥" title="CSV Import" />
            <Body>Import trade history directly from Tradovate, ProjectX, or a generic CSV.</Body>
            <SubSection title="Tradovate">
              <Steps items={[
                "In Tradovate: Account → Reports → Performance → Export CSV",
                "Use the Performance report — not Fills or Orders",
                "In Tradiator: Import CSV → select Tradovate → choose your account → upload",
                "Entry/exit prices, P&L, commission, and direction import automatically",
              ]} />
            </SubSection>
            <SubSection title="Generic CSV columns">
              <Row label="trade_date" desc="YYYY-MM-DD format" />
              <Row label="symbol" desc="ES, NQ, MES, MNQ, etc." />
              <Row label="direction" desc="Long or Short" />
              <Row label="contracts" desc="Number of contracts" />
              <Row label="pnl" desc="Gross P&L" />
              <Row label="commission" desc="Optional — auto commission used if missing" />
              <Row label="entry_price / exit_price" desc="Optional" />
            </SubSection>
            <Note>After importing, use Mass Edit to bulk-update setup, session, or grade across multiple trades at once.</Note>
          </section>

          <Divider />

          {/* Trade Detail */}
          <section id="trade-detail">
            <SectionHeader emoji="🔍" title="Trade Detail" />
            <Body>Click any trade row to open the full trade detail page.</Body>
            <SubSection title="What you can do">
              <Row label="Screenshots" desc="Upload a trade screenshot via drag & drop or file picker. Click to open fullscreen lightbox." />
              <Row label="Notes" desc="Write detailed notes. Saved separately from the trade form." />
              <Row label="Edit" desc="Full edit modal — all fields including mistake and blown toggle." />
              <Row label="Navigation" desc="Prev/Next buttons to move between trades without going back to the list." />
              <Row label="Day journal link" desc="Jump directly to the calendar day screen for that trade's date." />
            </SubSection>
          </section>

          <Divider />

          {/* Mass Edit */}
          <section id="mass-edit">
            <SectionHeader emoji="✏️" title="Mass Edit" />
            <Body>Mass edit lets you update multiple trades at once — perfect for copy-traded accounts where every account gets the same trade.</Body>
            <Steps items={[
              "On the Trades page, select multiple trades using checkboxes",
              "Ctrl+click to add individual trades to the selection",
              "Shift+click to select a range of trades",
              "Click Mass Edit in the action bar that appears",
              "Only fill in the fields you want to change — blank fields are left untouched",
              "Click Update X Trades",
            ]} />
            <Note>Notes field appends to existing notes rather than replacing them.</Note>
          </section>

          <Divider />

          {/* Calendar */}
          <section id="calendar">
            <SectionHeader emoji="📅" title="Playbook Calendar" />
            <Body>The calendar shows every trading day color-coded by net P&L. Green = profitable, red = loss.</Body>
            <Steps items={[
              "Use the Eval / Funded / Live pill tabs to filter by account type",
              "The calendar reflects only the selected account type's trades",
              "Click any day — with or without trades — to open the day screen",
              "The Today button jumps back to the current month",
            ]} />
          </section>

          <Divider />

          {/* Day Screen */}
          <section id="day-screen">
            <SectionHeader emoji="📆" title="Day Screen" />
            <Body>Every calendar day has its own screen showing trades and journal entry for that date.</Body>
            <SubSection title="Stat cards">
              <Row label="Net P&L" desc="Total net P&L for the day after commissions." />
              <Row label="Win Rate" desc="Wins ÷ total trades for the day." />
              <Row label="Best Trade" desc="Highest gross P&L trade." />
              <Row label="Commissions" desc="Total commissions paid on the day." />
            </SubSection>
            <SubSection title="Trade cards">
              <Body>Each trade shows direction, symbol, contracts, entry/exit, R-multiple, setup, session, grade, net P&L, and commission. Edit or delete trades directly from the day screen.</Body>
            </SubSection>
            <Note>Trades on the day screen are sorted by symbol then P&L — so copy-traded accounts group together.</Note>
          </section>

          <Divider />

          {/* Journal Entries */}
          <section id="journal-entries">
            <SectionHeader emoji="📝" title="Journal Entries" />
            <Body>Journal entries are written per day and separate from trades. Create one from any day screen.</Body>
            <SubSection title="Fields">
              <Row label="Title" desc="Optional headline for the day." />
              <Row label="Bias" desc="Bullish / Bearish / Neutral for the session." />
              <Row label="Mood" desc="Great / Good / Neutral / Bad / Terrible." />
              <Row label="Rating" desc="1–5 stars for your overall session quality." />
              <Row label="Setups traded" desc="Which setups you executed today." />
              <Row label="Sessions traded" desc="London, NY Open, NY AM, etc." />
              <Row label="Pre-market plan" desc="Key levels, bias reasoning, setups to watch." />
              <Row label="Post-session notes" desc="What happened, mistakes, what you did well." />
              <Row label="Rules followed" desc="Yes or No toggle." />
              <Row label="Improvement focus" desc="One thing to work on tomorrow." />
            </SubSection>
          </section>

          <Divider />

          {/* Setups */}
          <section id="setups">
            <SectionHeader emoji="📋" title="Setups" />
            <Body>Document every setup you trade with entry conditions, rules, and screenshots.</Body>
            <Steps items={[
              "Strategies → Setups tab → Add Setup",
              "Give it a clear title (e.g. 'ICT Fair Value Gap NY Open')",
              "Write entry conditions, rules, and what to look for",
              "Add tags for quick filtering",
              "After saving, click the screenshot zone to upload a chart example",
            ]} />
          </section>

          <Divider />

          {/* Mistakes */}
          <section id="mistakes">
            <SectionHeader emoji="❌" title="Mistakes" />
            <Body>The Mistakes section is one of the most powerful features in Tradiator. Document every mistake you repeat, then tag individual trades with a specific mistake to track the true cost over time.</Body>
            <Steps items={[
              "Strategies → Mistakes tab → Add Mistake",
              "Write a specific, actionable title (e.g. 'Chasing entries after missed setup')",
              "Describe what triggers it and how to prevent it",
              "When logging a trade where you made this mistake, select it from the Mistake dropdown",
              "Insights will eventually show you the P&L impact of each mistake",
            ]} />
            <Note>Be specific. "Bad trade" is useless. "Entered 3 minutes after killzone closed because I was still watching" is something you can fix.</Note>
          </section>

          <Divider />

          {/* Winners */}
          <section id="winners">
            <SectionHeader emoji="🏆" title="Winners" />
            <Body>Document repeating winning patterns so you can recognize and replicate them.</Body>
            <Steps items={[
              "Strategies → Winners tab → Add Winner",
              "Describe the conditions that made it work",
              "Upload a screenshot of a clean example",
              "Review this section before each session as a mental warm-up",
            ]} />
          </section>

          <Divider />

          {/* Dashboard */}
          <section id="dashboard">
            <SectionHeader emoji="📊" title="Dashboard" />
            <Body>The dashboard is your command center. It opens on the most profitable account type by default.</Body>
            <SubSection title="Account type tabs">
              <Body>Eval, Funded, and Live tabs filter every metric to that account type. Active/Blown counts and survival rate show for Eval and Funded tabs.</Body>
            </SubSection>
            <SubSection title="Date range">
              <Row label="Today / 1W / 1M / 3M / 6M / 1Y / All" desc="Quick presets." />
              <Row label="Custom" desc="Pick any start and end date." />
            </SubSection>
            <SubSection title="Metrics">
              <Row label="Net P&L" desc="Total profit after commissions for selected period and account type." />
              <Row label="Win Rate" desc="Winning trades ÷ total trades." />
              <Row label="Profit Factor" desc="Gross wins ÷ gross losses. Above 2.0 = strong edge." />
              <Row label="Avg W / L" desc="Average win and average loss per trade." />
              <Row label="Best Day %" desc="Best single day as % of total P&L." />
              <Row label="Best DOW" desc="Most profitable day of the week on average." />
            </SubSection>
          </section>

          <Divider />

          {/* Insights */}
          <section id="insights">
            <SectionHeader emoji="⚡" title="Insights" />
            <Body>Insights breaks down your performance by every variable. Use the Eval/Funded/Live tabs to see separate stats per account type.</Body>
            <SubSection title="Sections">
              <Row label="Core Statistics" desc="Net P&L, gross P&L, commissions, win rate, profit factor, total trades." />
              <Row label="Trade Metrics" desc="Avg win, avg loss, avg R-multiple, total contracts, best/worst trade." />
              <Row label="Long vs Short" desc="Separate P&L, win rate, and avg win for long and short trades." />
              <Row label="Streaks" desc="Best win streak, worst loss streak, current streak, profitable months." />
              <Row label="Day of Week" desc="P&L and win rate for each weekday — find which days to avoid." />
              <Row label="Monthly" desc="P&L breakdown by month." />
              <Row label="By Symbol" desc="P&L, win rate, avg win, avg loss per symbol." />
              <Row label="By Setup" desc="P&L and win rate per setup — shows which setups actually make money." />
              <Row label="By Session" desc="P&L and win rate per session (London, NY Open, NY AM, etc.)." />
              <Row label="Journal Stats" desc="Days journaled, rules followed %, avg session rating." />
            </SubSection>
            <SubSection title="Blown account overview (Eval/Funded)">
              <Body>Shows Active accounts, Blown accounts, Survival Rate, and total P&L on blow-up trades for the selected account type.</Body>
            </SubSection>
          </section>

          <Divider />

          {/* Expenses */}
          <section id="expenses">
            <SectionHeader emoji="💸" title="Prop Expenses & Payouts" />
            <Body>Track every dollar in and out of your prop trading operation.</Body>
            <SubSection title="Expense types">
              <Row label="Evaluation Fee" desc="Initial fee to start an evaluation." />
              <Row label="Reset Fee" desc="Fee to reset a failed evaluation." />
              <Row label="Monthly Fee" desc="Recurring platform or data fees." />
              <Row label="Platform Fee" desc="One-time platform costs." />
            </SubSection>
            <SubSection title="Summary stats">
              <Row label="Total Expenses" desc="All fees paid across all firms." />
              <Row label="Total Payouts" desc="All withdrawals received." />
              <Row label="Net Profit" desc="Payouts minus expenses — your real take-home." />
              <Row label="ROI on Evals" desc="Net profit ÷ total eval fees × 100." />
              <Row label="Avg Cost / Eval" desc="Total expenses ÷ number of evaluations started." />
            </SubSection>
            <Note>The All Activity table merges expenses and payouts sorted latest-first with +/- indicators for easy scanning.</Note>
          </section>

          <Divider />

          {/* Blown */}
          <section id="blown">
            <SectionHeader emoji="💥" title="Blown Accounts" />
            <Body>Blown account tracking helps you understand your true eval pass rate and survival rate across firms.</Body>
            <SubSection title="How to mark an account blown">
              <Steps items={[
                "Option 1: Settings → Accounts → toggle the Blown checkbox on any Eval/Funded account",
                "Option 2: When logging a trade, toggle 'This trade blew the account' — this marks both the trade and the account",
                "Option 3: In the Edit Trade modal, same toggle available",
              ]} />
            </SubSection>
            <SubSection title="Where blown data appears">
              <Row label="Dashboard" desc="Active/Blown pill counts and survival rate % on Eval/Funded tabs." />
              <Row label="Insights" desc="Eval/Funded tab shows an account overview card with Active, Blown, Survival Rate, and P&L on blow-up trades." />
              <Row label="Settings" desc="Blown accounts show 💥 icon instead of E/F." />
              <Row label="Trades table" desc="Blow-up trades show 💥 next to the grade badge." />
            </SubSection>
            <Note>Marking an account blown is fully reversible — uncheck the toggle to restore it to Active.</Note>
          </section>

        </main>
      </div>
    </div>
  );
}

function Divider() {
  return <hr style={{ borderColor: "rgba(255,255,255,0.08)", margin: "0" }} />;
}

function SectionHeader({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl">{emoji}</span>
      <h2 className="text-2xl font-black text-white">{title}</h2>
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-white/60 leading-relaxed mb-4">{children}</p>;
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-white/80 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b text-sm" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <span className="w-36 shrink-0 font-mono text-xs font-medium" style={{ color: "#FFDE28" }}>{label}</span>
      <span className="text-white/50">{desc}</span>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5"
            style={{ background: "rgba(255,222,40,0.15)", color: "#FFDE28" }}>
            {i + 1}
          </span>
          <span className="text-white/60 leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(255,222,40,0.07)", border: "1px solid rgba(255,222,40,0.15)", color: "rgba(255,222,40,0.9)" }}>
      <span className="font-semibold">Note: </span>{children}
    </div>
  );
}