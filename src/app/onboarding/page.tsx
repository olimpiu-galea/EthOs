"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  PlugZap,
  Radio,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { FEED_LABELS } from "@/lib/company-features";
import { domainAccentLabel } from "@/lib/domain-config";
import type { SignalSource } from "@/lib/types";
import { cn } from "@/lib/utils";

const PHASE2_FEEDS: SignalSource[] = ["commodity", "inventory"];

const STEPS = [
  { id: 1, title: "Features", icon: Sparkles },
  { id: 2, title: "Signal feeds", icon: PlugZap },
  { id: 3, title: "Playbooks", icon: BookOpen },
  { id: 4, title: "Agenda", icon: Radio },
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const domain = useSettingsStore((s) => s.domain);
  const companyName = useSettingsStore((s) => s.companyName);
  const companyFeeds = useSettingsStore((s) => s.companyFeeds);
  const phrase2 = useSettingsStore((s) => s.operationsSuiteEnabled);
  const toggleCompanyFeed = useSettingsStore((s) => s.toggleCompanyFeed);
  const [step, setStep] = useState(1);

  const enabledFeeds = useMemo(
    () =>
      (Object.keys(FEED_LABELS) as SignalSource[]).filter(
        (feed) =>
          companyFeeds[feed] &&
          (!PHASE2_FEEDS.includes(feed) || phrase2),
      ),
    [companyFeeds, phrase2],
  );

  const anyFeedEnabled = enabledFeeds.length > 0;

  function finishOnboarding() {
    completeOnboarding();
    router.push("/agenda");
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-primary font-medium">Getting started</p>
          <h1 className="text-3xl font-bold">
            Welcome{user ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground">
            <strong>{companyName}</strong> · {domainAccentLabel(domain)} — enable
            feeds, connect sources, build playbooks, then watch alerts on the
            Agenda.
          </p>
        </header>

        <div className="flex gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex-1 h-1.5 rounded-full",
                step >= s.id ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1 — Enable signal feeds</CardTitle>
              <CardDescription>
                Signal feeds are enabled by default for this workspace. Turn off
                any source you do not need — enabled feeds connect automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(FEED_LABELS) as SignalSource[]).map((feed) => {
                const meta = FEED_LABELS[feed];
                const needsPhrase2 = PHASE2_FEEDS.includes(feed);
                const locked = needsPhrase2 && !phrase2;
                const enabled = companyFeeds[feed] && !locked;

                return (
                  <div
                    key={feed}
                    className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{meta.label}</span>
                        {needsPhrase2 && (
                          <Badge variant="outline" className="text-[10px]">
                            Phrase 2
                          </Badge>
                        )}
                        {locked && (
                          <Badge variant="secondary" className="text-[10px]">
                            Requires Phrase 2
                          </Badge>
                        )}
                        {enabled && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-emerald-500/40 text-emerald-400"
                          >
                            Enabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {meta.description}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      disabled={locked}
                      onCheckedChange={() => toggleCompanyFeed(feed)}
                      aria-label={`Toggle ${meta.label}`}
                    />
                  </div>
                );
              })}
              <Button
                onClick={() => setStep(2)}
                disabled={!anyFeedEnabled}
                className="gap-2 mt-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 — Signal feeds</CardTitle>
              <CardDescription>
                Enabled feeds connect automatically when you sign in. Specialists
                only see data from feeds you have turned on for the company.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/20 px-4 py-3 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Enabled for your company
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {enabledFeeds.map((feed) => (
                    <Badge key={feed} variant="outline" className="text-xs">
                      {FEED_LABELS[feed].label}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                DCS, Lab Sheet, and Phrase 2 feeds connect in the background —
                no manual setup required.
              </p>
              <Button onClick={() => setStep(3)} className="gap-2 mt-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3 — Create your first playbook</CardTitle>
              <CardDescription>
                Open Playbooks and define when alerts should fire — manually or
                with AI. Assign a team so the right people see it on Agenda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Try: &quot;Alert when fermentation temp exceeds 92°F for 30
                minutes&quot; — the AI generator builds conditions from your
                connected tags.
              </p>
              <Button onClick={() => setStep(4)} className="gap-2 mt-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>Step 4 — Watch your Agenda</CardTitle>
              <CardDescription>
                Active playbooks evaluate connected signals and land alerts on
                the time-based agenda for each assigned team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Setup overview complete. Open the Agenda to see team alerts.
              </div>
              <Button onClick={finishOnboarding} className="gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
