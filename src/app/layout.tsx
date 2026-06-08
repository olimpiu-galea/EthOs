import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { StoreHydration } from "@/components/store-hydration";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SignalRelay",
  description: "Turn live signals into playbooks, alerts, and guided action",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreHydration>
          <AppShell>{children}</AppShell>
        </StoreHydration>
        <Toaster />
      </body>
    </html>
  );
}
