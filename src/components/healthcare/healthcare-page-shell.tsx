"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HealthcarePageShell({
  title,
  description,
  icon: Icon,
  sections,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  sections: { title: string; rows: string[] }[];
}) {
  return (
    <div className="p-8 max-lg:p-4 max-w-6xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-primary font-medium">
          Healthcare · Extras
        </p>
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">{description}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Card key={n} className="border-dashed border-border/70">
            <CardContent className="pt-5 space-y-2">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-8 w-24 rounded bg-muted/60 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.map((section) => (
        <Card key={section.title} className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {section.rows.map((row) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-lg border border-dashed border-border/50 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{row}</span>
                <div className="h-5 w-16 rounded bg-muted/50" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-center text-muted-foreground">
        Layout preview · medcompany — connect clinical feeds to populate
      </p>
    </div>
  );
}
