"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/auth-constants";
import { listTeamAssignableUsers } from "@/lib/company-registry";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { OpsTeam } from "@/lib/teams";
import { agendaLensesForTeams, enabledTeams } from "@/lib/teams";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function emptyTeamDraft(): Omit<OpsTeam, "id"> {
  return {
    name: "",
    description: "",
    enabled: true,
    memberUserIds: [],
  };
}

export function SettingsFeaturesPanel() {
  const companyId = useSettingsStore((s) => s.companyId);
  const teams = useSettingsStore((s) => s.teams);
  const addTeam = useSettingsStore((s) => s.addTeam);
  const updateTeam = useSettingsStore((s) => s.updateTeam);
  const deleteTeam = useSettingsStore((s) => s.deleteTeam);
  const toggleTeamEnabled = useSettingsStore((s) => s.toggleTeamEnabled);
  const registeredUsers = useAuthStore((s) => s.users);

  const assignableUsers = useMemo(
    () => listTeamAssignableUsers(companyId, registeredUsers),
    [companyId, registeredUsers],
  );
  const assignableUserIds = useMemo(
    () => new Set(assignableUsers.map((u) => u.id)),
    [assignableUsers],
  );
  const activeTeams = useMemo(() => enabledTeams(teams), [teams]);
  const agendaLenses = useMemo(() => agendaLensesForTeams(teams), [teams]);

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamDraft, setTeamDraft] = useState(emptyTeamDraft());
  const [memberSearch, setMemberSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return assignableUsers;
    return assignableUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        ROLE_LABELS[u.role].toLowerCase().includes(q),
    );
  }, [assignableUsers, memberSearch]);

  function openCreateTeam() {
    setEditingTeamId(null);
    setTeamDraft(emptyTeamDraft());
    setMemberSearch("");
    setTeamDialogOpen(true);
  }

  function openEditTeam(team: OpsTeam) {
    setEditingTeamId(team.id);
    setTeamDraft({
      name: team.name,
      description: team.description ?? "",
      enabled: team.enabled,
      memberUserIds: team.memberUserIds.filter((id) => assignableUserIds.has(id)),
    });
    setMemberSearch("");
    setTeamDialogOpen(true);
  }

  function toggleMemberUser(userId: string) {
    setTeamDraft((d) => {
      const on = d.memberUserIds.includes(userId);
      const next = on
        ? d.memberUserIds.filter((id) => id !== userId)
        : [...d.memberUserIds, userId];
      return { ...d, memberUserIds: next };
    });
  }

  function saveTeam() {
    if (!teamDraft.name.trim() || !teamDraft.memberUserIds.length) return;
    const payload = {
      name: teamDraft.name.trim(),
      description: teamDraft.description?.trim() || undefined,
      enabled: teamDraft.enabled,
      memberUserIds: teamDraft.memberUserIds.filter((id) =>
        assignableUserIds.has(id),
      ),
    };
    if (editingTeamId) {
      updateTeam(editingTeamId, payload);
    } else {
      addTeam(payload);
    }
    setTeamDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teams (Agenda)
            </CardTitle>
            <CardDescription>
              Create teams, add members, and enable the ones in use. Playbooks
              assign to enabled teams; members see that team&apos;s alerts.
            </CardDescription>
          </div>
          <Button size="sm" className="gap-1.5 shrink-0" onClick={openCreateTeam}>
            <Plus className="h-3.5 w-3.5" />
            New team
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {teams.length === 0 && (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center">
              No teams yet. Create your first team so playbooks can be routed
              on the Agenda.
            </p>
          )}
          {teams.map((team) => {
            const members = team.memberUserIds
              .map((id) => assignableUsers.find((u) => u.id === id))
              .filter((u): u is NonNullable<typeof u> => Boolean(u));
            return (
              <div
                key={team.id}
                className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{team.name}</p>
                    {!team.enabled && (
                      <Badge variant="secondary" className="text-[10px]">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  {team.description && (
                    <p className="text-xs text-muted-foreground">
                      {team.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {members.length > 0 ? (
                      members.map((member) => (
                        <Badge
                          key={member.id}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {member.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No members
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Switch
                    checked={team.enabled}
                    onCheckedChange={() => toggleTeamEnabled(team.id)}
                    aria-label={`Toggle ${team.name}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditTeam(team)}
                    aria-label={`Edit ${team.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteTeam(team.id)}
                    aria-label={`Delete ${team.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          <div className="rounded-lg border border-dashed bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              Agenda team lens ({activeTeams.length} enabled)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {agendaLenses.map((lens) => (
                <Badge key={lens.id} variant="outline" className="text-xs">
                  {lens.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-5 border-b border-border/60 bg-muted/15 text-left">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </span>
              <span>{editingTeamId ? "Edit team" : "Create team"}</span>
            </DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed pl-[3.25rem]">
              Name the team, choose who receives its alerts, and enable it when
              ready for playbooks and the Agenda lens.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                  id="team-name"
                  value={teamDraft.name}
                  onChange={(e) =>
                    setTeamDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="e.g. Night shift operations"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-desc">Description (optional)</Label>
                <Input
                  id="team-desc"
                  value={teamDraft.description ?? ""}
                  onChange={(e) =>
                    setTeamDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Who this team covers on the floor"
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/10 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">Team enabled</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When on, this team appears in playbook assignment and the
                  Agenda lens.
                </p>
              </div>
              <Switch
                checked={teamDraft.enabled}
                onCheckedChange={(enabled) =>
                  setTeamDraft((d) => ({ ...d, enabled }))
                }
                aria-label="Team enabled"
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <Label>Members</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    People who see this team&apos;s alerts on the Agenda.
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {teamDraft.memberUserIds.length} selected
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search by name, email, or role…"
                  className="h-10 pl-9 bg-background"
                />
              </div>

              <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/5">
                <div className="max-h-[min(22rem,40vh)] overflow-y-auto divide-y divide-border/50">
                  {filteredUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground px-4 py-10 text-center">
                      No users match your search.
                    </p>
                  )}
                  {filteredUsers.map((user) => {
                    const selected = teamDraft.memberUserIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleMemberUser(user.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          selected
                            ? "bg-primary/10 hover:bg-primary/15"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {userInitials(user.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium truncate">
                            {user.name}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0 hidden sm:inline-flex"
                        >
                          {ROLE_LABELS[user.role]}
                        </Badge>
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30 bg-background",
                          )}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/10 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              {teamDraft.memberUserIds.length === 0
                ? "Select at least one member to continue"
                : `${teamDraft.memberUserIds.length} member${teamDraft.memberUserIds.length === 1 ? "" : "s"} will receive alerts`}
            </p>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => setTeamDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveTeam}
                disabled={
                  !teamDraft.name.trim() || !teamDraft.memberUserIds.length
                }
              >
                {editingTeamId ? "Save changes" : "Create team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
