import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

/**
 * Fire-and-forget audit log entry.
 * Caller must pass actorEmail + actorRole (already available from useAuth()).
 */
export function logActivity({
  actorEmail,
  actorRole,
  clientId,
  action,
  details,
}: {
  actorEmail: string;
  actorRole: string;
  clientId?: string | null;
  action: string;
  details?: Record<string, unknown>;
}): void {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    db.from("client_activity_log")
      .insert({
        client_id: clientId ?? null,
        actor_user_id: user.id,
        actor_email: actorEmail,
        actor_role: actorRole,
        action,
        details: details ?? {},
      })
      .then(() => {});
  });
}
