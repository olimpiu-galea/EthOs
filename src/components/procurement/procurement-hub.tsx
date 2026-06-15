"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Package,
  Pencil,
  Plus,
  Radio,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  useInventoryItemsStore,
  type InventoryLedgerItem,
} from "@/stores/inventory-items-store";
import { useInventoryStore } from "@/stores/inventory-store";

const CATEGORIES = [
  "Feedstock",
  "Enzyme",
  "Biological",
  "Nutrient",
  "Additive",
  "CIP",
  "Recycle",
  "Other",
] as const;

const EMPTY_FORM = {
  name: "",
  category: "Other",
  sku: "",
  quantity: "",
  unit: "",
  reorderLevel: "",
  location: "",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

function itemToForm(item: InventoryLedgerItem): FormState {
  return {
    name: item.name,
    category: item.category,
    sku: item.sku,
    quantity: String(item.quantity),
    unit: item.unit,
    reorderLevel: String(item.reorderLevel),
    location: item.location,
    notes: item.notes,
  };
}

function parseForm(form: FormState): Omit<InventoryLedgerItem, "id" | "updatedAt"> | null {
  const quantity = Number(form.quantity);
  const reorderLevel = Number(form.reorderLevel);
  if (!form.name.trim() || !form.sku.trim() || Number.isNaN(quantity)) {
    return null;
  }
  return {
    name: form.name.trim(),
    category: form.category.trim() || "Other",
    sku: form.sku.trim(),
    quantity,
    unit: form.unit.trim() || "ea",
    reorderLevel: Number.isNaN(reorderLevel) ? 0 : reorderLevel,
    location: form.location.trim(),
    notes: form.notes.trim(),
  };
}

export function ProcurementHub() {
  const items = useInventoryItemsStore((s) => s.items);
  const addItem = useInventoryItemsStore((s) => s.addItem);
  const updateItem = useInventoryItemsStore((s) => s.updateItem);
  const replaceItem = useInventoryItemsStore((s) => s.replaceItem);
  const removeItem = useInventoryItemsStore((s) => s.removeItem);

  const feedConnected = useInventoryStore((s) => s.connected);
  const lastSync = useInventoryStore((s) => s.lastSync);

  const [dialogMode, setDialogMode] = useState<
    "add" | "edit" | "replace" | null
  >(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const lowStockCount = useMemo(
    () => items.filter((i) => i.quantity <= i.reorderLevel).length,
    [items],
  );

  function openAdd() {
    setForm(EMPTY_FORM);
    setActiveId(null);
    setDialogMode("add");
  }

  function openEdit(item: InventoryLedgerItem) {
    setForm(itemToForm(item));
    setActiveId(item.id);
    setDialogMode("edit");
  }

  function openReplace(item: InventoryLedgerItem) {
    setForm({ ...itemToForm(item), sku: `${item.sku}-NEW` });
    setActiveId(item.id);
    setDialogMode("replace");
  }

  function closeDialog() {
    setDialogMode(null);
    setActiveId(null);
    setForm(EMPTY_FORM);
  }

  function saveForm() {
    const parsed = parseForm(form);
    if (!parsed) return;

    if (dialogMode === "add") {
      addItem(parsed);
    } else if (dialogMode === "edit" && activeId) {
      updateItem(activeId, parsed);
    } else if (dialogMode === "replace" && activeId) {
      replaceItem(activeId, { ...parsed, id: activeId, updatedAt: Date.now() });
    }
    closeDialog();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-primary font-medium">
            Ethanol · Extras
          </p>
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Materials ledger — feedstock, enzymes, nutrients, and CIP supplies
            used across mash, fermentation, and utilities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {feedConnected && (
            <Badge variant="success" className="gap-1">
              <Radio className="h-3 w-3" />
              Procurement feed
            </Badge>
          )}
          {lowStockCount > 0 && (
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} below reorder
            </Badge>
          )}
          {lastSync && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Feed sync {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">SKU count</p>
            <p className="text-2xl font-bold tabular-nums">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-2xl font-bold tabular-nums">
              {new Set(items.map((i) => i.category)).size}
            </p>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-amber-500/30" : ""}>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Reorder alerts</p>
            <p className="text-2xl font-bold tabular-nums text-amber-400">
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Materials ledger</CardTitle>
            <CardDescription>
              Add, edit, or replace line items — evidenta stocuri plant
            </CardDescription>
          </div>
          <Button size="sm" className="gap-2 shrink-0" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add material
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="text-left py-2 pr-3">Material</th>
                <th className="text-left py-2 pr-3">SKU</th>
                <th className="text-left py-2 pr-3">Category</th>
                <th className="text-right py-2 pr-3">Qty</th>
                <th className="text-right py-2 pr-3">Reorder</th>
                <th className="text-left py-2 pr-3">Location</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const low = item.quantity <= item.reorderLevel;
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-border/40",
                      low && "bg-amber-500/5",
                    )}
                  >
                    <td className="py-3 pr-3">
                      <p className="font-medium">{item.name}</p>
                      {item.notes && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {item.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">{item.sku}</td>
                    <td className="py-3 pr-3">
                      <Badge variant="outline" className="text-[10px]">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums font-semibold">
                      {item.quantity.toLocaleString()} {item.unit}
                      {low && (
                        <span className="block text-[10px] text-amber-400 font-normal">
                          Low stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">
                      {item.reorderLevel} {item.unit}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground text-xs">
                      {item.location}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(item)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openReplace(item)}
                          title="Replace"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogMode != null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" && "Add material"}
              {dialogMode === "edit" && "Edit material"}
              {dialogMode === "replace" && "Replace material"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="gal, bu, kg…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reorder at</Label>
                <Input
                  type="number"
                  value={form.reorderLevel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reorderLevel: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={saveForm}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
