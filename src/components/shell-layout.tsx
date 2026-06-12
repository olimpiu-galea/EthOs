"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { useAuthStore } from "@/stores/auth-store";

const ALWAYS_BARE_PATHS = ["/login", "/signup", "/onboarding"];

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const bare =
    ALWAYS_BARE_PATHS.includes(pathname) || (pathname === "/" && !user);

  return (
    <AuthGuard>
      {bare ? children : <AppShell>{children}</AppShell>}
    </AuthGuard>
  );
}
