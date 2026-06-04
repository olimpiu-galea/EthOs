"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Droplets,
  Gauge,
  Radio,
  Sparkles,
  Thermometer,
  Wind,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDcsStore } from "@/stores/dcs-store";
import { numericValue } from "@/lib/dcs-parser";

type LiveMap = Record<string, string>;

const MOCK_LIVE: LiveMap = {
  "TE-3301": "87.4",
  "TE-3302": "42.1",
  "PT-2200": "8.12",
  "PT-1102": "2.35",
  "LT-4401": "67.8",
  "LT-4402": "41.2",
  "FT-2200": "124.5",
  "DO-7701": "6.8",
  "PH-7702": "7.1",
  "AG-2201": "RUN",
  "XV-3300": "OPEN",
  "CV-5501": "72",
};

function SensorTag({
  label,
  value,
  unit,
  status = "ok",
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  status?: "ok" | "warn" | "alarm";
  className?: string;
}) {
  const colors = {
    ok: "border-primary/40 bg-primary/5 text-primary shadow-[0_0_20px_-6px_hsl(var(--primary)/0.5)]",
    warn: "border-amber-400/50 bg-amber-500/10 text-amber-300 shadow-[0_0_20px_-6px_rgba(251,191,36,0.4)]",
    alarm:
      "border-red-400/50 bg-red-500/10 text-red-300 shadow-[0_0_20px_-6px_rgba(248,113,113,0.4)]",
  };

  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-1.5 backdrop-blur-md min-w-[88px]",
        colors[status],
        className,
      )}
    >
      <p className="text-[9px] uppercase tracking-widest opacity-70 font-medium">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums leading-tight">
        {value}
        {unit && (
          <span className="text-[10px] font-normal opacity-80 ml-0.5">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function ValveIndicator({
  id,
  state,
  x,
  y,
}: {
  id: string;
  state: string;
  x: number;
  y: number;
}) {
  const open = state === "OPEN" || Number(state) > 50;
  const pct = state === "OPEN" ? 100 : state === "CLOSED" ? 0 : Number(state);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle
        r="14"
        className={cn(
          "fill-card/80 stroke-2",
          open ? "stroke-primary" : "stroke-muted-foreground/50",
        )}
      />
      <path
        d="M-8 0 L8 0 M0 -8 L0 8"
        className={cn(
          "stroke-2",
          open ? "stroke-primary" : "stroke-muted-foreground/40",
        )}
      />
      <text
        y="28"
        textAnchor="middle"
        className="fill-[10px] font-mono font-medium fill-muted-foreground"
      >
        {id}
      </text>
      <text
        y="40"
        textAnchor="middle"
        className="fill-[9px] font-bold fill-primary"
      >
        {state === "OPEN" || state === "CLOSED"
          ? state
          : `${pct}%`}
      </text>
    </g>
  );
}

function DigitalLed({
  label,
  on,
  x,
  y,
}: {
  label: string;
  on: boolean;
  x: number;
  y: number;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="-36"
        y="-10"
        width="72"
        height="20"
        rx="4"
        className="fill-card/60 stroke border-border/60"
      />
      <circle
        cx="-22"
        cy="0"
        r="5"
        className={on ? "fill-emerald-400" : "fill-muted-foreground/30"}
      />
      <text
        x="4"
        y="4"
        className="fill-[9px] font-mono font-semibold fill-foreground"
      >
        {label}
      </text>
    </g>
  );
}

export function DcsOverview2030() {
  const connected = useDcsStore((s) => s.connected);
  const tags = useDcsStore((s) => s.tags);

  const live = useMemo(() => {
    const map = { ...MOCK_LIVE };
    if (!connected || tags.length === 0) return map;

    const pick = (idPart: string, fallback: string) => {
      const t = tags.find((x) => x.id.includes(idPart));
      if (!t) return fallback;
      if (t.fieldType.toLowerCase().includes("digital")) {
        return numericValue(t.value) === 1 ? "RUN" : "STOP";
      }
      return String(numericValue(t.value));
    };

    map["TE-3301"] = pick("TE-3301", map["TE-3301"]);
    map["PT-2200"] = pick("PT-2200", map["PT-2200"]);
    map["LT-4401"] = pick("LT-4401", map["LT-4401"]);
    map["DO-7701"] = pick("DO-7701", map["DO-7701"]);
    map["AG-2201"] = tags.find((x) => x.id.includes("AG-2201") && x.id.includes("Run"))
      ? pick("AG-2201/_.Run", map["AG-2201"])
      : map["AG-2201"];
    map["XV-3300"] = tags.find((x) => x.id.includes("XV-3300"))
      ? numericValue(
          tags.find((x) => x.id.includes("XV-3300"))!.value,
        ) === 1
        ? "OPEN"
        : "CLOSED"
      : map["XV-3300"];
    map["CV-5501"] = pick("PV-5501", map["CV-5501"]);

    return map;
  }, [connected, tags]);

  const tempWarn = Number(live["TE-3301"]) > 90;

  return (
    <div className="relative min-h-[calc(100vh-0px)] flex flex-col bg-[#060a12] overflow-hidden">
      {/* Grid & ambient */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.08) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-primary/20 bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/15 p-2 ring-1 ring-primary/30">
            <Gauge className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-medium">
              Process overview · 2030 HMI
            </p>
            <h1 className="text-xl font-bold tracking-tight">
              Fermentation train — full plant schematic
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Batch FRM-2847 · Fermentation
          </Badge>
          <Badge
            variant={connected ? "success" : "secondary"}
            className="gap-1"
          >
            <Radio className="h-3 w-3" />
            {connected ? "Live sync" : "Demo values"}
          </Badge>
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/40">
            Coming soon
          </Badge>
        </div>
      </header>

      {/* Main schematic */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6 min-h-0">
        <div className="relative w-full max-w-6xl aspect-[16/10] max-h-[calc(100vh-220px)]">
          <svg
            viewBox="0 0 960 540"
            className="w-full h-full drop-shadow-[0_0_40px_hsl(var(--primary)/0.15)]"
            aria-label="Fermentation process overview"
          >
            <defs>
              <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Pipes */}
            <path
              d="M 120 270 H 200 L 240 270"
              fill="none"
              stroke="url(#pipeGrad)"
              strokeWidth="3"
              strokeDasharray="8 4"
              className="animate-pulse"
            />
            <path
              d="M 400 270 H 520 L 560 270"
              fill="none"
              stroke="url(#pipeGrad)"
              strokeWidth="3"
              strokeDasharray="8 4"
            />
            <path
              d="M 720 270 H 800"
              fill="none"
              stroke="url(#pipeGrad)"
              strokeWidth="3"
              strokeDasharray="8 4"
            />
            <path
              d="M 300 200 L 300 120 L 480 120 L 480 200"
              fill="none"
              stroke="hsl(var(--primary) / 0.35)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Feed tank T-4401 */}
            <g filter="url(#glow)">
              <rect
                x="60"
                y="180"
                width="80"
                height="180"
                rx="8"
                className="fill-card/40 stroke-primary/50"
                strokeWidth="2"
              />
              <rect
                x="68"
                y={360 - Number(live["LT-4401"]) * 1.4}
                width="64"
                height={Number(live["LT-4401"]) * 1.4}
                rx="4"
                className="fill-primary/25"
              />
              <text
                x="100"
                y="165"
                textAnchor="middle"
                className="fill-xs font-bold fill-foreground text-[11px]"
              >
                T-4401 Feed
              </text>
            </g>

            {/* Fermentor R-2201 */}
            <g filter="url(#glow)">
              <ellipse
                cx="360"
                cy="300"
                rx="70"
                ry="100"
                className="fill-card/50 stroke-primary stroke-[2.5]"
              />
              <ellipse
                cx="360"
                cy="280"
                rx="55"
                ry="20"
                className="fill-primary/10 stroke-primary/40"
              />
              <line
                x1="360"
                y1="200"
                x2="360"
                y2="160"
                className="stroke-primary/60"
                strokeWidth="2"
              />
              <circle
                cx="360"
                cy="155"
                r="12"
                className="fill-muted/50 stroke-primary/50"
              />
              <text
                x="360"
                y="125"
                textAnchor="middle"
                className="fill-[12px] font-bold fill-primary"
              >
                R-2201
              </text>
              <text
                x="360"
                y="420"
                textAnchor="middle"
                className="fill-[10px] fill-muted-foreground"
              >
                Primary fermentor
              </text>
            </g>

            {/* Harvest / transfer T-4402 */}
            <g filter="url(#glow)">
              <rect
                x="780"
                y="200"
                width="70"
                height="140"
                rx="8"
                className="fill-card/40 stroke-emerald-500/40"
                strokeWidth="2"
              />
              <rect
                x="788"
                y={340 - Number(live["LT-4402"]) * 1.2}
                width="54"
                height={Number(live["LT-4402"]) * 1.2}
                rx="4"
                className="fill-emerald-500/20"
              />
              <text
                x="815"
                y="185"
                textAnchor="middle"
                className="fill-[11px] font-bold fill-foreground"
              >
                T-4402
              </text>
              <text
                x="815"
                y="365"
                textAnchor="middle"
                className="fill-[9px] fill-muted-foreground"
              >
                Harvest
              </text>
            </g>

            {/* Jacket ring */}
            <ellipse
              cx="360"
              cy="300"
              rx="85"
              ry="108"
              fill="none"
              className="stroke-cyan-500/20 stroke-1 stroke-dasharray-4 6"
            />

            <ValveIndicator id="XV-3300" state={live["XV-3300"]} x={220} y={270} />
            <ValveIndicator id="CV-5501" state={live["CV-5501"]} x={480} y={270} />
            <ValveIndicator id="XV-4420" state="CLOSED" x={700} y={270} />

            <DigitalLed
              label={live["AG-2201"] === "RUN" ? "AG-2201 RUN" : "AG-2201 STOP"}
              on={live["AG-2201"] === "RUN"}
              x={360}
              y={95}
            />
            <DigitalLed label="BATCH ACTIVE" on x={480} y={95} />
          </svg>

          {/* Floating sensor panels — point 3 style */}
          <SensorTag
            label="TE-3301 PV"
            value={live["TE-3301"]}
            unit="°C"
            status={tempWarn ? "warn" : "ok"}
            className="absolute left-[38%] top-[18%]"
          />
          <SensorTag
            label="PT-2200"
            value={live["PT-2200"]}
            unit="bar"
            className="absolute left-[32%] top-[42%]"
          />
          <SensorTag
            label="DO-7701"
            value={live["DO-7701"]}
            unit="mg/L"
            className="absolute left-[42%] top-[55%]"
          />
          <SensorTag
            label="pH-7702"
            value={live["PH-7702"]}
            unit=""
            className="absolute left-[48%] top-[68%]"
          />
          <SensorTag
            label="LT-4401"
            value={live["LT-4401"]}
            unit="%"
            className="absolute left-[6%] top-[38%]"
          />
          <SensorTag
            label="FT-2200"
            value={live["FT-2200"]}
            unit="m³/h"
            className="absolute left-[22%] top-[48%]"
          />
          <SensorTag
            label="PT-1102"
            value={live["PT-1102"]}
            unit="bar"
            className="absolute left-[48%] top-[8%]"
          />
          <SensorTag
            label="LT-4402"
            value={live["LT-4402"]}
            unit="%"
            className="absolute right-[4%] top-[42%]"
          />
        </div>

        {/* Coming soon panel */}
        <div className="absolute inset-x-4 bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 z-20 max-w-lg w-full sm:w-auto">
          <div className="rounded-2xl border border-violet-400/30 bg-card/80 backdrop-blur-xl p-5 shadow-2xl shadow-violet-950/40 text-center space-y-3">
            <div className="flex justify-center">
              <Sparkles className="h-6 w-6 text-violet-400" />
            </div>
            <p className="text-lg font-semibold tracking-tight">
              Interactive DCS — coming soon
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Full operator HMI: click vessels for faceplates, trend stacks,
              valve control, tank switchover, and live drill-down on every
              sensor. This overview shows how the whole fermentation train
              will be represented in one screen.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/25">
                Tank switchover
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/25">
                Valve states
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/25">
                Analog + digital IO
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2 mt-2">
              <Link href="/integrations">
                Signal sources today
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Alarm strip — point 1 footer style */}
      <footer className="relative z-10 border-t border-primary/20 bg-card/40 backdrop-blur-md px-4 py-2 flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          Active alarms
        </span>
        <span className="text-amber-400/90 font-mono">
          TE-3301 HI — approaching SP
        </span>
        <span className="text-muted-foreground/60">|</span>
        <span className="text-muted-foreground font-mono">
          Area summary: 0 critical
        </span>
        <span className="ml-auto flex items-center gap-3 text-muted-foreground">
          <Thermometer className="h-3.5 w-3.5" />
          Jacket
          <Wind className="h-3.5 w-3.5" />
          Aeration
          <Droplets className="h-3.5 w-3.5" />
          Feed
        </span>
      </footer>
    </div>
  );
}
