import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { prisma } from "./db";

// Extend session user types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      isPro: boolean;
      proUntil: Date | null;
      locale: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    isPro?: boolean;
    proUntil?: Date | null;
    locale?: string;
  }
}

/**
 * Checks whether an email address is listed in process.env.ADMIN_EMAILS
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Works seamlessly across Edge & Node route handlers
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY || "dummy_resend_key",
      from: process.env.EMAIL_FROM || "TimeDrift <no-reply@timedrift.local>",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        const shouldBeAdmin = isAdminEmail(user.email);
        // Automatic promotion / role sync according to ADMIN_EMAILS
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existing) {
          const expectedRole = shouldBeAdmin ? "ADMIN" : existing.role === "ADMIN" ? "USER" : existing.role;
          if (existing.role !== expectedRole) {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: expectedRole },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        const email = user.email;
        const shouldBeAdmin = isAdminEmail(email);

        // Fetch fresh state from DB
        const dbUser = user.email
          ? await prisma.user.findUnique({
              where: { email: user.email },
            })
          : null;

        const role = shouldBeAdmin ? "ADMIN" : dbUser?.role || "USER";
        token.role = role;
        token.isPro = dbUser?.isPro ?? false;
        token.proUntil = dbUser?.proUntil ?? null;
        token.locale = dbUser?.locale ?? "en";
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || session.user.id;
        session.user.role = (token.role as "USER" | "ADMIN") || "USER";
        session.user.isPro = Boolean(token.isPro);
        session.user.proUntil = token.proUntil ? new Date(token.proUntil as string) : null;
        session.user.locale = (token.locale as string) || "en";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
