import {
  ArrowDown,
  ArrowRight,
  Layers,
  Package,
  ShieldCheck,
  Sparkles,
  Wallet,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Integrations",
    subtitle: "Connect feeds",
    desc: "DCS, Lab Sheet, Financial, and Procurement.",
    color: "border-primary/40 bg-primary/10",
  },
  {
    title: "Playbooks",
    subtitle: "Define rules",
    desc: "Conditions, teams, action items, AI drafts.",
    color: "border-amber-500/30 bg-amber-500/10",
  },
  {
    title: "Agenda",
    subtitle: "Act on alerts",
    desc: "Role timeline, per-alert copilot, handover.",
    color: "border-emerald-500/30 bg-emerald-500/10",
  },
  {
    title: "Reports",
    subtitle: "Close the loop",
    desc: "FMR, feed snapshots, batch references.",
    color: "border-violet-500/30 bg-violet-500/10",
  },
] as const;

const workspaces = [
  { label: "Operational", icon: Layers, desc: "Batches · lab · DCS" },
  { label: "Compliance", icon: ShieldCheck, desc: "Deviations · posture" },
  { label: "Procurement", icon: Package, desc: "PO · suppliers" },
  { label: "Maintenance", icon: Wrench, desc: "Spare parts · assets" },
  { label: "Financial", icon: Wallet, desc: "Margin · sell/hold" },
] as const;

export function FlowDiagram() {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/15 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col xl:flex-row items-stretch gap-3 xl:gap-2">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-1 items-center gap-2 min-w-0">
            <div
              className={cn(
                "flex-1 rounded-xl border p-4 sm:p-5 space-y-1.5 min-h-[120px]",
                step.color,
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Step {i + 1}
              </p>
              <p className="text-base sm:text-lg font-bold">{step.title}</p>
              <p className="text-xs sm:text-sm text-primary/90 font-medium">
                {step.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden xl:block h-5 w-5 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <ArrowDown className="h-5 w-5 text-primary/50" />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
          Plant workspaces
        </p>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {workspaces.map(({ label, icon: Icon, desc }) => (
            <div
              key={label}
              className="rounded-lg border border-border/70 bg-card/80 px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs font-semibold">{label}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p>
          Also: <strong className="text-foreground font-medium">Plant Copilot</strong>{" "}
          (demo), playbook AI generate, premium catalog, Settings for feeds & teams.
        </p>
      </div>
    </div>
  );
}
