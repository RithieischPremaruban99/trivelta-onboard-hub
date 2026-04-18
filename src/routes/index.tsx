import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: IndexGateway,
});

function IndexGateway() {
  const { loading, user, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" suppressHydrationWarning>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (role === "admin") return <Navigate to="/admin" />;
  if (role === "account_manager") return <Navigate to="/dashboard" />;
  if (role === "client") return <Navigate to="/my-onboarding" />;

  // Authenticated but no role assigned
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="surface-card max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold">Awaiting access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is signed in but no role is assigned yet. Ask an admin to add{" "}
          <span className="font-mono text-foreground">{user.email}</span> to the access list.
        </p>
      </div>
    </div>
  );
}
