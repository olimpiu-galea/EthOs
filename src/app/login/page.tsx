"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn } from "lucide-react";
import { EthOsWordmark } from "@/components/brand/ethos-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { DEMO_ACCOUNTS, DEFAULT_COMPANY } from "@/lib/auth-constants";
import { workspaceHomePath } from "@/lib/role-access";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const demoAccounts = DEMO_ACCOUNTS.filter(
    (a) => a.companyId === DEFAULT_COMPANY.id,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

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

  function fillDemoEmail(accountEmail: string) {
    setEmail(accountEmail);
    setError("");
    passwordRef.current?.focus();
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="absolute top-6 left-6 gap-2 text-muted-foreground"
      >
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <EthOsWordmark size="lg" />
          </div>
          <p className="text-muted-foreground">
            Sign in to {DEFAULT_COMPANY.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>{DEFAULT_COMPANY.name} · demo environment</CardDescription>
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
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  ref={passwordRef}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="off"
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
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-muted-foreground"
                disabled
              >
                Create account
              </Button>
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Quick demo accounts
          </p>
          <div className="grid gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => fillDemoEmail(a.email)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-left",
                  "hover:border-primary/50 hover:bg-primary/5 transition-colors",
                  email === a.email && "border-primary/50 bg-primary/5",
                )}
              >
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
                <span className="text-xs text-primary">Use email</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
