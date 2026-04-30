import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "JsonTrades — Trading Discipline Platform",
  description: "Trade journal, analytics, and discipline tools for serious traders.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f1117",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('tj_theme');
            const el = document.documentElement; el.classList.remove('dark','midnight'); if(t==='dark'||t==='midnight') el.classList.add('dark'); if(t==='midnight') el.classList.add('midnight');
            const a = localStorage.getItem('tj_accent');
            if (a) {
              const h = parseInt(a.slice(1,3),16)/255, s2 = parseInt(a.slice(3,5),16)/255, l2 = parseInt(a.slice(5,7),16)/255;
              const max = Math.max(h,s2,l2), min = Math.min(h,s2,l2);
              let hh=0,ss=0; const ll=(max+min)/2;
              if(max!==min){const d=max-min;ss=ll>0.5?d/(2-max-min):d/(max+min);switch(max){case h:hh=(s2-l2)/d+(s2<l2?6:0);break;case s2:hh=(l2-h)/d+2;break;case l2:hh=(h-s2)/d+4;break;}hh/=6;}
              document.documentElement.style.setProperty('--primary', Math.round(hh*360)+' '+Math.round(ss*100)+'% '+Math.round(ll*100)+'%');
            }
          } catch(e){}
        `}} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster theme="system" position="bottom-right" richColors />
      </body>
    </html>
  );
}