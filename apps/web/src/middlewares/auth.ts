import { auth } from "../../auth";
import { ChatSDKError } from "../lib/errors";
import { db } from "../db";
import { member, user } from "../db/schema";
import { eq, and } from "drizzle-orm";

export async function getSessionFromRequest(request: Request): Promise<any> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session as any;
  } catch (err) {
    return null;
  }
}

export async function requireAuthSession(request: Request): Promise<any> {
  const session = await getSessionFromRequest(request);
  if (!session || !session.user) {
    throw new ChatSDKError("unauthorized:session", "Unauthorized: Valid session required", 401);
  }
  return session;
}

/**
 * Checks whether a user possesses the global Superadmin privilege.
 * Can be granted via the database user.role column or via the SUPERADMIN_EMAILS environment variable.
 */
export function isSuperAdmin(userRecord: { id: string; email: string; role?: string }): boolean {
  if (!userRecord || !userRecord.email) return false;

  // 1. Check user.role from DB
  if (userRecord.role === "superadmin") return true;

  // 2. Check SUPERADMIN_EMAILS configured in environment
  const superadminEmails = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (superadminEmails.includes(userRecord.email.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Middleware ensuring the requester has platform-level Superadmin authority.
 */
export async function requireSuperAdmin(request: Request): Promise<any> {
  const session = await requireAuthSession(request);

  // Fetch full user record to check role
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  const isSuper = isSuperAdmin({
    id: session.user.id,
    email: session.user.email,
    role: dbUser?.role || session.user.role,
  });

  if (!isSuper) {
    throw new ChatSDKError(
      "forbidden:superadmin",
      "Forbidden: Platform Superadmin credentials required.",
      403
    );
  }

  return { ...session, isSuperAdmin: true };
}

/**
 * Middleware enforcing tenant-level Role-Based Access Control (RBAC).
 * Allowed roles: 'owner' | 'admin' | 'member'. Superadmins bypass this check.
 */
export async function requireOrgRole(
  request: Request,
  allowedRoles: Array<"owner" | "admin" | "member">
): Promise<{ session: any; member: any }> {
  const session = await requireAuthSession(request);
  const orgId = session.session.activeOrganizationId;

  if (!orgId) {
    throw new ChatSDKError("unauthorized:organization", "No active organization selected", 400);
  }

  // Superadmins bypass tenant role restrictions
  if (isSuperAdmin(session.user)) {
    return {
      session,
      member: { role: "owner", userId: session.user.id, organizationId: orgId },
    };
  }

  // Find membership in active organization
  const membership = await db.query.member.findFirst({
    where: and(eq(member.userId, session.user.id), eq(member.organizationId, orgId)),
  });

  if (!membership) {
    throw new ChatSDKError(
      "forbidden:membership",
      "Forbidden: You are not a member of this organization",
      403
    );
  }

  if (!allowedRoles.includes(membership.role as any)) {
    throw new ChatSDKError(
      "forbidden:insufficient_role",
      `Forbidden: Your role (${membership.role}) does not have permission for this action. Required: ${allowedRoles.join(" or ")}`,
      403
    );
  }

  return { session, member: membership };
}
