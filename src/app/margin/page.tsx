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
import { canSeeIntegrations, canSeeMarginDesk } from "@/lib/role-access";

export default function MarginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const domain = useSettingsStore((s) => s.domain);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);
  const connected = useCommodityStore((s) => s.connected);

  useEffect(() => {
    if (domain !== "ethanol") {
      router.replace("/");
      return;
    }
    if (!phase2Enabled) {
      router.replace("/playbooks");
      return;
    }
    if (user && !canSeeMarginDesk(user.role)) {
      router.replace("/inventory");
    }
  }, [domain, phase2Enabled, user, router]);

  if (domain !== "ethanol") return null;
  if (!phase2Enabled) return null;
  if (user && !canSeeMarginDesk(user.role)) return null;

  if (!connected) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Margin Desk
            </CardTitle>
            <CardDescription>
              {user && canSeeIntegrations(user.role)
                ? "Connect the Commodity Margin feed on Integrations to open the desk."
                : "Commodity margin feed is connecting… refresh in a moment."}
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
