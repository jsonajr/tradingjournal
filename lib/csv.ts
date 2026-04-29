// CSV line splitter that respects quoted fields with commas inside
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const num = (v: string | undefined): number => {
  if (!v) return 0;
  const cleaned = String(v).replace(/[$,\s]/g, "").replace(/[()]/g, (m) => (m === "(" ? "-" : ""));
  const f = parseFloat(cleaned);
  return isNaN(f) ? 0 : f;
};

const dirOf = (raw: string | undefined): "Long" | "Short" => {
  const v = String(raw || "").toLowerCase().trim();
  if (!v) return "Long";
  if (v.startsWith("s") || v === "sell" || v === "sld" || v.includes("short")) return "Short";
  return "Long";
};

function formatDate(s: string): string {
  if (!s) return new Date().toISOString().split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toISOString().split("T")[0];
}

export type ParsedTrade = {
  trade_date: string;
  symbol: string;
  direction: "Long" | "Short";
  contracts: number;
  entry_price: number;
  exit_price: number;
  stop_price: number;
  pnl: number;
  commission: number;
  r_multiple: number | null;
  setup: string;
  grade: string;
};

export type Platform = "tradovate" | "projectx" | "generic";

export function parseCSV(text: string, platform: Platform): ParsedTrade[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").toLowerCase());
  const rows: ParsedTrade[] = [];

  const get = (cols: string[], ...names: string[]): string => {
    for (const n of names) {
      const exact = headers.indexOf(n);
      if (exact >= 0 && cols[exact]) return cols[exact];
    }
    for (const n of names) {
      const partial = headers.findIndex((h) => h.includes(n));
      if (partial >= 0 && cols[partial]) return cols[partial];
    }
    return "";
  };

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]).map((c) => c.replace(/^"|"$/g, ""));
    if (cols.length < 3) continue;

    let trade: ParsedTrade;

    if (platform === "tradovate") {
      const dateRaw = get(cols, "tradeday", "tradedate") || get(cols, "enteredat", "date", "time");
      const symbol = get(cols, "contractname", "symbol", "contract", "instrument");
      trade = {
        trade_date: formatDate(String(dateRaw).split(/[ T]/)[0]),
        symbol,
        direction: dirOf(get(cols, "type", "b/s", "side", "direction")),
        contracts: parseInt(get(cols, "size", "qty", "quantity", "contracts")) || 1,
        entry_price: num(get(cols, "entryprice", "price", "avgprice")),
        exit_price: num(get(cols, "exitprice")),
        stop_price: 0,
        pnl: num(get(cols, "pnl", "p&l", "profit", "realizedpnl", "tradepnl")),
        commission: num(get(cols, "fees", "commission", "comm", "fee")),
        r_multiple: null,
        setup: "Import",
        grade: "—",
      };
    } else if (platform === "projectx") {
      const dateRaw = get(cols, "date", "tradedate", "tradeday", "enteredat", "time", "datetime");
      trade = {
        trade_date: formatDate(String(dateRaw).split(/[ T]/)[0]),
        symbol: get(cols, "instrument", "symbol", "contractname", "contract"),
        direction: dirOf(get(cols, "side", "type", "b/s", "direction")),
        contracts: parseInt(get(cols, "quantity", "qty", "size", "contracts")) || 1,
        entry_price: num(get(cols, "entryprice", "avgprice", "price")),
        exit_price: num(get(cols, "exitprice")),
        stop_price: 0,
        pnl: num(get(cols, "pnl", "p&l", "profit", "realizedpnl")),
        commission: num(get(cols, "fee", "fees", "commission", "comm")),
        r_multiple: null,
        setup: "Import",
        grade: "—",
      };
    } else {
      const dateRaw = get(cols, "date", "tradedate", "tradeday", "enteredat", "time");
      trade = {
        trade_date: formatDate(dateRaw),
        symbol: get(cols, "symbol", "instrument", "contractname", "contract", "ticker"),
        direction: dirOf(get(cols, "direction", "dir", "side", "type", "b/s")),
        contracts: parseInt(get(cols, "contracts", "qty", "quantity", "size")) || 1,
        entry_price: num(get(cols, "entry", "entryprice", "price", "avgprice")),
        exit_price: num(get(cols, "exit", "exitprice")),
        stop_price: num(get(cols, "stop", "stopprice")),
        pnl: num(get(cols, "pnl", "p&l", "profit", "pl", "realizedpnl")),
        commission: num(get(cols, "commission", "comm", "fee", "fees")),
        r_multiple: null,
        setup: get(cols, "setup", "strategy") || "Import",
        grade: get(cols, "grade") || "—",
      };
    }

    if (trade.trade_date && trade.symbol) rows.push(trade);
  }
  return rows;
}
