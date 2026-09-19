import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  MessageSquare,
  Route as RouteIcon,
  Search,
  Settings,
  Sparkles,
  Target,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/useMe";
import { cn } from "@/lib/utils";

const employeeNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "My profile", icon: UserRound },
  { to: "/talent-discovery", label: "Talent discovery", icon: Sparkles },
  { to: "/roles", label: "Internal roles", icon: Compass },
  { to: "/skill-gaps", label: "Skill gaps", icon: Target },
  { to: "/career-roadmap", label: "Career roadmap", icon: RouteIcon },
  { to: "/learning", label: "Learning", icon: GraduationCap },
  { to: "/career-assistant", label: "Career AI", icon: MessageSquare },
] as const;

const hrNav = [
  { to: "/hr", label: "Workforce overview", icon: BarChart3 },
  { to: "/hr/talent-search", label: "Talent search", icon: Search },
  { to: "/hr/skills", label: "Skill intelligence", icon: Users },
  { to: "/hr/skill-gaps", label: "Organisation gaps", icon: Target },
  { to: "/hr/internal-mobility", label: "Internal mobility", icon: Compass },
  { to: "/hr/emerging-skills", label: "Emerging skills", icon: LineChart },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      <div className="space-y-1">
        <p className="eyebrow px-3 pb-1">My career</p>
        {employeeNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          >
            <item.icon aria-hidden className="size-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {me?.isStaff ? (
        <div className="space-y-1">
          <p className="eyebrow px-3 pb-1">HR intelligence</p>
          {hrNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            >
              <item.icon aria-hidden className="size-4" />
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-auto space-y-1 border-t border-sidebar-border pt-3">
        <Link
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
        >
          <Settings aria-hidden className="size-4" />
          Settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut aria-hidden className="size-4" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        {nav}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-panel">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="mr-3 rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-bar sticky top-0 z-30 flex h-14 items-center gap-3 px-4 lg:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
          >
            <Menu aria-hidden className="size-4" />
          </button>
          <p className="truncate text-sm text-muted-foreground">
            {me ? (
              <>
                <span className="font-medium text-foreground">{me.employee.name}</span>
                {me.employee.job_title ? ` · ${me.employee.job_title}` : ""}
                {me.isStaff ? " · HR access" : ""}
              </>
            ) : null}
          </p>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex h-14 items-center gap-2 px-5">
      <span className={cn("grid size-7 place-items-center rounded-md bg-primary text-primary-foreground")}>
        <Sparkles aria-hidden className="size-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight">TalentIQ</span>
    </div>
  );
}
