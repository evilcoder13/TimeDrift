import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/server/db";
import { getCurrentSession } from "@/server/guards";
import { isProActive } from "@/server/rules";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateTransferCode(): string {
  const bytes = crypto.randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `TDPRO${suffix}`;
}

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({
        authenticated: false,
        isPro: false,
      });
    }

    const user = session.user.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          include: {
            paymentTransactions: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        })
      : await prisma.user.findUnique({
          where: { email: session.user.email! },
          include: {
            paymentTransactions: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        });

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        isPro: false,
      });
    }

    let transferCode = user.proTransferCode;
    if (!transferCode) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateTransferCode();
        const existing = await prisma.user.findUnique({
          where: { proTransferCode: candidate },
        });
        if (!existing) {
          transferCode = candidate;
          await prisma.user.update({
            where: { id: user.id },
            data: { proTransferCode: candidate },
          });
          break;
        }
      }
    }

    const bankId = process.env.PAYMENT_BANK_ID || "MB";
    const accountNo = process.env.PAYMENT_ACCOUNT_NO || "0000000000";
    const accountName = process.env.PAYMENT_ACCOUNT_NAME || "TIMEDRIFT SANCTUARY";
    const amount = Number(process.env.PAYMENT_AMOUNT || 199000);
    const bankConfigured = Boolean(
      process.env.PAYMENT_ACCOUNT_NO && process.env.PAYMENT_ACCOUNT_NO !== "0000000000"
    );

    const qrImageUrl = `https://img.vietqr.io/image/${encodeURIComponent(
      bankId
    )}-${encodeURIComponent(accountNo)}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferCode || ""
    )}&accountName=${encodeURIComponent(accountName)}`;

    const proActive = isProActive({ isPro: user.isPro, proUntil: user.proUntil }) || user.role === "ADMIN";

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPro: proActive,
        proUntil: user.proUntil,
      },
      billing: {
        planName: "Lifetime Sanctuary Pass",
        amount,
        currency: "VND",
        transferCode,
        bankId,
        accountNo,
        accountName,
        bankConfigured,
        qrImageUrl,
        transactions: user.paymentTransactions,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load billing info";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
