import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Integrations",
    subtitle: "Connect sources",
    desc: "Stream live signals (DCS and more, over time).",
    color: "border-primary/40 bg-primary/10",
  },
  {
    title: "Playbooks",
    subtitle: "Define rules",
    desc: "Pick signals, set conditions, assign alerts.",
    color: "border-amber-500/30 bg-amber-500/10",
  },
  {
    title: "Agenda",
    subtitle: "Act on alerts",
    desc: "Latest 6 triggers · live updates.",
    color: "border-emerald-500/30 bg-emerald-500/10",
  },
];

export function FlowDiagram() {
  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-3 lg:gap-2">
      {steps.map((step, i) => (
        <div key={step.title} className="flex flex-1 items-center gap-2 min-w-0">
          <div
            className={cn(
              "flex-1 rounded-xl border p-5 space-y-2 min-h-[140px]",
              step.color,
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Step {i + 1}
            </p>
            <p className="text-lg font-bold">{step.title}</p>
            <p className="text-sm text-primary/90 font-medium">{step.subtitle}</p>
            <p className="text-sm text-muted-foreground">{step.desc}</p>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="hidden lg:block h-6 w-6 text-muted-foreground shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
