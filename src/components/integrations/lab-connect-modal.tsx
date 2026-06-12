"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  loadLabFixtureFields,
  type LabFieldSchema,
} from "@/lib/lab-sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (fields: LabFieldSchema[]) => void;
  loading?: boolean;
};

export function LabConnectModal({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: Props) {
  const [available, setAvailable] = useState<LabFieldSchema[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    void loadLabFixtureFields()
      .then((fields) => {
        setAvailable(fields);
        setSelected(new Set(fields.map((f) => f.id)));
      })
      .finally(() => setFetching(false));
  }, [open]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function confirm() {
    const fields = available.filter((f) => selected.has(f.id));
    if (fields.length === 0) return;
    onConfirm(fields);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-amber-400" />
            Map lab sheet structure
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select the columns your XLSX export will include. Future uploads must
          use the same <span className="font-mono text-xs">id</span> column
          names — values refresh on each upload.
        </p>
        {fetching ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Loading lab fields…
          </p>
        ) : (
          <ul className="max-h-64 overflow-y-auto rounded-lg border divide-y divide-border/60">
            {available.map((f) => {
              const on = selected.has(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => toggle(f.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                      on ? "bg-primary/10" : "hover:bg-muted/40",
                    )}
                  >
                    <span className="font-medium">{f.displayLabel}</span>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      {f.id}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={loading || fetching || selected.size === 0}
          >
            {loading ? "Connecting…" : "Connect lab sheet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
