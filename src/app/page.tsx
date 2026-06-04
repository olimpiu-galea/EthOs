import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Brain,
  Radio,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { FlowDiagram } from "@/components/home/flow-diagram";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 pb-16">
      <section className="space-y-6">
        <Badge variant="outline" className="text-primary border-primary/40">
          EthOS
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Turn live signals into{" "}
          <span className="text-primary">actionable playbooks</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Connect operational signal sources, define when alerts should fire,
          and review what happened today — built for teams who work with live
          plant and market data (DCS today; more sources soon).
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/integrations">
            <Radio className="h-5 w-5" />
            Connect signals
          </Link>
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <p className="text-muted-foreground max-w-2xl">
          A simple loop from signals to action: connect sources, set rules,
          respond on the agenda.
        </p>
        <FlowDiagram />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Data flow
            </CardTitle>
            <CardDescription>From signal source to operator</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-[11px] sm:text-xs leading-snug font-mono text-primary/90 bg-muted/40 rounded-lg p-4 overflow-hidden whitespace-pre-wrap break-words w-full">
{`Signals ──▶ Playbooks (rules) ──▶ Agenda (alerts)
    │              │                    │
 live feed     IF temp > 90         live + history
 ~60s refresh   THEN alert          latest 6 shown`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-amber-400" />
              Playbook logic
            </CardTitle>
            <CardDescription>Conditions that trigger alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Integrations</strong> connect
              signal sources and stream values (temperature, pressure, flow,
              etc.).
            </p>
            <p>
              <strong className="text-foreground">Playbooks</strong> combine
              one or more rules — e.g.{" "}
              <span className="font-mono text-primary/90">
                Reactor Temp &gt; 90 AND Pressure &lt; 2
              </span>
              — and link an alert.
            </p>
            <p>
              <strong className="text-foreground">Agenda</strong> lists when
              rules fired today, with completed vs active status.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI performance insights
          </h2>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Coming soon
          </Badge>
        </div>
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Beyond manual playbooks
            </CardTitle>
            <CardDescription className="text-base max-w-2xl">
              In addition to playbooks you create, request an AI analysis of
              historical performance. Get tailored playbook suggestions per user
              and category to improve outcomes on the metrics you care about.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-card/80 p-4 space-y-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p className="font-medium text-sm">Analyze trends</p>
                <p className="text-xs text-muted-foreground">
                  AI reviews signal history and playbook outcomes for your role
                  and plant area.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/80 p-4 space-y-2">
                <BookOpen className="h-5 w-5 text-amber-400" />
                <p className="font-medium text-sm">Suggest playbooks</p>
                <p className="text-xs text-muted-foreground">
                  Proposed rules with expected impact — you approve before they
                  go live.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/80 p-4 space-y-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <p className="font-medium text-sm">Category focus</p>
                <p className="text-xs text-muted-foreground">
                  Target a process category (Fermentation, Distillation, etc.)
                  for sharper recommendations.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Example suggestion
              </p>
              <p className="text-sm leading-relaxed">
                Based on <strong>Fermentation</strong> data for your site, AI
                recommends playbooks that could raise{" "}
                <strong>ethanol at drop</strong> by approximately{" "}
                <strong className="text-primary">+0.5%</strong> — e.g. tighter
                temperature bands on TE-3301, adjusted feed timing, and early
                warning on AG-2201 run status before excursions.
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                Suggested playbook · Fermentation · Goal: EtOH @ drop +0.5%
              </p>
            </div>

            <pre className="text-xs font-mono text-muted-foreground bg-muted/30 rounded-lg p-4 overflow-x-auto">
{`┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Your playbooks  │     │  AI analysis layer  │     │  New suggestions │
│  (manual rules)  │     │  performance + data │     │  per user/area   │
└────────┬─────────┘     └──────────┬──────────┘     └────────┬─────────┘
         │                            │                          │
         └────────────────────────────┴──────────────────────────┘
                              Deploy to Playbooks → Agenda`}
            </pre>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold">Ready to start?</p>
          <p className="text-sm text-muted-foreground">
            Connect a signal source under Integrations, then create your first
            playbook.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2 shrink-0">
          <Link href="/integrations">
            Go to Integrations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
