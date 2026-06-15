"use client";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { FlowDiagram } from "@/components/home/flow-diagram";
import { LandingHeader } from "@/components/home/landing-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_NAME, PRODUCT_SCOPE } from "@/lib/brand";
import { useAuthStore } from "@/stores/auth-store";
import { LoggedInDashboard } from "@/components/home/logged-in-dashboard";

function GuestHome() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />

      <div className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-8 pb-12">
        <section className="space-y-4 pt-2">
          <Badge variant="outline" className="border-border text-foreground">
            Lakeview Ethanol · Demo
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight max-w-2xl">
            Plant signals → playbooks → action
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            {PRODUCT_NAME} connects live plant feeds to role-specific alerts and
            workspace pages for operations, compliance, procurement, maintenance,
            and finance. {PRODUCT_SCOPE}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" disabled>
              <UserPlus className="h-4 w-4" />
              Create account
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Overview</h2>
          <FlowDiagram />
        </section>

        <p className="text-sm text-muted-foreground text-center pb-2">
          Demo sign-in: Company Admin, Supervisor, or Operations Specialist at
          Lakeview.
        </p>
      </div>
    </div>
  );
}

export function HomePageContent() {
  const user = useAuthStore((s) => s.user);
  if (user) return <LoggedInDashboard user={user} />;
  return <GuestHome />;
}
