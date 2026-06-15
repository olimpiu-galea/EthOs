"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { workspaceHomePath } from "@/lib/role-access";

/** Integrations UI is hidden — feeds auto-connect on boot and sign-in. */
export default function IntegrationsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    router.replace(workspaceHomePath(user?.role ?? "operational"));
  }, [user, router]);

  return null;
}
