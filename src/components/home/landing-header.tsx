"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { EthOsWordmark } from "@/components/brand/ethos-wordmark";
import { Button } from "@/components/ui/button";
import { workspaceHomePath } from "@/lib/role-access";
import { useAuthStore } from "@/stores/auth-store";

export function LandingHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <EthOsWordmark showScope />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[140px]">
                {user.name}
              </span>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={workspaceHomePath(user.role)}>Open workspace</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </Button>
              <Button size="sm" className="gap-2" disabled>
                <UserPlus className="h-4 w-4" />
                Create account
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
