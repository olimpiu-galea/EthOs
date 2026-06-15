"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  canManageSettings,
  isPlatformAdmin,
} from "@/lib/auth-constants";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { SettingsGeneralPanel } from "@/components/settings/settings-general-panel";
import { SettingsUsersPanel } from "@/components/settings/settings-users-panel";
import { SettingsCompaniesPanel } from "@/components/settings/settings-companies-panel";
import { SettingsFeaturesPanel } from "@/components/settings/settings-features-panel";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "features" | "users" | "companies";

function tabFromParam(value: string | null): SettingsTab | null {
  if (
    value === "general" ||
    value === "features" ||
    value === "users" ||
    value === "companies"
  ) {
    return value;
  }
  return null;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const companyId = useSettingsStore((s) => s.companyId);
  const companyName = useSettingsStore((s) => s.companyName);
  const platformAdmin = user ? isPlatformAdmin(user.role) : false;

  const tabs = useMemo(() => {
    const items: { id: SettingsTab; label: string }[] = [
      { id: "general", label: "General" },
      { id: "features", label: "Features" },
      { id: "users", label: "Users" },
    ];
    if (platformAdmin) {
      items.push({ id: "companies", label: "Companies" });
    }
    return items;
  }, [platformAdmin]);

  const [activeTab, setActiveTab] = useState<SettingsTab>(
    () => tabFromParam(searchParams.get("tab")) ?? "general",
  );

  useEffect(() => {
    const tab = tabFromParam(searchParams.get("tab"));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (user && !canManageSettings(user.role)) {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!platformAdmin && activeTab === "companies") {
      setActiveTab("general");
    }
  }, [platformAdmin, activeTab]);

  if (!user || !canManageSettings(user.role)) return null;

  return (
    <div className="p-8 max-lg:p-4 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Workspace configuration, team access, and platform tenants
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "text-sm rounded-full px-4 py-1.5 border transition-colors -mb-px",
              activeTab === tab.id
                ? "border-primary bg-primary/15 text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && <SettingsGeneralPanel />}

      {activeTab === "features" && <SettingsFeaturesPanel />}

      {activeTab === "users" && (
        <SettingsUsersPanel companyId={companyId} companyName={companyName} />
      )}

      {activeTab === "companies" && platformAdmin && <SettingsCompaniesPanel />}
    </div>
  );
}
