import { useAuth } from "@/lib/auth-context";

/**
 * Derives fine-grained permission flags from the current user's role.
 * No extra DB queries - role is already loaded by useAuth().
 *
 * Pass optional context (clientAms, assignedProspectAM) to check
 * assignment-scoped permissions.
 */
export function usePermissions(ctx?: {
  /** AM email list for a specific client (from client_account_managers) */
  clientAms?: string[];
  /** Single AM email assigned to a prospect */
  assignedProspectAM?: string | null;
}) {
  const { role, user } = useAuth();

  const email = user?.email ?? "";

  // Admin-tier: full write access everywhere
  const isAdminRole = role === "admin" || role === "account_executive";
  const isAM = role === "account_manager";
  const isClient = role === "client";

  // Assignment checks (AM + admin)
  const isAssignedToClient =
    isAdminRole || (isAM && (ctx?.clientAms ?? []).includes(email));
  const isAssignedToProspect =
    isAdminRole || (isAM && ctx?.assignedProspectAM === email);

  return {
    /** true for admin and account_executive */
    isAdminRole,
    isAM,
    isClient,

    /** Can create / delete clients */
    canCreateClient: isAdminRole,
    /** Can create prospects */
    canCreateProspect: isAdminRole || isAM,
    /** Can invite or remove Account Managers */
    canManageAMs: isAdminRole,
    /** Can toggle client's studio_access flag */
    canToggleStudioAccess: isAdminRole,
    /** Can manage per-feature Studio feature flags (admin and account_executive only) */
    canManageStudioFeatures: role === "admin" || role === "account_executive",

    /** Can submit / lock the Studio (client owner, assigned AM, or admin) */
    canSubmitStudio: isAssignedToClient || isClient,
    /** Can unlock studio design (assigned AM or admin) */
    canUnlockStudio: isAssignedToClient,

    /** Is this user assigned as AM to the given client? */
    isAssignedToClient,
    /** Is this user the AM assigned to the given prospect? */
    isAssignedToProspect,
  };
}
