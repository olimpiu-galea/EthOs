"use client";

import Link from "next/link";
import { countActiveBatches } from "@/lib/batch-context";
import { useSettingsStore } from "@/stores/settings-store";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActiveBatchesStatCardProps = {
  className?: string;
};

export function ActiveBatchesStatCard({ className }: ActiveBatchesStatCardProps) {
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);
  const count = countActiveBatches();

  const content = (
    <>
      <p className="text-2xl font-bold tabular-nums">{count}</p>
      <p className="text-sm text-muted-foreground">Active batches</p>
    </>
  );

  if (phase2Enabled) {
    return (
      <Link href="/operational" className={cn("block h-full", className)}>
        <Card className="h-full transition-colors hover:border-primary/35 hover:bg-muted/20 cursor-pointer">
          <CardContent className="pt-5 pb-4">{content}</CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-5 pb-4">{content}</CardContent>
    </Card>
  );
}
