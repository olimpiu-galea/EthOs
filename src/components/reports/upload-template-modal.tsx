"use client";

import { FileUp, Sparkles, Upload } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/brand";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UploadTemplateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UploadTemplateModal({
  open,
  onOpenChange,
}: UploadTemplateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upload as template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Upload an existing operations document — DOR, shift handover, batch
            record, or any plant report. {PRODUCT_NAME} AI will read the structure,
            extract sections and fields, and save a reusable template in your
            workspace so you can create new reports from it later.
          </p>

          <ol className="space-y-2 rounded-lg border bg-muted/20 p-4 list-decimal list-inside text-muted-foreground">
            <li>Choose a PDF, Word, or Excel file from your plant</li>
            <li>AI maps headings, tables, and signature blocks to fields</li>
            <li>Template appears under Reports and in Settings → templates</li>
          </ol>

          <div
            className={cn(
              "relative rounded-xl border-2 border-dashed border-border/80 bg-muted/15 p-8 text-center",
              "opacity-60 saturate-75",
            )}
          >
            <Badge
              variant="secondary"
              className="absolute right-3 top-3 text-[10px] uppercase tracking-wide"
            >
              Coming soon
            </Badge>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileUp className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium text-foreground">Drop a document here</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOCX, or XLSX · max 25 MB
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              disabled
            >
              <Upload className="h-4 w-4" />
              Choose file
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="button" className="gap-2" disabled>
              <Upload className="h-4 w-4" />
              Upload &amp; generate template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
