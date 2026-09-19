import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useMe } from "@/hooks/useMe";
import { Skeleton } from "@/components/ui/skeleton";

/** Renders HR-only content, with a clear message for employees. RLS and the
 *  server functions enforce the real boundary; this is the UI half. */
export function StaffGuard({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!me?.isStaff) {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <p className="text-sm font-semibold">HR access required</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Workforce intelligence is limited to HR and admin accounts. Your own talent profile is
          available on your dashboard.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
