"use client";

import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { DEFAULT_COMPANY, INDUSTRY_DOMAINS } from "@/lib/auth-constants";
import { resetLakeviewWorkspace } from "@/lib/reset-lakeview-workspace";
import {
  domainLabel,
  listUsersForCompany,
  roleLabel,
  seedCompanies,
} from "@/lib/company-registry";
import type { Company, IndustryDomain } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { toast } from "@/components/ui/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CompanyForm = {
  name: string;
  domain: IndustryDomain;
};

function emptyForm(): CompanyForm {
  return { name: "", domain: "ethanol" };
}

export function SettingsCompaniesPanel() {
  const companies = useAuthStore((s) => s.companies);
  const registeredUsers = useAuthStore((s) => s.users);
  const addCompany = useAuthStore((s) => s.addCompany);
  const updateCompany = useAuthStore((s) => s.updateCompany);
  const deleteCompany = useAuthStore((s) => s.deleteCompany);
  const activeCompanyId = useSettingsStore((s) => s.companyId);
  const applyCompany = useSettingsStore((s) => s.applyCompany);

  const allCompanies = useMemo(
    () => seedCompanies(companies),
    [companies],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);
  const [resettingLakeview, setResettingLakeview] = useState(false);
  const [form, setForm] = useState<CompanyForm>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setForm({ name: company.name, domain: company.domain });
    setDialogOpen(true);
  }

  function saveCompany() {
    const name = form.name.trim();
    if (!name) return;

    if (editing) {
      updateCompany(editing.id, { name, domain: form.domain });
      toast({
        title: "Company updated",
        description: `“${name}” was saved.`,
      });
    } else {
      addCompany({ name, domain: form.domain });
      toast({
        title: "Company added",
        description: `“${name}” is now on the platform.`,
      });
    }

    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm());
  }

  function confirmDelete() {
    if (!deleting) return;
    const name = deleting.name;
    deleteCompany(deleting.id);
    toast({
      title: "Company removed",
      description: `“${name}” and its registered users were deleted.`,
    });
    setDeleting(null);
  }

  async function confirmResetLakeview() {
    setResettingLakeview(true);
    try {
      await resetLakeviewWorkspace();
    } finally {
      setResettingLakeview(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Companies
              </CardTitle>
              <CardDescription>
                Manage tenant workspaces — domain, name, and team roster per
                company.
              </CardDescription>
            </div>
            <Button type="button" size="sm" className="gap-1.5 shrink-0" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Add company
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Company</th>
                  <th className="pb-3 pr-4 font-medium">Domain</th>
                  <th className="pb-3 pr-4 font-medium">Users</th>
                  <th className="pb-3 pr-4 font-medium">Workspace</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCompanies.map((company) => {
                  const userCount = listUsersForCompany(
                    company.id,
                    registeredUsers,
                  ).length;
                  const isActive = company.id === activeCompanyId;

                  return (
                    <tr
                      key={company.id}
                      className={cn(
                        "border-b border-border/40",
                        isActive && "bg-primary/5",
                      )}
                    >
                      <td className="py-3 pr-4 font-medium">{company.name}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {domainLabel(company.domain)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground tabular-nums">
                        {userCount}
                      </td>
                      <td className="py-3 pr-4">
                        {isActive ? (
                          <Badge variant="success" className="text-xs">
                            Current
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              applyCompany(
                                company.id,
                                company.name,
                                company.domain,
                              );
                              toast({
                                title: "Workspace switched",
                                description: `You are now viewing ${company.name}.`,
                              });
                            }}
                          >
                            Open
                          </Button>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {company.id === DEFAULT_COMPANY.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={resettingLakeview}
                              onClick={() => void confirmResetLakeview()}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(company)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {company.id !== DEFAULT_COMPANY.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleting(company)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit company" : "Add company"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Acme Ethanol"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry domain</Label>
              <Select
                value={form.domain}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    domain: value as IndustryDomain,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_DOMAINS.map((d) => (
                    <SelectItem key={d.id} value={d.id} disabled={!d.ready}>
                      {d.label}
                      {!d.ready ? " (soon)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editing && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Team on this company
                </p>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {listUsersForCompany(editing.id, registeredUsers).map(
                    (u) => (
                      <li
                        key={u.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="truncate">{u.name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {roleLabel(u.role)}
                        </Badge>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveCompany}
                disabled={!form.name.trim()}
              >
                {editing ? "Save changes" : "Add company"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete company?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            “{deleting?.name}” will be removed from the platform. Registered
            users on this company will also be deleted. Demo accounts are
            unaffected.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete company
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
