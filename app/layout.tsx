import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tradiator — Trading Discipline Platform",
    template: "%s | Tradiator",
  },
  description: "Trade journal, analytics, and discipline tools for serious traders.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tradiator",
  },
  formatDetection: {
    telephone: false,
  },
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