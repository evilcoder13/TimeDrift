import { auth } from "./auth";
import { isProActive } from "./rules";

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Returns current session or null (guest)
 */
export async function getCurrentSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

/**
 * Ensures user is authenticated; throws AuthError 401 UNAUTHORIZED if not.
 */
export async function requireAuth() {
  const session = await guards.getCurrentSession();
  if (!session?.user?.id) {
    throw new AuthError("Authentication required.", "UNAUTHORIZED", 401);
  }
  return session.user;
}

/**
 * Ensures user has an active Pro tier (R4/R9); throws AuthError 403 PRO_REQUIRED if not.
 */
export async function requirePro() {
  return await guards._requireProImpl();
}

async function _requireProImpl() {
  const user = await guards.requireAuth();
  if (!isProActive({ isPro: user.isPro, proUntil: user.proUntil })) {
    throw new AuthError(
      "Custom pairing and playlists require an active Pro subscription.",
      "PRO_REQUIRED",
      403
    );
  }
  return user;
}

/**
 * Ensures user has ADMIN role; throws AuthError 403 FORBIDDEN if not.
 */
export async function requireAdmin() {
  const user = await guards.requireAuth();
  if (user.role !== "ADMIN") {
    throw new AuthError("Administrative privileges required.", "FORBIDDEN", 403);
  }
  return user;
}

export const guards = {
  getCurrentSession,
  requireAuth,
  requirePro,
  _requireProImpl,
  requireAdmin,
};
