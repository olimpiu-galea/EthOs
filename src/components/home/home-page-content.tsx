"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  FileBarChart,
  Layers,
  LogIn,
  Radio,
  Shield,
  Sparkles,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { FlowDiagram } from "@/components/home/flow-diagram";
import { LandingHeader } from "@/components/home/landing-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { LoggedInDashboard } from "@/components/home/logged-in-dashboard";

function GuestHome() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-12 pb-16">
        <section className="space-y-6 pt-4">
          <Badge variant="outline" className="text-primary border-primary/40">
            Lakeview Ethanol · Demo
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Turn live signals into{" "}
            <span className="text-primary">actionable playbooks</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            SignalRelay connects your plant data — DCS, lab sheets, and commodity
            margins — to playbooks that fire role-specific alerts. Operators,
            finance, and supervisors each get the agenda they need.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                <UserPlus className="h-5 w-5" />
                Create account
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/login">
                <LogIn className="h-5 w-5" />
                Sign in
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <p className="text-muted-foreground max-w-2xl">
            A full loop from signal to action — built for ethanol operations,
            adaptable to any industry domain.
          </p>
          <FlowDiagram />
        </section>

        <FeatureCards />

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                End-to-end flow
              </CardTitle>
              <CardDescription>What happens after you sign up</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Pick your role and industry domain (Ethanol, Healthcare…)</li>
                <li>Connect signal sources on Integrations</li>
                <li>Create playbooks — manual or AI-generated</li>
                <li>Alerts land on your agenda with action items</li>
                <li>Reference alerts in Reports and track batches</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-amber-400" />
                Roles & agendas
              </CardTitle>
              <CardDescription>Everyone sees what matters to them</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Operational</strong> — daily
                plant alerts on fermentation, temps, lab flags
              </p>
              <p>
                <strong className="text-foreground">Financial</strong> — margin,
                surplus, sell/hold signals from commodity feed
              </p>
              <p>
                <strong className="text-foreground">Supervisor</strong> — all
                agendas filtered by team
              </p>
              <p>
                <strong className="text-foreground">Company Admin</strong> —
                settings, domains, report templates
              </p>
            </CardContent>
          </Card>
        </section>

        <AiSection />

        <section className="rounded-xl border border-primary/30 bg-primary/5 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xl font-semibold">Ready to explore?</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Create a free demo account for Lakeview Ethanol, or sign in with a
              demo role (password: <code className="text-primary">demo</code>).
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {
          icon: Radio,
          title: "Integrations",
          desc: "DCS, Lab Sheet (XLSX), Commodity Margin feed",
        },
        {
          icon: BookOpen,
          title: "Playbooks",
          desc: "Rules, AI generate, premium suggestions",
        },
        {
          icon: CalendarDays,
          title: "Agenda",
          desc: "Hourly scheduler, operational vs financial",
        },
        {
          icon: FileBarChart,
          title: "Reports",
          desc: "Documents linked to alerts and batches",
        },
      ].map(({ icon: Icon, title, desc }) => (
        <Card key={title}>
          <CardContent className="pt-6 space-y-2">
            <Icon className="h-5 w-5 text-primary" />
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function AiSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI & Signal team
        </h2>
        <Badge className="bg-primary/20 text-primary border-primary/30">
          Demo mock
        </Badge>
      </div>
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/5">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smarter playbooks, less manual work
          </CardTitle>
          <CardDescription className="text-base max-w-2xl">
            Generate playbooks from a plain-English description, activate premium
            playbooks, or ask the Signal team to build custom rules for Lakeview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-card/80 p-4 space-y-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className="font-medium text-sm">Commodity margin feed</p>
              <p className="text-xs text-muted-foreground">
                Surplus gallons, contract coverage, market sell signal
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/80 p-4 space-y-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              <p className="font-medium text-sm">Premium playbooks</p>
              <p className="text-xs text-muted-foreground">
                Curated rules — activate with one click (demo pricing)
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/80 p-4 space-y-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <p className="font-medium text-sm">Signal team analysis</p>
              <p className="text-xs text-muted-foreground">
                Request a custom playbook built for your site
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function HomePageContent() {
  const user = useAuthStore((s) => s.user);
  if (user) return <LoggedInDashboard user={user} />;
  return <GuestHome />;
}
