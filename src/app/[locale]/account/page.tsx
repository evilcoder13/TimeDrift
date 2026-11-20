import React from "react";
import { getCurrentSession } from "@/server/guards";
import { prisma } from "@/server/db";
import { isProActive } from "@/server/rules";
import { AccountClient } from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getCurrentSession();

  let initialUser = null;
  if (session?.user?.id || session?.user?.email) {
    const dbUser = session.user.id
      ? await prisma.user.findUnique({ where: { id: session.user.id } })
      : await prisma.user.findUnique({ where: { email: session.user.email! } });

    if (dbUser) {
      initialUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        isPro: isProActive({ isPro: dbUser.isPro, proUntil: dbUser.proUntil }) || dbUser.role === "ADMIN",
        proUntil: dbUser.proUntil ? dbUser.proUntil.toISOString() : null,
      };
    }
  }

  return <AccountClient locale={locale} initialUser={initialUser} />;
}
