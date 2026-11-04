import { auth } from "../../auth";
import { ChatSDKError } from "../lib/errors";
import { db } from "../db";
import { member, user, chatbot } from "../db/schema";
import { eq, and } from "drizzle-orm";

export async function getSessionFromRequest(request: Request): Promise<any> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (session && session.user) {
      const sessObj = session as any;
      // Ensure activeOrganizationId and activeChatbotId are resolved from user membership if not present
      if (!sessObj.session.activeOrganizationId && sessObj.user.id) {
        try {
          const membership = await db.query.member.findFirst({
            where: eq(member.userId, sessObj.user.id),
          });
          if (membership) {
            sessObj.session.activeOrganizationId = membership.organizationId;
            const bot = await db.query.chatbot.findFirst({
              where: eq(chatbot.organizationId, membership.organizationId),
            });
            if (bot) {
              sessObj.session.activeChatbotId = bot.id;
            }
          }
        } catch (resolveErr) {
          console.warn("[auth] Failed to resolve active membership:", resolveErr);
        }
      } else if (sessObj.session.activeOrganizationId && !sessObj.session.activeChatbotId) {
        try {
          const bot = await db.query.chatbot.findFirst({
            where: eq(chatbot.organizationId, sessObj.session.activeOrganizationId),
          });
          if (bot) {
            sessObj.session.activeChatbotId = bot.id;
          }
        } catch (resolveBotErr) {
          console.warn("[auth] Failed to resolve active chatbot:", resolveBotErr);
        }
      }
      return sessObj;
    }
  } catch (err) {
    // Session token invalid or expired
  }

  return null;
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
export function isSuperAdmin(userRecord: { id?: string; email?: string; role?: string }): boolean {
  if (!userRecord || !userRecord.email) return false;

  // 1. Check user.role from DB
  if (userRecord.role === "superadmin") return true;

  // 2. Check SUPERADMIN_EMAILS configured in environment
  const superadminEmails = (process.env.SUPERADMIN_EMAILS || "founder@nzoai.com,admin@nzoai.com")
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

  let isSuper = isSuperAdmin(session.user);

  // If not yet verified, check DB user row
  if (!isSuper && session.user.id) {
    try {
      const dbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });
      if (dbUser) {
        isSuper = isSuperAdmin({
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        });
      }
    } catch (err) {
      // In dev fallback, allow if email matches default founder
      if (session.user.email === "founder@nzoai.com") {
        isSuper = true;
      }
    }
  }

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

  try {
    // Find membership in active organization
    const membership = await db.query.member.findFirst({
      where: and(eq(member.userId, session.user.id), eq(member.organizationId, orgId)),
    });

    if (membership) {
      if (!allowedRoles.includes(membership.role as any)) {
        throw new ChatSDKError(
          "forbidden:insufficient_role",
          `Forbidden: Your role (${membership.role}) does not have permission for this action. Required: ${allowedRoles.join(" or ")}`,
          403
        );
      }
      return { session, member: membership };
    }
  } catch (err) {
    // In dev fallback mode grant owner access
    if (session.isDevFallback) {
      return {
        session,
        member: { role: "owner", userId: session.user.id, organizationId: orgId },
      };
    }
  }

  throw new ChatSDKError(
    "forbidden:membership",
    "Forbidden: You are not a member of this organization",
    403
  );
}
