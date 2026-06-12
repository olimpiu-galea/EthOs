"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileBarChart,
  History,
  Send,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/auth-constants";
import {
  MARGIN_THRESHOLD,
  MARGIN_THRESHOLD_ALERT_ID,
  buildFmrFromMarginDesk,
  buildMarginAssignmentAlert,
  buildMarginThresholdAlert,
  createMarginDecision,
  decisionLabel,
  marginSnapshotFromTags,
  marginThresholdBreached,
  routedRolesForDecision,
} from "@/lib/margin-desk-actions";
import type { MarginDecisionType } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { useAuditStore } from "@/stores/audit-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import { useMarginDecisionsStore } from "@/stores/margin-decisions-store";
import { useReportsStore } from "@/stores/reports-store";
import { useCommodityStore } from "@/stores/commodity-store";
import { toast } from "@/components/ui/use-toast";

function formatDecisionTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MarginDecisionPanel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const connected = useCommodityStore((s) => s.connected);
  const tags = useCommodityStore((s) => s.tags);
  const lastSync = useCommodityStore((s) => s.lastSync);

  const addDecision = useMarginDecisionsStore((s) => s.addDecision);
  const linkReport = useMarginDecisionsStore((s) => s.linkReport);
  const linkAgendaAlert = useMarginDecisionsStore((s) => s.linkAgendaAlert);
  const recentDecisions = useMarginDecisionsStore((s) => s.recent);

  const upsertDeskAlert = useAlertHistoryStore((s) => s.upsertDeskAlert);
  const removeDeskAlert = useAlertHistoryStore((s) => s.removeDeskAlert);
  const auditLog = useAuditStore((s) => s.log);
  const createDocument = useReportsStore((s) => s.createDocument);

  const [pendingType, setPendingType] = useState<MarginDecisionType | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [loadoutApproved, setLoadoutApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const snapshot = useMemo(
    () => (connected && tags.length > 0 ? marginSnapshotFromTags(tags) : null),
    [connected, tags, lastSync],
  );

  const thresholdActive = snapshot ? marginThresholdBreached(snapshot) : false;

  useEffect(() => {
    if (!snapshot || !connected) {
      removeDeskAlert(MARGIN_THRESHOLD_ALERT_ID);
      return;
    }
    if (marginThresholdBreached(snapshot)) {
      upsertDeskAlert(
        MARGIN_THRESHOLD_ALERT_ID,
        buildMarginThresholdAlert(snapshot),
      );
    } else {
      removeDeskAlert(MARGIN_THRESHOLD_ALERT_ID);
    }
  }, [snapshot, connected, upsertDeskAlert, removeDeskAlert]);

  function openDecision(type: MarginDecisionType) {
    setPendingType(type);
    setNote("");
    setLoadoutApproved(type === "sell" && snapshot?.marketSignal === "SELL");
  }

  function closeDialog() {
    setPendingType(null);
    setNote("");
    setLoadoutApproved(false);
  }

  function recordDecision(openFmr: boolean) {
    if (!user || !snapshot || !pendingType) return;
    setSubmitting(true);
    try {
      const decision = createMarginDecision(pendingType, user, tags, {
        note,
        loadoutApproved,
      });
      addDecision(decision);

      const agendaId = `margin-assignment-${decision.id}`;
      upsertDeskAlert(agendaId, buildMarginAssignmentAlert(decision));
      linkAgendaAlert(decision.id, agendaId);

      auditLog({
        marginDecisionId: decision.id,
        action: `Margin decision: ${decision.type.toUpperCase()}`,
        actor: user.name,
        note: [
          `Routed to ${decision.routedTo.map((r) => ROLE_LABELS[r]).join(", ")}`,
          decision.type === "sell"
            ? `Loadout ${decision.loadoutApproved ? "approved" : "not approved"}`
            : null,
          decision.note,
        ]
          .filter(Boolean)
          .join(" · "),
      });

      let reportId: string | undefined;
      if (openFmr) {
        const fmr = buildFmrFromMarginDesk(tags, user, decision);
        reportId = createDocument(fmr);
        linkReport(decision.id, reportId);
        auditLog({
          marginDecisionId: decision.id,
          reportId,
          action: "FMR created from Margin Desk",
          actor: user.name,
        });
      }

      toast({
        title: `${decisionLabel(pendingType)} recorded`,
        description: `Sent to ${decision.routedTo.map((r) => ROLE_LABELS[r]).join(" & ")} with audit trail.`,
        href: openFmr && reportId ? `/reports?id=${reportId}` : "/agenda",
      });

      closeDialog();
      if (openFmr && reportId) {
        router.push(`/reports?id=${reportId}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openFmrOnly() {
    if (!user || !connected || tags.length === 0) return;
    const fmr = buildFmrFromMarginDesk(tags, user);
    const reportId = createDocument(fmr);
    auditLog({
      reportId,
      action: "FMR draft opened from Margin Desk",
      actor: user.name,
      note: "Pre-filled from live commodity snapshot",
    });
    router.push(`/reports?id=${reportId}`);
  }

  if (!connected) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Commercial decisions</CardTitle>
          <CardDescription>
            Connect the commodity feed to record sell/hold/hedge and route to
            procurement.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Commercial decisions
              </CardTitle>
              <CardDescription>
                Record sell / hold / hedge, approve loadout, route to
                procurement &amp; financial — with audit trail and optional FMR.
              </CardDescription>
            </div>
            {thresholdActive && (
              <Badge variant="warning" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                Threshold playbook active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {thresholdActive && snapshot && (
            <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-amber-200">
                Margin &lt; ${MARGIN_THRESHOLD.marginPerGalBelow.toFixed(2)}/gal
                and inventory &gt; {MARGIN_THRESHOLD.inventoryDaysAbove}d
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Financial playbook fired on Agenda — margin $
                {snapshot.marginPerGal.toFixed(2)}/gal ·{" "}
                {snapshot.inventoryDays.toFixed(1)} days supply.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              className="gap-2"
              onClick={() => openDecision("sell")}
            >
              <Send className="h-4 w-4" />
              Sell spot
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => openDecision("hold")}
            >
              Hold
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => openDecision("hedge")}
            >
              Hedge
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={openFmrOnly}
            >
              <FileBarChart className="h-4 w-4" />
              Open FMR (pre-filled)
            </Button>
          </div>

          {recentDecisions(5).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Recent decisions
              </p>
              <ul className="space-y-2">
                {recentDecisions(5).map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium capitalize">{d.type}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {d.actor} · {formatDecisionTime(d.at)}
                      </span>
                      {d.loadoutApproved && (
                        <Badge variant="success" className="ml-2 text-[9px]">
                          Loadout approved
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {d.reportId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            router.push(`/reports?id=${d.reportId}`)
                          }
                        >
                          FMR
                        </Button>
                      )}
                      {d.agendaAlertId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => router.push("/agenda")}
                        >
                          Agenda
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={pendingType != null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingType ? decisionLabel(pendingType) : "Decision"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Routes to{" "}
              {pendingType
                ? routedRolesForDecision(pendingType)
                    .filter((r) => r !== "supervisor")
                    .map((r) => ROLE_LABELS[r])
                    .join(" & ")
                : "—"}{" "}
              on Agenda with audit trail.
            </p>
            {pendingType === "sell" && (
              <label className="flex items-start gap-3 rounded-lg border border-border/60 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loadoutApproved}
                  onChange={(e) => setLoadoutApproved(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Approve spot loadout
                  </span>
                  <span className="text-muted-foreground text-xs block mt-1">
                    Authorizes procurement to schedule denatured product rack
                    loadout from surplus tanks.
                  </span>
                </span>
              </label>
            )}
            <div className="space-y-2">
              <Label htmlFor="decision-note">Note (optional)</Label>
              <textarea
                id="decision-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Rationale for desk / contract context…"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              disabled={submitting}
              onClick={() => recordDecision(false)}
            >
              <Send className="h-4 w-4" />
              Record &amp; route
            </Button>
            <Button
              className="gap-2"
              disabled={submitting}
              onClick={() => recordDecision(true)}
            >
              <FileBarChart className="h-4 w-4" />
              Record + FMR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
