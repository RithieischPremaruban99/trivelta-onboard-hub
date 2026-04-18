import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/15 ring-1 ring-primary/30 grid place-items-center">
                <span className="font-mono text-xs text-primary">T</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Trivelta</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Onboarding Hub
                </div>
              </div>
            </Link>
            {role && (
              <nav className="flex items-center gap-1">
                {(role === "admin" || role === "account_manager") && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    activeProps={{ className: "bg-accent text-foreground" }}
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                )}
                {role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    activeProps={{ className: "bg-accent text-foreground" }}
                  >
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Link>
                )}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="text-right leading-tight">
                  <div className="text-xs">{user.email}</div>
                  {role && (
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
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
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
