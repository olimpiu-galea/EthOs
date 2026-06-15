import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ShellLayout } from "@/components/shell-layout";
import { StoreHydration } from "@/components/store-hydration";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_DESCRIPTION,
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
          <ShellLayout>{children}</ShellLayout>
        </StoreHydration>
        <Toaster />
      </body>
    </html>
  );
}
