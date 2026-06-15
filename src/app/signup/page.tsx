"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, UserPlus } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/brand";
import { EthOsWordmark } from "@/components/brand/ethos-wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { INDUSTRY_DOMAINS } from "@/lib/auth-constants";
import type { IndustryDomain } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState<IndustryDomain>("ethanol");
  const [error, setError] = useState("");

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (
      !name.trim() ||
      !email.trim() ||
      !companyName.trim() ||
      password.length < 3
    ) {
      setError("Fill in all fields (password min 3 characters).");
      return;
    }
    if (!signup({ name, email, password, companyName, domain })) {
      setError("Email already registered.");
      return;
    }
    router.push("/onboarding");
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
            Register your company on {PRODUCT_NAME} — you&apos;ll be the Company Admin
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Each signup creates a new company workspace. You manage settings,
              domain, and invite team members later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    className="pl-9"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Lakeview Energy"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Lee"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Industry domain</Label>
                <p className="text-xs text-muted-foreground">
                  Sets Extras pages for your company
                </p>
                <div className="grid gap-2">
                  {INDUSTRY_DOMAINS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      disabled={!d.ready}
                      onClick={() => setDomain(d.id)}
                      className={cn(
                        "rounded-lg border px-4 py-3 text-left transition-colors",
                        domain === d.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30",
                        !d.ready && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <p className="font-medium text-sm">{d.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.description}
                        {!d.ready && " · Coming soon"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                You will be assigned as{" "}
                <strong className="text-primary">Company Admin</strong> for this
                workspace.
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Create company & account
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
