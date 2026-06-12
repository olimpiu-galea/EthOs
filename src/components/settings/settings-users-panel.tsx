"use client";

import { Plus, UserPlus } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth-constants";
import {
  listUsersForCompany,
  roleLabel,
} from "@/lib/company-registry";
import type { UserRole } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const INVITE_ROLES: UserRole[] = [
  "company_admin",
  "supervisor",
  "financial",
  "operational",
  "maintenance",
  "qa_lab",
  "procurement",
];

type Props = {
  companyId: string;
  companyName: string;
};

export function SettingsUsersPanel({ companyId, companyName }: Props) {
  const registeredUsers = useAuthStore((s) => s.users);
  const users = listUsersForCompany(companyId, registeredUsers);

  return (
    <div className="relative space-y-6">
      <div
        className="absolute inset-0 z-10 rounded-lg bg-background/40 backdrop-blur-[1px]"
        aria-hidden
      />
      <Badge
        variant="secondary"
        className="absolute right-4 top-4 z-20 text-[10px] uppercase tracking-wide"
      >
        Coming soon
      </Badge>

      <Card className={cn("opacity-55 saturate-50")}>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>
            Users with access to {companyName}. Invites and role changes will
            be enabled in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/40"
                  >
                    <td className="py-3 pr-4 font-medium">{u.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="text-xs">
                        {roleLabel(u.role)}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant="success" className="text-xs">
                        Active
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("opacity-55 saturate-50")}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite user
              </CardTitle>
              <CardDescription className="mt-1">
                Send an email invite and assign a workspace role.
              </CardDescription>
            </div>
            <Button type="button" size="sm" className="gap-1.5 shrink-0" disabled>
              <Plus className="h-3.5 w-3.5" />
              Send invite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input placeholder="Jordan Lee" disabled />
          </div>
          <div className="space-y-2">
            <Label>Work email</Label>
            <Input placeholder="jordan@company.com" disabled />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Role</Label>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Supervisor" />
              </SelectTrigger>
              <SelectContent>
                {INVITE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
