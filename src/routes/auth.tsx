import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TalentIQ" },
      {
        name: "description",
        content: "Sign in to TalentIQ to discover capabilities, internal roles and career paths.",
      },
      { property: "og:title", content: "Sign in — TalentIQ" },
      {
        property: "og:description",
        content: "Access your talent intelligence workspace.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [desiredRole, setDesiredRole] = useState<"employee" | "hr">("employee");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              job_title: jobTitle,
              department,
              desired_role: desiredRole,
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in didn't complete. Try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden flex-col justify-between border-r border-border bg-surface p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles aria-hidden className="size-4" />
          </span>
          <span className="text-sm font-semibold">TalentIQ</span>
        </Link>
        <div className="max-w-md space-y-5">
          <h2 className="text-3xl font-semibold leading-tight">
            Discover what your people can actually do.
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A job title rarely tells the whole story. TalentIQ combines projects, achievements,
            learning history and an adaptive interview to surface potential capabilities — always
            with the evidence behind them.
          </p>
          <ol className="space-y-2 text-sm font-medium">
            <li>1. Discover explicit skills and hidden capability</li>
            <li>2. Match people to internal roles</li>
            <li>3. Develop against real skill gaps</li>
            <li>4. Grow along an evidence-based path</li>
          </ol>
        </div>
        <p className="text-xs text-muted-foreground">
          Insights are described as potential capability, never proof of talent.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold">
            {mode === "signin" ? "Sign in to TalentIQ" : "Create your TalentIQ account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Continue to your talent intelligence workspace."
              : "Set up your profile, then run your first discovery session."}
          </p>

          {checkEmail ? (
            <div className="panel mt-6 p-5 text-sm">
              <p className="font-medium">Confirm your email</p>
              <p className="mt-2 text-muted-foreground">
                We sent a confirmation link to {email}. Open it to finish creating your account,
                then sign in here.
              </p>
              <Button className="mt-4 w-full" variant="outline" onClick={() => { setCheckEmail(false); setMode("signin"); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Full name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="jobTitle">Job title</Label>
                        <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Developer" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Workspace access</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["employee", "hr"] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setDesiredRole(option)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                              desiredRole === option
                                ? "border-primary bg-primary-soft text-primary-soft-foreground"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            {option === "employee" ? "Employee" : "HR / Admin"}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        HR access adds the workforce intelligence sections.
                      </p>
                    </div>
                  </>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogle}>
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New to TalentIQ?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
