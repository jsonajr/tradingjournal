11:53:15.570 Running build in Washington, D.C., USA (East) – iad1
11:53:15.571 Build machine configuration: 2 cores, 8 GB
11:53:15.696 Cloning github.com/jsonajr/tradingjournal (Branch: main, Commit: ccfe41c)
11:53:16.271 Cloning completed: 575.000ms
11:53:17.000 Restored build cache from previous deployment (C1DcQw2ShproWb3ve8rBEm3hfNAy)
11:53:17.195 Running "vercel build"
11:53:17.866 Vercel CLI 51.6.1
11:53:18.145 Installing dependencies...
11:53:19.546 
11:53:19.547 up to date in 989ms
11:53:19.548 
11:53:19.548 150 packages are looking for funding
11:53:19.548   run `npm fund` for details
11:53:19.575 Detected Next.js version: 15.0.7
11:53:19.618 Running "npm run build"
11:53:19.739 
11:53:19.740 > trading-platform@1.0.0 build
11:53:19.740 > next build
11:53:19.740 
11:53:20.474    ▲ Next.js 15.0.7
11:53:20.475 
11:53:20.495    Creating an optimized production build ...
11:53:29.622  ✓ Compiled successfully
11:53:29.625    Linting and checking validity of types ...
11:53:37.500 Failed to compile.
11:53:37.501 
11:53:37.501 ./app/(app)/journal/[tradeId]/page.tsx:38:29
11:53:37.501 Type error: Type '{ id: any; trade_date: any; symbol: any; direction: any; contracts: any; entry_price: any; exit_price: any; stop_price: any; pnl: any; commission: any; r_multiple: any; setup: any; session: any; grade: any; notes: any; account_id: any; accounts: { ...; }[]; }' is not assignable to type 'Trade'.
11:53:37.502   Types of property 'accounts' are incompatible.
11:53:37.502     Type '{ name: any; firm: any; }[]' is missing the following properties from type '{ name: string; firm: string | null; }': name, firm
11:53:37.502 
11:53:37.502 [0m [90m 36 |[39m   }[33m;[39m[0m
11:53:37.502 [0m [90m 37 |[39m[0m
11:53:37.502 [0m[31m[1m>[22m[39m[90m 38 |[39m   [36mreturn[39m [33m<[39m[33mTradeDetailClient[39m trade[33m=[39m{trade} adjacent[33m=[39m{adjacent} accounts[33m=[39m{accounts [33m?[39m[33m?[39m []} [33m/[39m[33m>[39m[33m;[39m[0m
11:53:37.502 [0m [90m    |[39m                             [31m[1m^[22m[39m[0m
11:53:37.503 [0m [90m 39 |[39m }[0m
11:53:37.569 Error: Command "npm run build" exited with 1