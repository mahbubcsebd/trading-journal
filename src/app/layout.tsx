import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthGate } from "@/components/auth-gate";
import { AccountsProvider } from "@/components/accounts-provider";
import { TradesProvider } from "@/components/trades-provider";
import { PwaRegister } from "@/components/pwa-register";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "A calm, simple journal to track every trade, rule and result.",
  applicationName: "Trading Journal",
  icons: { icon: "/pwa-icon?size=192", apple: "/pwa-icon?size=180" },
  appleWebApp: { capable: true, title: "Journal", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c5cdb",
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PwaRegister />
        <AuthGate>
          <TradesProvider>
            <AccountsProvider>
              <AppShell>{children}</AppShell>
            </AccountsProvider>
          </TradesProvider>
        </AuthGate>
      </body>
    </html>
  );
}
