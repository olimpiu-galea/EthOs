"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Radio, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MarginDesk } from "@/components/margin/margin-desk";
import { useAuthStore } from "@/stores/auth-store";
import { useCommodityStore } from "@/stores/commodity-store";
import { useSettingsStore } from "@/stores/settings-store";
import { canSeeFinancial, canSeeIntegrations } from "@/lib/role-access";
import { isCompanyFeedAvailable } from "@/lib/company-feed-visibility";

export default function FinancialPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const domain = useSettingsStore((s) => s.domain);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);
  const companyFeeds = useSettingsStore((s) => s.companyFeeds);
  const connected = useCommodityStore((s) => s.connected);
  const financialFeedEnabled = isCompanyFeedAvailable("commodity", {
    companyFeeds,
    phrase2Enabled: phase2Enabled,
  });

  useEffect(() => {
    if (domain !== "ethanol") {
      router.replace("/");
      return;
    }
    if (!phase2Enabled || !financialFeedEnabled) {
      router.replace("/playbooks");
      return;
    }
    if (user && !canSeeFinancial(user.role)) {
      router.replace("/procurement");
    }
  }, [domain, phase2Enabled, financialFeedEnabled, user, router]);

  if (domain !== "ethanol") return null;
  if (!phase2Enabled || !financialFeedEnabled) return null;
  if (user && !canSeeFinancial(user.role)) return null;

  if (!connected) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Financial
            </CardTitle>
            <CardDescription>
              {user && canSeeIntegrations(user.role)
                ? "Connect the Financial feed on Integrations to open this page."
                : "Financial feed is connecting… refresh in a moment."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && canSeeIntegrations(user.role) ? (
              <Button asChild className="gap-2">
                <Link href="/integrations">
                  Go to Integrations
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MarginDesk />;
}
