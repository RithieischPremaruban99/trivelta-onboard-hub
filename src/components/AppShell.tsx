import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { TriveltaNav } from "@/components/TriveltaNav";
import { StageHeader, type Stage } from "@/components/StageHeader";
import { DEFAULT_ADMIN_FILTERS } from "@/components/admin/AdminFilterBar";
import { AdminMenu } from "@/components/AdminMenu";

export function AppShell({
  children,
  badge,
  stage,
}: {
  children: React.ReactNode;
  badge?: string;
  stage?: Stage;
}) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const navRight = (
    <div className="flex items-center gap-3">
      {role && (
        <nav className="hidden items-center gap-1 sm:flex">
          {(role === "admin" ||
            role === "account_manager" ||
            role === "account_executive") && (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}
          {(role === "admin" || role === "account_executive") && (
            <Link
              to="/admin"
              search={DEFAULT_ADMIN_FILTERS}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>
      )}
      {(role === "admin" || role === "account_executive") && <AdminMenu />}
      {user && (
        <>
          <div className="text-right leading-tight">
            <div className="text-xs text-foreground">{user.email}</div>
            {role && (
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {role.replace("_", " ")}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {stage ? (
        <StageHeader stage={stage} rightContent={navRight} />
      ) : (
        <TriveltaNav
          product="Suite"
          badge={badge}
          right={navRight}
        />
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
