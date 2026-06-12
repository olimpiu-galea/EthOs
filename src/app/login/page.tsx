"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { demoAccountsForPhase } from "@/lib/auth-constants";
import { OperationsSuiteToggle } from "@/components/operations-suite-toggle";
import { useSettingsStore } from "@/stores/settings-store";
import { workspaceHomePath } from "@/lib/role-access";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);
  const demoAccounts = demoAccountsForPhase(phase2Enabled);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!login(email, password)) {
      setError("Invalid email or password. Try a demo account below.");
      return;
    }
    const { user: u, onboardingComplete } = useAuthStore.getState();
    router.push(
      !onboardingComplete
        ? "/onboarding"
        : workspaceHomePath(u?.role ?? "operational"),
    );
  }

  function quickDemo(accountId: string) {
    loginAsDemo(accountId);
    const { user: u, onboardingComplete } = useAuthStore.getState();
    router.push(
      !onboardingComplete
        ? "/onboarding"
        : workspaceHomePath(u?.role ?? "operational"),
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md px-6 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 shrink-0">
            <ArrowRightLeft className="h-7 w-7 text-primary" />
            <span className="font-semibold tracking-tight">
              Signal<span className="text-primary">Relay</span>
            </span>
          </Link>
          <OperationsSuiteToggle variant="inline" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Sign in to your operations workspace</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Lakeview Ethanol · demo environment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@lakeview.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              New here?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Quick demo accounts · password: demo
          </p>
          {!phase2Enabled && (
            <p className="text-[15px] text-muted-foreground text-center leading-relaxed">
              Phase 1 roles only — turn on Phrase 2 for financial &amp;
              procurement demos.
            </p>
          )}
          <div className="grid gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => quickDemo(a.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-left",
                  "hover:border-primary/50 hover:bg-primary/5 transition-colors",
                )}
              >
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
                <span className="text-xs text-primary">Enter →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
