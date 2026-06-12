"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { workspaceHomePath } from "@/lib/role-access";
import { useAuthStore } from "@/stores/auth-store";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const persistReady = useAuthStore.persist.hasHydrated();
  const isReady = hydrated || persistReady;

  useEffect(() => {
    if (!isReady) return;
    if (!hydrated) {
      useAuthStore.getState().setHasHydrated(true);
    }
  }, [isReady, hydrated]);

  useEffect(() => {
    if (!isReady) return;
    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }
    if (user && (pathname === "/login" || pathname === "/signup")) {
      router.replace(
        !onboardingComplete ? "/onboarding" : workspaceHomePath(user.role),
      );
      return;
    }
    if (
      user &&
      !onboardingComplete &&
      pathname !== "/onboarding" &&
      !isPublic
    ) {
      router.replace("/onboarding");
    }
  }, [user, isReady, isPublic, pathname, router, onboardingComplete]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user && !isPublic) return null;
  if (user && (pathname === "/login" || pathname === "/signup")) return null;

  return <>{children}</>;
};
