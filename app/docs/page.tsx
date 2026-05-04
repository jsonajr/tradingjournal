"use client";

import { useEffect } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.docs-root *{box-sizing:border-box;margin:0;padding:0}
.docs-root {
  --bg:#ffffff;--surface:#f6f8fa;--surface2:#eaeef2;--border:#d0d7de;
  --accent:#0969da;--green:#1a7f37;--red:#cf222e;--gold:#9a6700;
  --text:#1f2328;--muted:#656d76;--link:#0969da;
  --radius:6px;--mono:'JetBrains Mono',monospace;
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  background:var(--bg);color:var(--text);line-height:1.6;font-size:14px;
}
.docs-root .layout{display:flex;min-height:100vh}
.docs-root .sidebar{width:260px;min-width:260px;background:var(--bg);border-right:1px solid var(--border);position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;padding:16px 0}
.docs-root .sb-top{padding:8px 16px 16px;border-bottom:1px solid var(--border);margin-bottom:8px}
.docs-root .sb-top .repo{display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--text)}
.docs-root .sb-top .repo-icon{width:20px;height:20px;background:var(--text);border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.docs-root .sb-top .repo-icon svg{width:12px;height:12px;fill:#fff}
.docs-root .sb-top .repo-name{font-weight:600;font-size:14px}
.docs-root .sb-top .repo-name span{color:var(--muted);font-weight:400}
.docs-root .sb-version{display:inline-flex;align-items:center;margin-top:8px;font-size:11px;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2px 8px;color:var(--muted);font-family:var(--mono)}
.docs-root .sb-section-label{padding:6px 16px;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:8px}
.docs-root .sb-link{display:block;padding:5px 16px;font-size:13px;color:var(--muted);text-decoration:none;border-left:2px solid transparent;transition:.1s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.docs-root .sb-link:hover{color:var(--text);background:var(--surface)}
.docs-root .sb-link.on{color:var(--accent);border-left-color:var(--accent);background:var(--surface);font-weight:500}
.docs-root .main{flex:1;min-width:0;max-width:900px;padding:32px 48px 80px}
.docs-root .page-header{padding-bottom:24px;border-bottom:1px solid var(--border);margin-bottom:32px}
.docs-root .page-header h1{font-size:32px;font-weight:700;letter-spacing:-.02em;margin-bottom:8px;color:var(--text)}
.docs-root .page-header p{font-size:15px;color:var(--muted);max-width:640px}
.docs-root .breadcrumb{font-size:12px;color:var(--muted);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.docs-root .breadcrumb a{color:var(--link);text-decoration:none}
.docs-root .breadcrumb a:hover{text-decoration:underline}
.docs-root h2{font-size:22px;font-weight:700;color:var(--text);margin:48px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.docs-root h3{font-size:17px;font-weight:600;color:var(--text);margin:28px 0 8px}
.docs-root h4{font-size:13px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:20px 0 6px;font-family:var(--mono)}
.docs-root p{color:#444d56;margin-bottom:12px;font-size:14px;line-height:1.7}
.docs-root a{color:var(--link);text-decoration:none}
.docs-root a:hover{text-decoration:underline}
.docs-root ul,.docs-root ol{padding-left:22px;color:#444d56;font-size:14px;line-height:2.1}
.docs-root .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px}
.docs-root .card-title{font-weight:600;font-size:13px;margin-bottom:6px;color:var(--text)}
.docs-root .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}
.docs-root .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:12px 0}
.docs-root .fg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
.docs-root .fc{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px}
.docs-root .fc-icon{font-size:20px;margin-bottom:6px}
.docs-root .fc-title{font-weight:600;font-size:13px;color:var(--text);margin-bottom:4px}
.docs-root .fc-desc{font-size:12.5px;color:var(--muted);line-height:1.6}
.docs-root .screen{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin:20px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.docs-root .screen-bar{background:var(--surface);border-bottom:1px solid var(--border);padding:10px 14px;display:flex;align-items:center;gap:6px}
.docs-root .dot{width:11px;height:11px;border-radius:50%}
.docs-root .dr{background:#ff5f56}.docs-root .dy{background:#ffbd2e}.docs-root .dg{background:#27c93f}
.docs-root .url{flex:1;text-align:center;font-family:var(--mono);font-size:11px;color:var(--muted);background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:2px 8px}
.docs-root .screen-body{padding:20px;background:#fff}
.docs-root .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.docs-root .scard{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px}
.docs-root .slabel{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
.docs-root .sval{font-size:20px;font-weight:700;letter-spacing:-.02em}
.docs-root .ssub{font-size:11px;color:var(--muted);margin-top:1px}
.docs-root .green{color:var(--green)}.docs-root .red{color:var(--red)}.docs-root .blue{color:#0969da}.docs-root .purple{color:#8250df}.docs-root .gold{color:var(--gold)}
.docs-root .eq-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px;height:80px;display:flex;align-items:flex-end;gap:2px;position:relative}
.docs-root .eq-bar{background:linear-gradient(to top,rgba(9,105,218,.4),rgba(9,105,218,.7));border-radius:2px 2px 0 0;flex:1}
.docs-root .eq-wrap::after{content:'Equity Curve';position:absolute;top:8px;left:12px;font-size:10px;color:var(--muted);font-family:var(--mono)}
.docs-root .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.docs-root .cal-hd{font-size:9px;color:var(--muted);text-align:center;padding:3px;font-family:var(--mono);text-transform:uppercase}
.docs-root .cal-cell{aspect-ratio:1;border:1px solid var(--border);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8px;gap:1px;padding:3px;cursor:pointer;background:#fff}
.docs-root .cal-cell .dn{font-family:var(--mono);font-size:8px;color:var(--muted);align-self:flex-start;margin-left:2px}
.docs-root .cal-cell .pnl{font-weight:700;font-size:9px}
.docs-root .cal-cell .tc{font-size:7px;color:var(--muted)}
.docs-root .c-win{background:#dafbe1;border-color:#82cfac}
.docs-root .c-loss{background:#ffebe9;border-color:#ffb8b0}
.docs-root .c-today{border-color:#0969da;box-shadow:0 0 0 2px rgba(9,105,218,.2)}
.docs-root .tbl{width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.docs-root .tbl th{text-align:left;padding:8px 12px;background:var(--surface);color:var(--text);font-weight:600;font-size:12px;border-bottom:1px solid var(--border)}
.docs-root .tbl td{padding:8px 12px;border-bottom:1px solid var(--border);color:#444d56;vertical-align:top}
.docs-root .tbl tr:last-child td{border-bottom:none}
.docs-root .tbl tr:hover td{background:var(--surface)}
.docs-root .method{font-family:var(--mono);font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600}
.docs-root .GET{background:#dafbe1;color:var(--green)}
.docs-root .POST{background:#ddf4ff;color:#0969da}
.docs-root .PATCH{background:#fff8c5;color:var(--gold)}
.docs-root .DELETE{background:#ffebe9;color:var(--red)}
.docs-root .route{font-family:var(--mono);font-size:12px;color:#8250df}
.docs-root .col-n{font-family:var(--mono);color:#8250df;font-size:12px}
.docs-root .col-t{font-family:var(--mono);color:#0969da;font-size:11px}
.docs-root .alert{border-radius:var(--radius);padding:12px 16px;margin:14px 0;border:1px solid;font-size:13px;display:flex;gap:10px;align-items:flex-start}
.docs-root .alert svg{flex-shrink:0;margin-top:1px}
.docs-root .a-info{background:#ddf4ff;border-color:#54aeff;color:#0550ae}
.docs-root .a-warn{background:#fff8c5;border-color:#d4a72c;color:#7d4e00}
.docs-root .a-danger{background:#ffebe9;border-color:#ff8182;color:#a40e26}
.docs-root .a-success{background:#dafbe1;border-color:#82cfac;color:#116329}
.docs-root .alert strong{font-weight:600}
.docs-root pre{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;overflow-x:auto;line-height:1.8;margin:12px 0;font-family:var(--mono);font-size:12px;color:var(--text)}
.docs-root code{font-family:var(--mono);font-size:12px;background:var(--surface);color:#cf222e;padding:1px 5px;border-radius:4px;border:1px solid var(--border)}
.docs-root .steps{list-style:none;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.docs-root .step{display:flex;gap:14px;padding:12px 16px;border-bottom:1px solid var(--border);background:#fff}
.docs-root .step:last-child{border-bottom:none}
.docs-root .step:nth-child(even){background:var(--surface)}
.docs-root .step-n{width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px}
.docs-root .step-b strong{font-size:13px;font-weight:600;color:var(--text);display:block;margin-bottom:2px}
.docs-root .step-b p{margin:0;font-size:12.5px;color:var(--muted)}
.docs-root .flow{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:12px 0}
.docs-root .fbox{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:5px 12px;font-size:12.5px;font-weight:500}
.docs-root .fbox.hi{border-color:#0969da;color:#0969da;background:#ddf4ff}
.docs-root .farr{color:var(--muted);font-size:16px}
.docs-root .chk-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin:8px 0}
.docs-root .chk-item{display:flex;align-items:baseline;gap:8px;font-size:13px;padding:3px 0;color:#444d56}
.docs-root .chk-item::before{content:'☐';color:var(--muted);font-size:13px;flex-shrink:0}
.docs-root .badge{font-family:var(--mono);font-size:10px;padding:2px 7px;border-radius:20px;font-weight:500;border:1px solid}
.docs-root .b-green{background:#dafbe1;color:var(--green);border-color:#82cfac}
.docs-root .b-red{background:#ffebe9;color:var(--red);border-color:#ffb8b0}
.docs-root .b-blue{background:#ddf4ff;color:#0969da;border-color:#54aeff}
.docs-root .b-amber{background:#fff8c5;color:var(--gold);border-color:#d4a72c}
.docs-root .b-purple{background:#fbefff;color:#8250df;border-color:#d8b4fe}
.docs-root .b-gray{background:var(--surface2);color:var(--muted);border-color:var(--border)}
.docs-root .roles{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.docs-root .toc{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin:24px 0}
.docs-root .toc h3{font-size:13px;font-weight:600;margin-bottom:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.docs-root .toc ol{padding-left:18px}
.docs-root .toc li{margin-bottom:4px;font-size:13px}
.docs-root .toc a{color:var(--link)}
.docs-root .j-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);background:var(--surface);border-radius:20px;padding:3px 10px;font-size:11px;margin-right:5px;margin-bottom:5px;color:var(--text)}
.docs-root .j-section{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin:6px 0}
.docs-root .j-sec-label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;font-weight:600}
.docs-root .j-sec-text{font-size:12.5px;color:var(--muted);line-height:1.6}
.docs-root hr{border:none;border-top:1px solid var(--border);margin:40px 0}
@media(max-width:860px){
  .docs-root .sidebar{display:none}
  .docs-root .main{padding:24px 20px}
  .docs-root .g2,.docs-root .g3,.docs-root .fg,.docs-root .chk-grid{grid-template-columns:1fr}
  .docs-root .stat-row{grid-template-columns:1fr 1fr}
}
`;

const HTML = `
<div class="layout">

<nav class="sidebar">
  <div class="sb-top">
    <a href="#" class="repo">
      <div class="repo-icon">
        <svg viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z"/></svg>
      </div>
      <div><div class="repo-name">tradiator <span>/ docs</span></div></div>
    </a>
    <div class="sb-version">v1.0 · Public</div>
  </div>
  <div class="sb-section-label">Getting Started</div>
  <a href="#overview" class="sb-link on">Overview</a>
  <a href="#stack" class="sb-link">Tech Stack</a>
  <a href="#access" class="sb-link">Roles &amp; Access</a>
  <div class="sb-section-label">Features</div>
  <a href="#dashboard" class="sb-link">Dashboard</a>
  <a href="#trades" class="sb-link">Trade Logging</a>
  <a href="#calendar" class="sb-link">Playbook Calendar</a>
  <a href="#journalday" class="sb-link">Journal Day View</a>
  <a href="#insights" class="sb-link">Insights</a>
  <a href="#strategies" class="sb-link">Strategies</a>
  <a href="#eval" class="sb-link">Eval &amp; Payouts</a>
  <a href="#import" class="sb-link">CSV Import</a>
  <a href="#settings" class="sb-link">Settings</a>
  <div class="sb-section-label">Technical</div>
  <a href="#api" class="sb-link">API Reference</a>
  <a href="#database" class="sb-link">Database Schema</a>
  <a href="#auth" class="sb-link">Auth &amp; Security</a>
  <div class="sb-section-label">QA</div>
  <a href="#testing" class="sb-link">Test Scenarios</a>
</nav>

<main class="main">

<div class="page-header">
  <div class="breadcrumb">
    <a href="#">tradiator</a><span>/</span><a href="#">docs</a>
  </div>
  <h1>Tradiator Documentation</h1>
  <p>QA tester reference covering every feature, screen, API endpoint, database table, and test scenario. Covers the full platform as of v1.0.</p>
  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
    <span class="badge b-blue">Next.js 15</span>
    <span class="badge b-gray">Supabase</span>
    <span class="badge b-green">TypeScript</span>
    <span class="badge b-amber">Tailwind CSS</span>
    <span class="badge b-purple">Vercel</span>
  </div>
</div>

<div class="toc">
  <h3>On this page</h3>
  <ol>
    <li><a href="#overview">Overview</a></li>
    <li><a href="#stack">Tech Stack</a></li>
    <li><a href="#access">Roles &amp; Access</a></li>
    <li><a href="#dashboard">Dashboard</a></li>
    <li><a href="#trades">Trade Logging</a></li>
    <li><a href="#calendar">Playbook Calendar</a></li>
    <li><a href="#journalday">Journal Day View</a></li>
    <li><a href="#insights">Insights &amp; Analytics</a></li>
    <li><a href="#strategies">Strategy Library</a></li>
    <li><a href="#eval">Eval Expenses &amp; Payouts</a></li>
    <li><a href="#import">CSV Import</a></li>
    <li><a href="#settings">Account Settings</a></li>
    <li><a href="#api">API Reference</a></li>
    <li><a href="#database">Database Schema</a></li>
    <li><a href="#auth">Auth &amp; Security</a></li>
    <li><a href="#testing">Test Scenarios &amp; Checklist</a></li>
  </ol>
</div>

<section id="overview">
<h2>Overview</h2>
<p>Tradiator is a trading journal and analytics platform for funded futures traders. Log trades, write daily playbook entries, track evaluation costs and payouts, analyze performance, and document strategies — all in one dashboard.</p>
<div class="fg">
  <div class="fc"><div class="fc-icon">📊</div><div class="fc-title">Performance Dashboard</div><div class="fc-desc">Real-time equity curve, net P&amp;L, win rate, profit factor, and best day/DOW stats.</div></div>
  <div class="fc"><div class="fc-icon">📅</div><div class="fc-title">Playbook Calendar</div><div class="fc-desc">Monthly grid with daily P&amp;L per cell. Click a day with an entry to open the full journal view.</div></div>
  <div class="fc"><div class="fc-icon">📝</div><div class="fc-title">Daily Journal</div><div class="fc-desc">Pre-market plan, post-session notes, mood, bias, star rating, setups, sessions, rules followed.</div></div>
  <div class="fc"><div class="fc-icon">💰</div><div class="fc-title">Eval &amp; Payouts Tracker</div><div class="fc-desc">Track evaluation fees, resets, and payouts per firm. Calculates net profit and ROI.</div></div>
  <div class="fc"><div class="fc-icon">📈</div><div class="fc-title">Insights &amp; Analytics</div><div class="fc-desc">By symbol, session, setup, day of week, streaks, and journal adherence stats.</div></div>
  <div class="fc"><div class="fc-icon">🗂️</div><div class="fc-title">Strategy Library</div><div class="fc-desc">Document setups with entry conditions, confluences, sessions, timeframes — saved per user to Supabase.</div></div>
</div>
</section>

<section id="stack">
<h2>Tech Stack</h2>
<div class="g2">
  <div class="card">
    <div class="card-title">Frontend</div>
    <table class="tbl"><tbody>
      <tr><td class="col-n">Next.js 15</td><td>App Router, Server Components</td></tr>
      <tr><td class="col-n">TypeScript</td><td>Strict mode throughout</td></tr>
      <tr><td class="col-n">Tailwind CSS</td><td>Dark + light mode theming</td></tr>
      <tr><td class="col-n">shadcn/ui</td><td>Radix-based component library</td></tr>
      <tr><td class="col-n">Recharts</td><td>Equity curve chart</td></tr>
      <tr><td class="col-n">Sonner</td><td>Toast notifications</td></tr>
    </tbody></table>
  </div>
  <div class="card">
    <div class="card-title">Backend &amp; Infrastructure</div>
    <table class="tbl"><tbody>
      <tr><td class="col-n">Supabase</td><td>PostgreSQL + Auth + RLS</td></tr>
      <tr><td class="col-n">Vercel</td><td>Deployment (Serverless + Edge)</td></tr>
      <tr><td class="col-n">Next.js API Routes</td><td>REST endpoints at /api/*</td></tr>
      <tr><td class="col-n">Supabase Auth</td><td>Email/password, JWT sessions</td></tr>
      <tr><td class="col-n">Row Level Security</td><td>Per-user data isolation in DB</td></tr>
    </tbody></table>
  </div>
</div>
</section>

<section id="access">
<h2>Roles &amp; Access</h2>
<p>Three user roles. All role checks happen <strong>server-side</strong> via <code>requireRole()</code> on every page and API route — cannot be bypassed from the client.</p>
<div class="roles">
  <span class="badge b-red" style="padding:5px 12px;font-size:12px">👑 Admin</span>
  <span class="badge b-amber" style="padding:5px 12px;font-size:12px">🛡️ Moderator</span>
  <span class="badge b-purple" style="padding:5px 12px;font-size:12px">👤 User</span>
</div>
<table class="tbl">
  <thead><tr><th>Role</th><th>Can Do</th><th>Cannot Do</th></tr></thead>
  <tbody>
    <tr><td><span class="badge b-red">admin</span></td><td>Everything — full data access, admin panel, role &amp; plan changes, delete any account</td><td>Nothing</td></tr>
    <tr><td><span class="badge b-amber">moderator</span></td><td>Admin panel (read), view all users/trades/journals, manage cooldowns</td><td>Change roles, delete accounts</td></tr>
    <tr><td><span class="badge b-purple">user</span></td><td>Own dashboard, trades, journal, strategies, eval, settings</td><td>Admin panel, other users' data</td></tr>
  </tbody>
</table>
<div class="alert a-info">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm6.5-.25A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75zM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
  <div><strong>Promoting your first admin</strong> After signup, run in Supabase SQL Editor: <code>update public.profiles set role = 'admin' where email = 'you@example.com';</code></div>
</div>
<h3>Plans</h3>
<p>Users can be on <code>free</code>, <code>pro</code>, or <code>premium</code>. Free users see a banner. Plan is stored in <code>profiles.plan</code> and the <code>subscriptions</code> table.</p>
</section>

<section id="dashboard">
<h2>Dashboard</h2>
<p>Main landing page after login. Route: <code>/dashboard</code>. Shows aggregate performance stats, equity curve, recent trades, and recent journal entries.</p>
<div class="screen">
  <div class="screen-bar"><div class="dot dr"></div><div class="dot dy"></div><div class="dot dg"></div><div class="url">tradiator.net/dashboard</div></div>
  <div class="screen-body">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div><div style="font-size:18px;font-weight:700;color:#1f2328">Welcome back, Jason</div><div style="font-size:12px;color:#656d76">Your trading overview</div></div>
      <div style="display:flex;gap:8px">
        <button style="background:#1a7f37;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer">📈 Log Win</button>
        <button style="background:#cf222e;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer">📉 Log Loss</button>
      </div>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap">
      <span class="badge b-blue" style="cursor:pointer;padding:4px 10px">Today</span>
      <span class="badge b-gray" style="cursor:pointer;padding:4px 10px">1W</span>
      <span class="badge b-gray" style="cursor:pointer;padding:4px 10px">1M</span>
      <span class="badge b-gray" style="cursor:pointer;padding:4px 10px">3M</span>
      <span class="badge b-gray" style="cursor:pointer;padding:4px 10px">All ✓</span>
    </div>
    <div class="stat-row">
      <div class="scard"><div class="slabel">Net P&amp;L</div><div class="sval green">+$54.4k</div><div class="ssub">500 trades</div></div>
      <div class="scard"><div class="slabel">Win Rate</div><div class="sval blue">58.0%</div><div class="ssub">290W / 210L</div></div>
      <div class="scard"><div class="slabel">Profit Factor</div><div class="sval purple">2.14</div></div>
    </div>
    <div class="eq-wrap">
      <div class="eq-bar" style="height:18%"></div><div class="eq-bar" style="height:24%"></div><div class="eq-bar" style="height:32%"></div>
      <div class="eq-bar" style="height:28%"></div><div class="eq-bar" style="height:42%"></div><div class="eq-bar" style="height:48%"></div>
      <div class="eq-bar" style="height:44%"></div><div class="eq-bar" style="height:58%"></div><div class="eq-bar" style="height:56%"></div>
      <div class="eq-bar" style="height:66%"></div><div class="eq-bar" style="height:62%"></div><div class="eq-bar" style="height:76%"></div>
      <div class="eq-bar" style="height:80%"></div><div class="eq-bar" style="height:78%"></div><div class="eq-bar" style="height:92%"></div>
      <div class="eq-bar" style="height:88%"></div><div class="eq-bar" style="height:96%"></div><div class="eq-bar" style="height:100%"></div>
    </div>
  </div>
</div>
<h3>Stat Cards</h3>
<table class="tbl">
  <thead><tr><th>Stat</th><th>Calculation</th></tr></thead>
  <tbody>
    <tr><td>Net P&amp;L</td><td>Sum of (pnl − commission) for all trades in selected time range</td></tr>
    <tr><td>Win Rate</td><td>Count of trades where pnl &gt; 0 ÷ total trades × 100</td></tr>
    <tr><td>Profit Factor</td><td>Sum of winning P&amp;L ÷ absolute sum of losing P&amp;L</td></tr>
    <tr><td>Avg W / L</td><td>Average winning and average losing trade amounts</td></tr>
    <tr><td>Best Day %</td><td>Highest single-day net P&amp;L as % of total P&amp;L</td></tr>
    <tr><td>Best DOW</td><td>Day of week with highest average net P&amp;L across all trades</td></tr>
  </tbody>
</table>
<h3>Time Filters</h3>
<p>Tabs across the top: <strong>Today, 1W, 1M, 3M, 6M, 1Y, All, Custom</strong>. Custom allows a date range picker. All stat cards and the equity curve respond to the active filter.</p>
<h3>Log Win / Log Loss Buttons</h3>
<p>Top-right on desktop (large buttons), floating pill buttons bottom-right on mobile. Log Win pre-fills direction as Long; Log Loss pre-fills as Short.</p>
<h3>Recent Journal Feed</h3>
<p>Right panel shows the last 3 journal entries with mood badge, title, bias, and notes preview.</p>
</section>

<section id="trades">
<h2>Trade Logging</h2>
<p>Every trade is stored in the <code>trades</code> table. Trades can be entered manually, created from the Trades page, or imported via CSV.</p>
<h3>Trade Entry Form Fields</h3>
<table class="tbl">
  <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Date</td><td>date</td><td>✅</td><td>Defaults to today</td></tr>
    <tr><td>Symbol</td><td>text</td><td>✅</td><td>ES, NQ, MES, MNQ, CL, GC, RTY, YM, Other</td></tr>
    <tr><td>Direction</td><td>Long / Short</td><td>✅</td><td>Pre-filled by Log Win (Long) or Log Loss (Short)</td></tr>
    <tr><td>Contracts</td><td>integer</td><td>✅</td><td>Defaults to 1</td></tr>
    <tr><td>Entry Price</td><td>decimal</td><td>❌</td><td>Used for R-multiple calculation</td></tr>
    <tr><td>Exit Price</td><td>decimal</td><td>❌</td><td>Used for R-multiple calculation</td></tr>
    <tr><td>Stop Price</td><td>decimal</td><td>❌</td><td>Used for R-multiple calculation</td></tr>
    <tr><td>P&amp;L</td><td>decimal</td><td>✅</td><td>Gross profit/loss before commission</td></tr>
    <tr><td>Commission</td><td>decimal</td><td>❌</td><td>Default 0. Net P&amp;L = pnl − commission</td></tr>
    <tr><td>Setup</td><td>text</td><td>❌</td><td>Free text, links conceptually to Strategies</td></tr>
    <tr><td>Session</td><td>text</td><td>❌</td><td>London, NY Open, NY AM, NY PM, Asia</td></tr>
    <tr><td>Grade</td><td>A+/A/B/C/D</td><td>❌</td><td>Quality grade for trade execution</td></tr>
    <tr><td>Notes</td><td>text</td><td>❌</td><td>Free-text notes</td></tr>
    <tr><td>Account</td><td>uuid</td><td>❌</td><td>Links to a trading account</td></tr>
  </tbody>
</table>
<h3>R-Multiple Auto-Calculation</h3>
<pre>// Long
R = (exitPrice - entryPrice) / Math.abs(entryPrice - stopPrice)

// Short
R = (entryPrice - exitPrice) / Math.abs(entryPrice - stopPrice)</pre>
<h3>Trades Page — /trades</h3>
<p>Table of all trades. Supports multi-select bulk delete, inline edit via pencil icon, and click-to-detail.</p>
<h3>Post-Trade Reflection Popup</h3>
<p>If enabled in Preferences, a reflection dialog appears after logging any trade. Can be toggled off in Settings → Preferences.</p>
</section>

<section id="calendar">
<h2>Playbook Calendar</h2>
<p>Route: <code>/journal/calendar</code>. Monthly grid where each day cell shows that day's net P&amp;L and trade count. Green = profit, Red = loss.</p>
<div class="screen">
  <div class="screen-bar"><div class="dot dr"></div><div class="dot dy"></div><div class="dot dg"></div><div class="url">tradiator.net/journal/calendar</div></div>
  <div class="screen-body">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      <div class="scard"><div class="slabel">Month P&amp;L</div><div class="sval green" style="font-size:15px">+$8,420</div><div class="ssub">12W · 4L</div></div>
      <div class="scard"><div class="slabel">Win Rate</div><div class="sval blue" style="font-size:15px">75%</div><div class="ssub">16 trading days</div></div>
      <div class="scard"><div class="slabel">Best Day</div><div class="sval green" style="font-size:15px">+$2,100</div></div>
      <div class="scard"><div class="slabel">Worst Day</div><div class="sval red" style="font-size:15px">-$890</div></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-weight:700;font-size:13px;color:#1f2328">April 2026</div>
      <div style="display:flex;gap:4px">
        <button style="background:#f6f8fa;border:1px solid #d0d7de;color:#656d76;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:11px">‹</button>
        <button style="background:#f6f8fa;border:1px solid #d0d7de;color:#656d76;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:11px">Today</button>
        <button style="background:#f6f8fa;border:1px solid #d0d7de;color:#656d76;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:11px">›</button>
      </div>
    </div>
    <div class="cal" style="margin-bottom:5px">
      <div class="cal-hd">Sun</div><div class="cal-hd">Mon</div><div class="cal-hd">Tue</div>
      <div class="cal-hd">Wed</div><div class="cal-hd">Thu</div><div class="cal-hd">Fri</div><div class="cal-hd">Sat</div>
    </div>
    <div class="cal">
      <div class="cal-cell" style="opacity:.2"></div><div class="cal-cell" style="opacity:.2"></div><div class="cal-cell" style="opacity:.2"></div>
      <div class="cal-cell"><div class="dn">1</div></div><div class="cal-cell"><div class="dn">2</div></div>
      <div class="cal-cell"><div class="dn">3</div></div><div class="cal-cell"><div class="dn">4</div></div>
      <div class="cal-cell"><div class="dn">5</div></div>
      <div class="cal-cell c-win"><div class="dn">6</div><div class="pnl green">+$892</div><div class="tc">3 trades</div></div>
      <div class="cal-cell c-loss"><div class="dn">7</div><div class="pnl red">-$340</div><div class="tc">2 trades</div></div>
      <div class="cal-cell c-win"><div class="dn">8</div><div class="pnl green">+$1.2k</div><div class="tc">4 trades</div></div>
      <div class="cal-cell"><div class="dn">9</div></div><div class="cal-cell"><div class="dn">10</div></div>
      <div class="cal-cell c-win"><div class="dn">11</div><div class="pnl green">+$450</div><div class="tc">1 trade</div></div>
      <div class="cal-cell c-loss"><div class="dn">12</div><div class="pnl red">-$720</div><div class="tc">3 trades</div></div>
      <div class="cal-cell c-win"><div class="dn">13</div><div class="pnl green">+$1.8k</div><div class="tc">5 trades</div></div>
      <div class="cal-cell c-win"><div class="dn">14</div><div class="pnl green">+$630</div><div class="tc">2 trades</div></div>
      <div class="cal-cell c-today"><div class="dn" style="color:#0969da">15</div></div>
    </div>
  </div>
</div>
<h3>Cell Behavior</h3>
<table class="tbl">
  <thead><tr><th>Cell State</th><th>Action on Click</th><th>Visual Cue</th></tr></thead>
  <tbody>
    <tr><td>Day with journal entry</td><td>Navigates to <code>/journal/calendar/YYYY-MM-DD</code></td><td>Colored border + P&amp;L + mood dot</td></tr>
    <tr><td>Day without journal entry</td><td>Opens journal entry editor dialog</td><td>Empty cell with day number only</td></tr>
    <tr><td>Today</td><td>Same as above based on entry status</td><td>Blue ring border</td></tr>
    <tr><td>Outside current month</td><td>Not clickable</td><td>10% opacity, greyed out</td></tr>
  </tbody>
</table>
</section>

<section id="journalday">
<h2>Journal Day View</h2>
<p>Route: <code>/journal/calendar/YYYY-MM-DD</code>. Full-page view for a specific trading day. Only reachable when a day has an existing journal entry.</p>
<div class="screen">
  <div class="screen-bar"><div class="dot dr"></div><div class="dot dy"></div><div class="dot dg"></div><div class="url">tradiator.net/journal/calendar/2025-04-28</div></div>
  <div class="screen-body">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px">
        <button style="background:#f6f8fa;border:1px solid #d0d7de;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:13px">←</button>
        <div>
          <div style="font-size:10px;color:#656d76;text-transform:uppercase;letter-spacing:.06em">Monday · April 28, 2025</div>
          <div style="font-size:17px;font-weight:700;color:#1f2328;margin-top:1px">Bearish Bias — Stayed Patient</div>
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button style="background:#f6f8fa;border:1px solid #d0d7de;padding:5px 12px;border-radius:6px;font-size:11px;cursor:pointer">✏️ Edit</button>
        <button style="background:#ffebe9;border:1px solid #ffb8b0;color:#cf222e;padding:5px 12px;border-radius:6px;font-size:11px;cursor:pointer">🗑 Delete</button>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <span class="j-pill">🟠 Bad mood</span>
      <span class="j-pill" style="border-color:#ffb8b0;color:#cf222e">Bearish</span>
      <span class="j-pill">★★★☆☆</span>
      <span class="j-pill" style="border-color:#82cfac;color:#1a7f37">✓ Rules Followed</span>
      <span class="j-pill" style="border-color:#ffb8b0;color:#cf222e">📉 -$3,220 · 6 trades</span>
    </div>
    <div class="j-section"><div class="j-sec-label">Pre-Market Plan</div><div class="j-sec-text">Bias is bearish. Looking for rejections at the London high for NY open shorts...</div></div>
    <div class="j-section"><div class="j-sec-label">Post-Session Notes</div><div class="j-sec-text">Took 2 trades at the planned level. Two revenge trades afterward caused most of the drawdown.</div></div>
  </div>
</div>
<h3>All Sections Displayed</h3>
<ol>
  <li><strong>Header Pills</strong> — Mood, Bias, Star rating, Rules followed, Net P&amp;L + trade count</li>
  <li><strong>Pre-Market Plan</strong> — Full text, whitespace preserved</li>
  <li><strong>Post-Session Notes</strong> — Notes written after the close</li>
  <li><strong>Setups Traded</strong> — Badge list</li>
  <li><strong>Sessions Traded</strong> — Badge list</li>
  <li><strong>Improvement Focus</strong> — One thing the trader was working on</li>
  <li><strong>Trades Table</strong> — Symbol, Direction, Contracts, Entry, Exit, Net P&amp;L, R, Setup</li>
</ol>
<div class="g2">
  <div class="card"><div class="card-title">✏️ Edit</div><p style="font-size:13px;color:#656d76;margin:0">Links to <code>/journal/calendar?edit=YYYY-MM-DD</code> — auto-opens the entry editor.</p></div>
  <div class="card"><div class="card-title">🗑️ Delete Entry</div><p style="font-size:13px;color:#656d76;margin:0">Confirm dialog → deletes via <code>DELETE /api/journal-entries</code> → redirects to calendar.</p></div>
</div>
</section>

<section id="insights">
<h2>Insights &amp; Analytics</h2>
<p>Route: <code>/insights</code>. All calculations happen server-side from <code>trades</code> and <code>journal_entries</code> tables on every page load.</p>
<div class="fg">
  <div class="fc"><div class="fc-icon">📆</div><div class="fc-title">Day of Week</div><div class="fc-desc">Average P&amp;L and trade count per weekday.</div></div>
  <div class="fc"><div class="fc-icon">🕐</div><div class="fc-title">By Session</div><div class="fc-desc">London, NY Open, NY AM, NY PM, Asia breakdown.</div></div>
  <div class="fc"><div class="fc-icon">📌</div><div class="fc-title">By Setup</div><div class="fc-desc">Most profitable setups and highest win rate. Top 5.</div></div>
  <div class="fc"><div class="fc-icon">🪙</div><div class="fc-title">By Symbol</div><div class="fc-desc">Net P&amp;L per instrument. Top 5 symbols.</div></div>
  <div class="fc"><div class="fc-icon">📓</div><div class="fc-title">Journal Stats</div><div class="fc-desc">Days journaled, rules followed %, avg session rating.</div></div>
  <div class="fc"><div class="fc-icon">🏆</div><div class="fc-title">Best/Worst Trade</div><div class="fc-desc">Best and worst trade ever. Best month. Total commissions.</div></div>
</div>
<h3>Computed Metrics</h3>
<table class="tbl">
  <thead><tr><th>Metric</th><th>Formula</th></tr></thead>
  <tbody>
    <tr><td>Win Rate</td><td><code>wins.length / trades.length × 100</code></td></tr>
    <tr><td>Profit Factor</td><td><code>sum(winning pnl) ÷ abs(sum(losing pnl))</code></td></tr>
    <tr><td>Avg R-Multiple</td><td>Sum of r_multiple ÷ count of trades with r_multiple set</td></tr>
    <tr><td>Best Month</td><td>Month with highest <code>sum(pnl − commission)</code></td></tr>
    <tr><td>Rules Followed %</td><td>Entries where <code>rules_followed = true</code> ÷ total entries</td></tr>
    <tr><td>Avg Rating</td><td>Average of <code>journal_entries.rating</code> (0–5)</td></tr>
  </tbody>
</table>
</section>

<section id="strategies">
<h2>Strategy Library</h2>
<p>Route: <code>/strategies</code>. Stored in the <code>strategies</code> Supabase table — not localStorage. Scoped per user via RLS.</p>
<h3>Strategy Fields</h3>
<table class="tbl">
  <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>Name</td><td>text (required)</td><td>e.g. "ICT OTE Long", "VWAP Reclaim"</td></tr>
    <tr><td>Sessions</td><td>text[]</td><td>London, NY Open, NY AM, NY PM, Asia</td></tr>
    <tr><td>Timeframes</td><td>text[]</td><td>1m, 3m, 5m, 15m, 30m, 1h, 4h, Daily</td></tr>
    <tr><td>Entry Conditions</td><td>text</td><td>Step-by-step entry rules</td></tr>
    <tr><td>Confluences Required</td><td>text</td><td>Confirmation signals needed</td></tr>
    <tr><td>Tags</td><td>text[]</td><td>Comma-separated. Shown as #tag chips.</td></tr>
    <tr><td>Color</td><td>hex string</td><td>8 options. Left-border accent on card.</td></tr>
  </tbody>
</table>
<h3>CRUD Flow</h3>
<div class="flow">
  <div class="fbox">+ Add Strategy</div><div class="farr">→</div>
  <div class="fbox hi">Fill modal</div><div class="farr">→</div>
  <div class="fbox">POST /api/strategies</div><div class="farr">→</div>
  <div class="fbox hi">Card appears instantly</div>
</div>
</section>

<section id="eval">
<h2>Eval Expenses &amp; Payouts</h2>
<p>Route: <code>/eval</code>. Stored in <code>eval_expenses</code> and <code>eval_payouts</code> Supabase tables — not localStorage.</p>
<div class="g2">
  <div class="card"><div class="card-title">📤 Expenses</div><p style="font-size:13px;color:#656d76;margin:0">Types: Evaluation Fee, Reset Fee, Monthly Fee, Platform Fee, Other. Scrollable table (~10 rows), sorted newest first.</p></div>
  <div class="card"><div class="card-title">📥 Payouts</div><p style="font-size:13px;color:#656d76;margin:0">Fields: Date, Firm, Amount, Notes. Status always shows <span class="badge b-green">Paid</span>. Scrollable, sorted newest first.</p></div>
</div>
<h3>Stats Cards</h3>
<table class="tbl">
  <thead><tr><th>Card</th><th>Calculation</th></tr></thead>
  <tbody>
    <tr><td>Total Expenses</td><td>Sum of all expense amounts</td></tr>
    <tr><td>Total Payouts</td><td>Sum of all payout amounts</td></tr>
    <tr><td>Net Profit</td><td>Total Payouts − Total Expenses</td></tr>
    <tr><td>Best Month</td><td>Month with highest (payouts − expenses) net</td></tr>
    <tr><td>ROI on Evals</td><td>(Net Profit ÷ Total Expenses) × 100</td></tr>
  </tbody>
</table>
<h3>🏆 Congratulations Banner</h3>
<p>When a payout is saved, a gold pill banner drops from the top center. Shows trophy icons, amount, and firm name. Auto-dismisses after 5 seconds.</p>
</section>

<section id="import">
<h2>CSV Import</h2>
<p>Route: <code>/import</code>. Supports Tradovate, ProjectX/Rithmic, and Generic CSV formats.</p>
<div class="alert a-warn">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>
  <div><strong>Use the Trades report, not Fills.</strong> Tradovate's <em>Fills</em> export shows individual order legs — use the <em>Trades</em> (Closed P&amp;L) report instead for properly paired entry/exit trades.</div>
</div>
<ol class="steps">
  <li class="step"><div class="step-n">1</div><div class="step-b"><strong>Select Platform</strong><p>Choose: Tradovate, ProjectX, or Generic.</p></div></li>
  <li class="step"><div class="step-n">2</div><div class="step-b"><strong>Select Account</strong><p>Pick which trading account to attribute these trades to.</p></div></li>
  <li class="step"><div class="step-n">3</div><div class="step-b"><strong>Paste CSV</strong><p>Paste raw CSV text into the textarea.</p></div></li>
  <li class="step"><div class="step-n">4</div><div class="step-b"><strong>Preview Parsed Rows</strong><p>System shows a preview table of mapped trades before import.</p></div></li>
  <li class="step"><div class="step-n">5</div><div class="step-b"><strong>Confirm Import</strong><p>Sends to <code>POST /api/import-csv</code> which bulk inserts into trades table.</p></div></li>
</ol>
<div class="alert a-warn">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>
  <div><strong>No deduplication.</strong> Importing the same CSV twice creates duplicate records. Verify the trade count before confirming.</div>
</div>
</section>

<section id="settings">
<h2>Account Settings</h2>
<p>Route: <code>/settings</code>. All changes save to Supabase in real time.</p>
<table class="tbl">
  <thead><tr><th>Tab</th><th>What You Can Do</th></tr></thead>
  <tbody>
    <tr><td><strong>Profile</strong></td><td>Edit full name. Change password (min 8 chars, must match confirmation). Email/role/plan are read-only.</td></tr>
    <tr><td><strong>Accounts</strong></td><td>Add/edit/delete trading accounts. Types: funded, eval, live, PA.</td></tr>
    <tr><td><strong>Preferences</strong></td><td>Timezone, default currency, language, post-trade popup toggle.</td></tr>
    <tr><td><strong>Subscription</strong></td><td>View plan, billing period, cancel-at-period-end status.</td></tr>
    <tr><td><strong>Theme</strong></td><td>Toggle dark/light mode. Accent color picker.</td></tr>
    <tr><td><strong>Sessions</strong></td><td>View active login sessions. Revoke individual sessions.</td></tr>
    <tr><td><strong>Danger Zone</strong></td><td>Clear All Trades (irreversible). Delete Account (all data deleted).</td></tr>
  </tbody>
</table>
<div class="alert a-danger">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>
  <div><strong>Danger Zone actions are irreversible.</strong> "Delete Account" deletes the auth session, profile, and all associated data via cascade delete.</div>
</div>
</section>

<section id="api">
<h2>API Reference</h2>
<p>All routes under <code>/api/*</code> as Next.js Route Handlers. Every route verifies auth. Unauthenticated requests return <code>401</code>.</p>
<h3>Trades</h3>
<table class="tbl">
  <thead><tr><th>Method</th><th>Route</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><span class="method POST">POST</span></td><td><span class="route">/api/trades</span></td><td>Create a trade. Calculates R server-side.</td></tr>
    <tr><td><span class="method PATCH">PATCH</span></td><td><span class="route">/api/trades/update</span></td><td>Update an existing trade</td></tr>
    <tr><td><span class="method DELETE">DELETE</span></td><td><span class="route">/api/trades</span></td><td>Delete a trade. RLS enforces ownership.</td></tr>
  </tbody>
</table>
<h3>Journal Entries</h3>
<table class="tbl">
  <thead><tr><th>Method</th><th>Route</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><span class="method POST">POST</span></td><td><span class="route">/api/journal-entries</span></td><td>Upsert — one entry per user per date</td></tr>
    <tr><td><span class="method DELETE">DELETE</span></td><td><span class="route">/api/journal-entries</span></td><td>Delete by ID</td></tr>
  </tbody>
</table>
<h3>Strategies</h3>
<table class="tbl">
  <thead><tr><th>Method</th><th>Route</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><span class="method GET">GET</span></td><td><span class="route">/api/strategies</span></td><td>List all for current user</td></tr>
    <tr><td><span class="method POST">POST</span></td><td><span class="route">/api/strategies</span></td><td>Create new strategy</td></tr>
    <tr><td><span class="method PATCH">PATCH</span></td><td><span class="route">/api/strategies</span></td><td>Update by ID (must be owner)</td></tr>
    <tr><td><span class="method DELETE">DELETE</span></td><td><span class="route">/api/strategies</span></td><td>Delete by ID (must be owner)</td></tr>
  </tbody>
</table>
<h3>Eval Expenses &amp; Payouts</h3>
<table class="tbl">
  <thead><tr><th>Method</th><th>Route</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><span class="method GET">GET</span></td><td><span class="route">/api/eval-expenses</span></td><td>List all for current user</td></tr>
    <tr><td><span class="method POST">POST</span></td><td><span class="route">/api/eval-expenses</span></td><td>Create expense</td></tr>
    <tr><td><span class="method DELETE">DELETE</span></td><td><span class="route">/api/eval-expenses</span></td><td>Delete by ID</td></tr>
    <tr><td><span class="method GET">GET</span></td><td><span class="route">/api/eval-payouts</span></td><td>List all for current user</td></tr>
    <tr><td><span class="method POST">POST</span></td><td><span class="route">/api/eval-payouts</span></td><td>Create payout (triggers banner)</td></tr>
    <tr><td><span class="method DELETE">DELETE</span></td><td><span class="route">/api/eval-payouts</span></td><td>Delete by ID</td></tr>
  </tbody>
</table>
<h3>Other</h3>
<table class="tbl">
  <thead><tr><th>Method</th><th>Route</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><span class="method POST">POST</span></td><td><span class="route">/api/import-csv</span></td><td>Bulk insert trades from CSV data</td></tr>
    <tr><td><span class="method DELETE">DELETE</span></td><td><span class="route">/api/delete-account</span></td><td>User self-deletion</td></tr>
  </tbody>
</table>
<h3>Error Format</h3>
<pre>// Success
{ data: {...} }

// Error
{ error: "Error message here" }  // HTTP 400, 401, 403, or 500</pre>
</section>

<section id="database">
<h2>Database Schema</h2>
<p>All tables in <code>public</code> schema of Supabase (PostgreSQL 15). Every table has Row Level Security enabled.</p>
<h3>profiles</h3>
<table class="tbl">
  <thead><tr><th>Column</th><th>Type</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td class="col-n">id</td><td class="col-t">uuid PK</td><td>References auth.users — cascade delete</td></tr>
    <tr><td class="col-n">email</td><td class="col-t">text</td><td>Unique, not null</td></tr>
    <tr><td class="col-n">role</td><td class="col-t">text</td><td>user | moderator | admin. Default: user</td></tr>
    <tr><td class="col-n">plan</td><td class="col-t">text</td><td>free | pro | premium. Default: free</td></tr>
    <tr><td class="col-n">banned</td><td class="col-t">boolean</td><td>Default false</td></tr>
    <tr><td class="col-n">last_seen</td><td class="col-t">timestamptz</td><td>Updated on every authenticated page load</td></tr>
  </tbody>
</table>
<h3>trades</h3>
<table class="tbl">
  <thead><tr><th>Column</th><th>Type</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td class="col-n">user_id</td><td class="col-t">uuid FK</td><td>References profiles. Cascade delete.</td></tr>
    <tr><td class="col-n">trade_date</td><td class="col-t">date</td><td>Not null</td></tr>
    <tr><td class="col-n">pnl</td><td class="col-t">numeric(14,2)</td><td>Gross P&amp;L before commission</td></tr>
    <tr><td class="col-n">commission</td><td class="col-t">numeric(14,2)</td><td>Default 0</td></tr>
    <tr><td class="col-n">r_multiple</td><td class="col-t">numeric(8,2)</td><td>Calculated server-side. Nullable.</td></tr>
    <tr><td class="col-n">is_flagged</td><td class="col-t">boolean</td><td>Default false</td></tr>
  </tbody>
</table>
<h3>journal_entries</h3>
<table class="tbl">
  <thead><tr><th>Column</th><th>Type</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td class="col-n">entry_date</td><td class="col-t">date</td><td>Unique per user_id</td></tr>
    <tr><td class="col-n">bias</td><td class="col-t">text</td><td>Bullish | Bearish | Neutral | null</td></tr>
    <tr><td class="col-n">mood</td><td class="col-t">text</td><td>great | good | neutral | bad | terrible | null</td></tr>
    <tr><td class="col-n">rating</td><td class="col-t">int</td><td>0–5 stars</td></tr>
    <tr><td class="col-n">setups</td><td class="col-t">text[]</td><td>Array of setup names</td></tr>
    <tr><td class="col-n">sessions</td><td class="col-t">text[]</td><td>Array of sessions traded</td></tr>
    <tr><td class="col-n">rules_followed</td><td class="col-t">boolean</td><td>Nullable</td></tr>
  </tbody>
</table>
<h3>Other Tables</h3>
<table class="tbl">
  <thead><tr><th>Table</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td class="col-n">accounts</td><td>Trading accounts (funded/eval/live/PA)</td></tr>
    <tr><td class="col-n">strategies</td><td>User strategy library</td></tr>
    <tr><td class="col-n">eval_expenses</td><td>Eval costs per user</td></tr>
    <tr><td class="col-n">eval_payouts</td><td>Payout records per user</td></tr>
    <tr><td class="col-n">cooldowns</td><td>Admin-placed trading cooldowns</td></tr>
    <tr><td class="col-n">user_settings</td><td>Per-user preferences</td></tr>
    <tr><td class="col-n">subscriptions</td><td>Stripe subscription data</td></tr>
    <tr><td class="col-n">admin_logs</td><td>Immutable audit log of all admin actions</td></tr>
  </tbody>
</table>
</section>

<section id="auth">
<h2>Auth &amp; Security</h2>
<h3>Authentication Flow</h3>
<div class="flow">
  <div class="fbox">User signs up / logs in</div><div class="farr">→</div>
  <div class="fbox hi">Supabase Auth (JWT)</div><div class="farr">→</div>
  <div class="fbox">Trigger creates profile row</div><div class="farr">→</div>
  <div class="fbox hi">middleware.ts refreshes session</div><div class="farr">→</div>
  <div class="fbox">requireRole() on every page</div>
</div>
<h3>requireRole() — How It Works</h3>
<pre>const { user, profile } = await requireRole(["user", "moderator", "admin"]);
// 1. Gets JWT user from Supabase Auth
// 2. Fetches profile row from DB (role, banned, plan)
// 3. Checks role is in allowed array
// 4. Checks banned = false
// 5. Updates last_seen timestamp
// 6. Returns user + profile — or redirects to /login</pre>
<h3>Security Summary</h3>
<div class="alert a-success">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
  <div><strong>Admin panel properly secured.</strong> Role always read fresh from DB — never from cookie or client state.</div>
</div>
<div class="alert a-success">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
  <div><strong>No privilege escalation possible.</strong> Admin role can only be assigned via direct SQL.</div>
</div>
<div class="alert a-warn">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>
  <div><strong>Middleware doesn't block routes at the edge.</strong> Protection is page-level only. New pages need <code>requireRole()</code> or they're unprotected.</div>
</div>
<div class="alert a-warn">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>
  <div><strong>No rate limiting on custom API routes.</strong> Brute force on /login is handled by Supabase Auth, but app API endpoints have none.</div>
</div>
</section>

<section id="testing">
<h2>Test Scenarios &amp; Checklist</h2>
<p>Each item should pass without errors on a fresh user account unless noted.</p>
<h4>🔐 Authentication</h4>
<div class="chk-grid">
  <div class="chk-item">Sign up with a new email</div>
  <div class="chk-item">Sign up with existing email (should error)</div>
  <div class="chk-item">Login with correct credentials</div>
  <div class="chk-item">Login with wrong password (should error)</div>
  <div class="chk-item">/dashboard logged out → redirects to /login</div>
  <div class="chk-item">Password mismatch → inline error</div>
  <div class="chk-item">Password under 8 chars → inline error</div>
  <div class="chk-item">Change password → login with new password works</div>
</div>
<h4>📊 Dashboard</h4>
<div class="chk-grid">
  <div class="chk-item">Dashboard loads with stats and equity curve</div>
  <div class="chk-item">Time filter changes update all stats</div>
  <div class="chk-item">Log Win opens dialog pre-filled as Long</div>
  <div class="chk-item">Log Loss opens dialog pre-filled as Short</div>
  <div class="chk-item">New trade appears in recent trades</div>
  <div class="chk-item">Recent journal feed shows last 3 entries</div>
</div>
<h4>💹 Trade Logging</h4>
<div class="chk-grid">
  <div class="chk-item">Log trade with all fields</div>
  <div class="chk-item">Log trade with only required fields</div>
  <div class="chk-item">R-multiple calculates when all prices provided</div>
  <div class="chk-item">R-multiple is null when prices missing</div>
  <div class="chk-item">Trade appears in Trades page table</div>
  <div class="chk-item">Click trade row → opens detail page</div>
  <div class="chk-item">Edit trade → changes saved</div>
  <div class="chk-item">Delete trade → removed from table</div>
  <div class="chk-item">Multi-select bulk delete works</div>
  <div class="chk-item">Post-trade popup appears when enabled</div>
  <div class="chk-item">Disable popup in settings → stops appearing</div>
</div>
<h4>📅 Playbook Calendar</h4>
<div class="chk-grid">
  <div class="chk-item">Calendar renders correct days</div>
  <div class="chk-item">Days with trades show P&amp;L and count</div>
  <div class="chk-item">Win days green, loss days red</div>
  <div class="chk-item">Today has blue ring</div>
  <div class="chk-item">Stats bar updates on month navigation</div>
  <div class="chk-item">Day WITH entry → journal day view</div>
  <div class="chk-item">Day WITHOUT entry → editor dialog</div>
  <div class="chk-item">Mood dot visible on journal days</div>
  <div class="chk-item">Month navigation works</div>
  <div class="chk-item">Today button returns to current month</div>
</div>
<h4>📝 Journal Day View</h4>
<div class="chk-grid">
  <div class="chk-item">All journal sections display</div>
  <div class="chk-item">Trade table shows correct trades</div>
  <div class="chk-item">W/L count and total P&amp;L correct</div>
  <div class="chk-item">Edit button opens editor with data</div>
  <div class="chk-item">Delete → confirm → redirected to calendar</div>
  <div class="chk-item">Deleted entry no longer on calendar</div>
  <div class="chk-item">Non-existent date URL → redirects to calendar</div>
</div>
<h4>🗂️ Strategies</h4>
<div class="chk-grid">
  <div class="chk-item">Empty state shows prompt</div>
  <div class="chk-item">Create strategy with all fields</div>
  <div class="chk-item">Card shows color, sessions, timeframes, tags</div>
  <div class="chk-item">Edit → changes persist after refresh</div>
  <div class="chk-item">Delete → confirm → removed</div>
  <div class="chk-item">Search filters by name and tag</div>
  <div class="chk-item">Log out and back in → strategies present</div>
  <div class="chk-item">Different user can't see your strategies</div>
</div>
<h4>💰 Eval &amp; Payouts</h4>
<div class="chk-grid">
  <div class="chk-item">Add expense → appears immediately</div>
  <div class="chk-item">Add payout → gold banner appears</div>
  <div class="chk-item">Banner auto-dismisses after 5 seconds</div>
  <div class="chk-item">Click banner → dismisses early</div>
  <div class="chk-item">Stats update after add</div>
  <div class="chk-item">Delete → removed and stats update</div>
  <div class="chk-item">Tables scroll independently &gt;10 rows</div>
  <div class="chk-item">Log out and back → all records present</div>
</div>
<h4>📥 CSV Import</h4>
<div class="chk-grid">
  <div class="chk-item">Use Trades report (not Fills) for Tradovate</div>
  <div class="chk-item">Paste CSV → preview shows parsed rows</div>
  <div class="chk-item">Confirm → trades appear in Trades page</div>
  <div class="chk-item">Same CSV twice creates duplicates (known)</div>
</div>
<h4>⚙️ Settings</h4>
<div class="chk-grid">
  <div class="chk-item">Edit full name → persists after refresh</div>
  <div class="chk-item">Add account → appears in list</div>
  <div class="chk-item">Edit account → changes saved</div>
  <div class="chk-item">Delete account → removed</div>
  <div class="chk-item">Change timezone → saved to DB</div>
  <div class="chk-item">Toggle dark/light mode</div>
  <div class="chk-item">Clear Trades removes all records</div>
  <div class="chk-item">Delete Account removes user entirely</div>
</div>
<h4>📱 Mobile</h4>
<div class="chk-grid">
  <div class="chk-item">Dashboard readable on mobile</div>
  <div class="chk-item">Log Win/Loss floating buttons visible</div>
  <div class="chk-item">Calendar cells readable</div>
  <div class="chk-item">Sidebar hidden, mobile nav visible</div>
  <div class="chk-item">Discord icon next to logo</div>
  <div class="chk-item">All modals usable on small screen</div>
</div>
<div class="alert a-info" style="margin-top:28px">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm6.5-.25A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75zM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
  <div><strong>How to report bugs:</strong> Note the exact URL, expected behavior, actual behavior, and any console errors (F12 → Console). Include browser, device, and account email used.</div>
</div>
</section>

<hr/>
<p style="text-align:center;color:#656d76;font-family:'JetBrains Mono',monospace;font-size:11px;padding:16px 0">Tradiator Documentation · For internal tester use only · Do not distribute publicly</p>

</main>
</div>
`;

export default function DocsPage() {
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = "docs-styles";
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
    return () => {
      document.getElementById("docs-styles")?.remove();
    };
  }, []);

  return (
    <div
      className="docs-root"
      dangerouslySetInnerHTML={{ __html: HTML }}
    />
  );
}