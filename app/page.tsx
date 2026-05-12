import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export const metadata = {
  title: { absolute: "Tradiator — Trade with Discipline" },
  description: "The trading journal and discipline platform built for serious futures traders. Log every trade, enforce your rules, find your edge.",
};

const DISCORD = "https://discord.gg/uuyAxCavGd";

const TICKERS = [
  { sym: "NQ",  val: "+2.4%", pos: "top-[18%] left-[6%]",  rot: "-rotate-6" },
  { sym: "ES",  val: "+1.1%", pos: "top-[28%] right-[5%]", rot: "rotate-4"  },
  { sym: "CL",  val: "-0.8%", pos: "top-[60%] left-[3%]",  rot: "rotate-3"  },
  { sym: "GC",  val: "+0.5%", pos: "top-[55%] right-[4%]", rot: "-rotate-2" },
  { sym: "MNQ", val: "+2.4%", pos: "top-[78%] left-[8%]",  rot: "-rotate-3" },
  { sym: "RTY", val: "-1.2%", pos: "top-[72%] right-[7%]", rot: "rotate-5"  },
];

function TradiatorIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#111827"/>
      <rect x="4" y="7" width="24" height="4.5" rx="1.5" fill="#FFDE28"/>
      <polygon points="16,5 23,14 19.5,14 19.5,27 12.5,27 12.5,14 9,14" fill="#FFDE28"/>
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/70" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: "hsl(223,26%,14%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <div className="ml-3 rounded px-3 py-0.5 font-mono text-[10px] text-white/30" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          app.tradiator.net/dashboard
        </div>
      </div>
      <div className="flex" style={{ background: "hsl(224,27%,8%)", height: "320px" }}>
        <div className="hidden w-44 flex-col border-r p-2 md:flex" style={{ background: "hsl(223,26%,11%)", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="mb-3 border-b pb-3 px-2 text-[11px] font-black tracking-widest" style={{ color: "#FFE133", borderColor: "rgba(255,255,255,0.07)" }}>TRADIATOR</div>
          {[["Dashboard",true],["Trades",false],["Playbook Calendar",false],["Prop Expenses",false],["Strategies",false],["Insights",false]].map(([l,a]) => (
            <div key={l as string} className="mb-0.5 truncate rounded px-2.5 py-1.5 text-xs font-medium"
              style={a ? { background:"rgba(255,222,40,0.1)", color:"#FFDE28" } : { color:"rgba(255,255,255,0.4)" }}>
              {l as string}
            </div>
          ))}
          <div className="mt-auto border-t pt-2 px-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="text-xs font-medium text-white/80">Jason</div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: "#FFDE28" }}>premium</div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <div className="mb-3 flex gap-1.5">
            {["Eval","Funded","Live"].map((t,i) => (
              <div key={t} className="rounded-full px-3 py-0.5 text-[10px] font-semibold"
                style={i===1 ? { background:"rgba(59,130,246,0.15)", color:"#60a5fa", border:"1px solid rgba(59,130,246,0.3)" } : { border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)" }}>
                {t}{i===1 ? " 15" : ""}
              </div>
            ))}
            <div className="ml-1 flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px]" style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", color:"#4ade80" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />15 Active
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {["Today","1W","1M","3M","6M","1Y","All","Custom"].map((l) => (
              <div key={l} className="rounded px-2 py-0.5 text-[10px] font-medium"
                style={l==="All" ? { border:"1px solid rgba(255,222,40,0.4)", background:"rgba(255,222,40,0.1)", color:"#FFDE28" } : { border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)" }}>
                {l}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {[["Net P&L","+$86.6k","#22c55e","1,320 trades"],["Win Rate","59.3%","#60a5fa","765W / 525L"],["Profit Factor","3.06","#22c55e",""],
              ["Avg W / L","","","per trade"],["Best Day","May 6","#FFDE28","+$4.8k"],["Best DOW","Mon","#FFDE28","$229k avg"]].map(([label,val,color,sub],i) => (
              <div key={i} className="rounded p-2" style={{ background:"hsl(223,26%,11%)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-[9px] uppercase tracking-wide mb-1" style={{ color:"rgba(255,255,255,0.4)" }}>{label}</div>
                {label==="Avg W / L"
                  ? <div className="flex items-baseline gap-1"><span className="text-[13px] font-black text-green-400">+$442</span><span className="text-[8px]" style={{color:"rgba(255,255,255,0.3)"}}>/</span><span className="text-[13px] font-black text-red-400">-$366</span></div>
                  : <div className="text-sm font-black leading-tight" style={{ color: color as string }}>{val as string}</div>}
                {sub && <div className="text-[9px] mt-0.5 truncate" style={{ color:"rgba(255,255,255,0.35)" }}>{sub as string}</div>}
              </div>
            ))}
          </div>
          <div className="rounded p-2" style={{ background:"hsl(223,26%,11%)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[10px] font-semibold mb-1 text-white/60">Equity Curve</div>
            <svg width="100%" height="38" viewBox="0 0 380 38" preserveAspectRatio="none">
              <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity=".25"/><stop offset="100%" stopColor="#22c55e" stopOpacity="0"/></linearGradient></defs>
              <path d="M0,36 C30,33 60,28 90,23 S130,16 160,12 S190,14 215,9 S245,5 270,4 S305,2 335,1 L380,0" fill="none" stroke="#22c55e" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
              <path d="M0,36 C30,33 60,28 90,23 S130,16 160,12 S190,14 215,9 S245,5 270,4 S305,2 335,1 L380,0 L380,38 L0,38Z" fill="url(#eg)"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function TradesPreview() {
  const trades = [
    { date:"05/06", sym:"MNQ", dir:"Short", pnl:"+$723.88", setup:"ICT Breaker Block", grade:"B", win:true,  mistake:null },
    { date:"05/06", sym:"MES", dir:"Short", pnl:"-$472.00", setup:"ICT OTE",           grade:"C", win:false, mistake:"Chasing entry" },
    { date:"05/05", sym:"MNQ", dir:"Long",  pnl:"+$1,364",  setup:"ICT FVG",           grade:"A", win:true,  mistake:null },
    { date:"05/05", sym:"MES", dir:"Long",  pnl:"-$366.10", setup:"ICT Order Block",   grade:"B", win:false, mistake:null },
    { date:"05/02", sym:"MNQ", dir:"Long",  pnl:"+$891.50", setup:"ICT CISD",          grade:"A+",win:true,  mistake:null },
  ];
  return (
    <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/70" style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background:"hsl(223,26%,14%)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70"/><div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70"/><div className="h-2.5 w-2.5 rounded-full bg-green-500/70"/>
        <div className="ml-3 rounded px-3 py-0.5 font-mono text-[10px] text-white/30" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>app.tradiator.net/trades</div>
      </div>
      <div style={{ background:"hsl(224,27%,8%)", padding:"14px" }}>
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          {["All","Eval","Funded","Live"].map((t,i) => (
            <div key={t} className="rounded-full border px-3 py-1 text-[10px] font-semibold"
              style={i===0 ? { background:"rgba(255,222,40,0.1)", color:"#FFDE28", borderColor:"rgba(255,222,40,0.3)" } : { borderColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.4)" }}>
              {t}
            </div>
          ))}
          <div className="ml-auto rounded px-2 py-1 text-[10px] text-white/40" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)" }}>Account: All ▾</div>
        </div>
        <div className="grid gap-2 px-2 pb-1 text-[9px] uppercase tracking-wider text-white/30" style={{ gridTemplateColumns:"55px 40px 38px 70px 1fr 45px" }}>
          <span>Date</span><span>Sym</span><span>Dir</span><span>Net P&L</span><span>Setup</span><span>Grade</span>
        </div>
        {trades.map((t,i) => (
          <div key={i} className="grid gap-2 items-center rounded px-2 py-1.5 mb-0.5 text-[11px]"
            style={{ gridTemplateColumns:"55px 40px 38px 70px 1fr 45px", background: i%2===0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
            <span className="text-white/40">{t.date}</span>
            <span className="font-bold text-white">{t.sym}</span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-center"
              style={t.dir==="Long" ? { background:"rgba(34,197,94,0.15)", color:"#4ade80" } : { background:"rgba(248,113,113,0.15)", color:"#f87171" }}>
              {t.dir}
            </span>
            <span className="font-black" style={{ color: t.win ? "#4ade80" : "#f87171" }}>{t.pnl}</span>
            <span className="text-white/40 truncate text-[10px]">{t.setup}</span>
            <div className="flex flex-col gap-0.5">
              <span className="rounded border px-1 py-0.5 text-[9px] text-center" style={{ borderColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.5)" }}>{t.grade}</span>
              {t.mistake && <span className="rounded px-1 py-0.5 text-[8px] truncate" style={{ background:"rgba(248,113,113,0.12)", color:"#f87171", border:"1px solid rgba(248,113,113,0.2)" }}>❌ {t.mistake}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarPreview() {
  const days = ["Mon","Tue","Wed","Thu","Fri"];
  const weeks: ({p:string,w:boolean}|null)[][] = [
    [null, null, {p:"+$1.2k",w:true}, {p:"-$366",w:false}, {p:"+$892",w:true}],
    [{p:"+$723",w:true},{p:"+$445",w:true},{p:"-$472",w:false},{p:"+$1.1k",w:true},{p:"+$680",w:true}],
    [{p:"-$310",w:false},{p:"+$934",w:true},{p:"+$278",w:true},{p:"-$190",w:false},{p:"+$1.3k",w:true}],
  ];
  return (
    <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/70" style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background:"hsl(223,26%,14%)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70"/><div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70"/><div className="h-2.5 w-2.5 rounded-full bg-green-500/70"/>
        <div className="ml-3 rounded px-3 py-0.5 font-mono text-[10px] text-white/30" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>app.tradiator.net/journal/calendar</div>
      </div>
      <div style={{ background:"hsl(224,27%,8%)", padding:"14px" }}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-white">May 2026</span>
          <div className="flex gap-1">
            {["Eval","Funded","Live"].map((t,i) => (
              <div key={t} className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold"
                style={i===1 ? { background:"rgba(59,130,246,0.15)", color:"#60a5fa", borderColor:"rgba(59,130,246,0.3)" } : { borderColor:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.35)" }}>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 mb-1">
          {days.map(d => <div key={d} className="text-center text-[9px] font-medium text-white/30 pb-1">{d}</div>)}
        </div>
        {weeks.map((week,wi) => (
          <div key={wi} className="grid grid-cols-5 gap-1 mb-1">
            {week.map((day,di) => (
              <div key={di} className="rounded aspect-square flex flex-col items-center justify-center"
                style={{ background: day ? (day.w ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)") : "rgba(255,255,255,0.02)",
                  border: day ? `1px solid ${day.w ? "rgba(34,197,94,0.25)" : "rgba(248,113,113,0.25)"}` : "1px solid rgba(255,255,255,0.05)" }}>
                {day && <span className="font-bold" style={{ color: day.w ? "#4ade80" : "#f87171", fontSize:"9px" }}>{day.p}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaybookPreview() {
  return (
    <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/70" style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background:"hsl(223,26%,14%)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70"/><div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70"/><div className="h-2.5 w-2.5 rounded-full bg-green-500/70"/>
        <div className="ml-3 rounded px-3 py-0.5 font-mono text-[10px] text-white/30" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>app.tradiator.net/strategies</div>
      </div>
      <div style={{ background:"hsl(224,27%,8%)", padding:"14px" }}>
        <div className="mb-3 flex gap-1">
          {[["📚","Strategies"],["📋","Setups"],["❌","Mistakes"],["🏆","Winners"]].map(([e,l],i) => (
            <div key={l} className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium"
              style={i===2 ? { background:"rgba(248,113,113,0.12)", color:"#f87171" } : { color:"rgba(255,255,255,0.35)", background:"rgba(255,255,255,0.04)" }}>
              {e} {l}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { title:"Chasing entries after missed setup", desc:"FOMO into a move already in progress. Avg cost -$340/occurrence.", tags:["FOMO","discipline"] },
            { title:"Moving stop to BE too early", desc:"Gets stopped out then watches trade hit TP. Destroys R:R on good setups.", tags:["risk mgmt"] },
          ].map((c,i) => (
            <div key={i} className="rounded-lg p-3" style={{ background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)" }}>
              <div className="text-[11px] font-semibold text-red-400 mb-1 leading-tight">❌ {c.title}</div>
              <div className="text-[10px] text-white/40 mb-2 leading-relaxed">{c.desc}</div>
              <div className="flex gap-1 flex-wrap">
                {c.tags.map(t => <span key={t} className="rounded px-1.5 py-0.5 text-[8px]" style={{ background:"rgba(248,113,113,0.12)", color:"#f87171", border:"1px solid rgba(248,113,113,0.2)" }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightsPreview() {
  const setups = [
    { name:"ICT FVG",           pnl:"+$18.4k", wr:"68%", bar:88 },
    { name:"ICT Order Block",   pnl:"+$14.1k", wr:"62%", bar:68 },
    { name:"ICT Liquidity Sweep",pnl:"+$9.8k", wr:"57%", bar:47 },
    { name:"ICT CISD",          pnl:"+$7.2k",  wr:"71%", bar:35 },
    { name:"ICT OTE",           pnl:"-$2.1k",  wr:"41%", bar:10 },
  ];
  return (
    <div className="overflow-hidden rounded-xl shadow-2xl shadow-black/70" style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background:"hsl(223,26%,14%)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70"/><div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70"/><div className="h-2.5 w-2.5 rounded-full bg-green-500/70"/>
        <div className="ml-3 rounded px-3 py-0.5 font-mono text-[10px] text-white/30" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>app.tradiator.net/insights</div>
      </div>
      <div style={{ background:"hsl(224,27%,8%)", padding:"14px" }}>
        <div className="mb-3 text-xs font-semibold text-white/60 uppercase tracking-wider">By Setup</div>
        <div className="space-y-2">
          {setups.map((s,i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-[10px] text-white/60 truncate">{s.name}</div>
              <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background:"rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width:`${s.bar}%`, background: s.bar > 40 ? "#22c55e" : "#f87171" }} />
              </div>
              <div className="w-10 text-right text-[10px] font-semibold" style={{ color: s.bar>40 ? "#4ade80" : "#f87171" }}>{s.wr}</div>
              <div className="w-14 text-right text-[10px] font-bold" style={{ color: s.bar>40 ? "#4ade80" : "#f87171" }}>{s.pnl}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {[["Mon","+$229k","#4ade80"],["Tue","+$198k","#4ade80"],["Wed","+$87k","#4ade80"],["Thu","-$23k","#f87171"],["Fri","+$112k","#4ade80"]].map(([d,p,c]) => (
            <div key={d as string} className="rounded p-2 text-center" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[9px] text-white/40 mb-1">{d as string}</div>
              <div className="text-[10px] font-bold" style={{ color:c as string }}>{p as string}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function RootPage() {
  const profile = await getCurrentProfile();
  const isLoggedIn = !!(profile && !profile.banned);

  return (
    <div className="dark min-h-screen overflow-x-hidden" style={{ background: "hsl(224,27%,8%)", color: "hsl(210,40%,98%)" }}>

      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[hsl(224,27%,8%)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <TradiatorIcon size={28} />
            <span className="text-sm font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-md px-3 py-1.5 text-sm text-white/50 transition-colors hover:text-white">Features</a>
            <a href="#screens"  className="rounded-md px-3 py-1.5 text-sm text-white/50 transition-colors hover:text-white">Screenshots</a>
            <Link href="/tutorial" className="rounded-md px-3 py-1.5 text-sm text-white/50 transition-colors hover:text-white">Tutorial</Link>
          </nav>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <span className="hidden text-xs text-white/40 sm:block">
                  Signed in as <span className="text-white/70">{(profile as any).display_name ?? (profile as any).username ?? "you"}</span>
                </span>
                <Link href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold text-black shadow-md transition-all hover:brightness-105"
                  style={{ background: "#FFDE28", boxShadow: "0 4px 16px rgba(255,222,40,0.25)" }}>
                  <LayoutDashboard className="h-3.5 w-3.5" /> Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-md px-4 py-1.5 text-sm font-medium text-white/50 transition-colors hover:text-white">Sign in</Link>
                <a href={DISCORD} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-black shadow-md shadow-primary/20 transition-all hover:brightness-105">
                  Get access <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pb-20" style={{ paddingTop: "56px" }}>
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[140px]" style={{ background: "rgba(255,222,40,0.07)" }} />
        {TICKERS.map(({ sym, val, pos, rot }) => (
          <div key={sym} className={"pointer-events-none absolute hidden xl:flex " + pos + " " + rot + " items-center gap-1.5 rounded-lg px-3 py-2"}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-xs font-black text-white/70">{sym}</span>
            <span className={"text-[10px] font-semibold " + (val.startsWith("+") ? "text-green-400" : "text-red-400")}>{val}</span>
          </div>
        ))}
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 mt-16 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{ borderColor: "rgba(255,222,40,0.3)", background: "rgba(255,222,40,0.1)", color: "#FFDE28" }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#FFDE28" }} />
            Invite-only · Trading discipline platform
          </div>
          <h1 className="text-5xl font-black leading-[1.02] tracking-tight md:text-7xl lg:text-[84px]">
            Stop losing money<br /><span style={{ color: "#FFDE28" }}>to bad habits.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base text-white/50 md:text-lg">
            Tradiator is a trading journal and discipline system built for serious futures traders.
            Log every trade, enforce your rules, and find your real edge.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md px-7 py-3 text-sm font-bold text-black shadow-lg transition-all hover:brightness-105 hover:-translate-y-px"
                style={{ background: "#FFDE28", boxShadow: "0 8px 32px rgba(255,222,40,0.25)" }}>
                <LayoutDashboard className="h-4 w-4" /> Back to Dashboard
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-white/25">Join via Discord · Built for prop firm traders</p>
        </div>
        <div className="relative mx-auto mt-24 w-full max-w-5xl">
          <DashboardPreview />
          <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full blur-[50px]" style={{ background: "rgba(255,222,40,0.07)" }} />
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-28" id="features" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mb-4 text-center text-xs font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>Everything you need</div>
        <h2 className="mb-16 text-center text-3xl font-black tracking-tight text-white md:text-4xl">
          Built for traders who are serious<br className="hidden md:block" /> about improving
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-3 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-6"
            style={{ background: "hsl(223,26%,11%)", border: "1px solid rgba(255,222,40,0.2)" }}>
            <div className="flex-1">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>Designed for prop firm traders</div>
              <h3 className="mb-2 text-sm font-semibold text-white">Prop Eval & Funded Account Tracker</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Track eval fees, resets, payouts, and blown accounts across every firm. See survival rates, net profitability after expenses, and your real take-home.
              </p>
            </div>
            <div className="flex shrink-0 gap-6 text-center">
              {[["💸","Expenses","Fees, resets, monthly"],["💰","Payouts","Per firm withdrawals"],["💥","Blown","Track failed accounts"]].map(([icon,label,sub]) => (
                <div key={label as string}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs font-semibold text-white">{label as string}</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{sub as string}</div>
                </div>
              ))}
            </div>
          </div>
          {[
            { title:"Live Dashboard",     desc:"Net PnL, win rate, profit factor, best day, best DOW — filtered by account type and any date range.", emoji:"📊" },
            { title:"Playbook Calendar",  desc:"Monthly calendar with daily P&L. Write your bias, plan, mood, and session notes. Click any day for full trade breakdown.", emoji:"📅" },
            { title:"Trade Log",          desc:"Log every trade with symbol, direction, setup, session, grade, R-multiple. Ctrl+click or Shift+click to mass edit.", emoji:"📋" },
            { title:"Mistakes & Setups",  desc:"Document setups, track recurring mistakes, and log winning patterns. Tag trades with a specific mistake to see what it costs you.", emoji:"❌" },
            { title:"Deep Insights",      desc:"Best setups, top symbols, day-of-week breakdown, session performance — find your real edge with data.", emoji:"⚡" },
            { title:"CSV Import",         desc:"Import directly from Tradovate Performance reports. Auto-detects commission, entry/exit prices, and direction.", emoji:"📥" },
          ].map(({ title, desc, emoji }) => (
            <div key={title} className="group rounded-xl p-6 transition-all duration-200 hover:[border-color:rgba(255,222,40,0.25)]"
              style={{ background: "hsl(223,26%,11%)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="mb-4 text-2xl">{emoji}</div>
              <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section className="mx-auto max-w-6xl px-6 py-28" id="screens" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mb-4 text-center text-xs font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>See it in action</div>
        <h2 className="mb-16 text-center text-3xl font-black tracking-tight text-white md:text-4xl">
          Every tool you need,<br className="hidden md:block" /> <span style={{ color: "#FFDE28" }}>in one place</span>
        </h2>
        <div className="mb-20 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>Trade History</div>
            <h3 className="mb-3 text-xl font-black text-white">Every trade at a glance</h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Filter by account type, drill into individual accounts, and see every trade with its setup, grade, and any tagged mistakes. Select multiple with Ctrl/Shift+click for mass editing.
            </p>
          </div>
          <TradesPreview />
        </div>
        <div className="mb-20 grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1"><CalendarPreview /></div>
          <div className="order-1 lg:order-2">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>Playbook Calendar</div>
            <h3 className="mb-3 text-xl font-black text-white">Your month at a glance</h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Green and red days mapped on a calendar filtered by account type. Click any day for trades, journal notes, pre-market plan, and post-session review.
            </p>
          </div>
        </div>
        <div className="mb-20 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>Strategies & Playbook</div>
            <h3 className="mb-3 text-xl font-black text-white">Know your patterns</h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Document setups, track recurring mistakes, and catalog winning patterns — each with screenshots. Tag any trade with a mistake to see exactly what it costs you over time.
            </p>
          </div>
          <PlaybookPreview />
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1"><InsightsPreview /></div>
          <div className="order-1 lg:order-2">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: "#FFDE28" }}>Insights</div>
            <h3 className="mb-3 text-xl font-black text-white">Find your real edge</h3>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Win rate and P&L broken down by setup, session, symbol, day of week, and grade. Filter by Eval, Funded, or Live. Stop guessing which setups actually make money.
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "hsl(223,26%,11%)" }}>
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[["📐","R-Multiple","Auto-calculated"],["🎨","3 Themes","Light · Dark · Midnight"],["📥","CSV Import","Tradovate · ProjectX · Generic"],["🔒","Invite Only","Serious traders only"]].map(([icon,val,label]) => (
              <div key={val as string}>
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-base font-black" style={{ color: "#FFDE28" }}>{val as string}</div>
                <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-28" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]" style={{ background: "rgba(255,222,40,0.07)" }} />
        <div className="relative mx-auto max-w-xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Ready to trade<br /><span style={{ color: "#FFDE28" }}>with discipline?</span>
          </h2>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Tradiator is invite-only. Join the Discord to request access and start journaling today.
          </p>
          {isLoggedIn ? (
            <Link href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-md px-8 py-3 text-sm font-bold text-black shadow-lg transition-all hover:brightness-105"
              style={{ background: "#FFDE28", boxShadow: "0 8px 32px rgba(255,222,40,0.25)" }}>
              <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
            </Link>
          ) : (
            <a href={DISCORD} target="_blank" rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-md px-8 py-3 text-sm font-bold text-black shadow-lg transition-all hover:brightness-105"
              style={{ background: "#FFDE28", boxShadow: "0 8px 32px rgba(255,222,40,0.25)" }}>
              Join Discord <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "hsl(223,26%,11%)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <TradiatorIcon size={22} />
            <span className="text-xs font-black tracking-widest" style={{ color: "#FFE133" }}>TRADIATOR</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Link href="/tutorial" className="transition-colors hover:text-white">Tutorial</Link>
            <a href="#screens" className="transition-colors hover:text-white">Screenshots</a>
            {isLoggedIn
              ? <Link href="/dashboard" className="transition-colors hover:text-white">Dashboard</Link>
              : <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
            }
            <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Discord</a>
          </div>
        </div>
      </footer>

    </div>
  );
}