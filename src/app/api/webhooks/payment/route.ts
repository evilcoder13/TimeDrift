import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

const CODE_REGEX = /TDPRO[A-Z0-9]{4,12}/gi;

function extractWebhookSecret(req: Request, url: URL, bodyObj: Record<string, unknown>): string {
  const headerSecret = req.headers.get("x-webhook-secret");
  if (headerSecret) return headerSecret.trim();

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^(?:Bearer|Apikey|Token)\s+(.+)$/i);
    if (match) return match[1].trim();
    return authHeader.trim();
  }

  const querySecret = url.searchParams.get("secret") || url.searchParams.get("token");
  if (querySecret) return querySecret.trim();

  if (typeof bodyObj.secret === "string") return bodyObj.secret.trim();
  if (typeof bodyObj.token === "string") return bodyObj.token.trim();

  return "";
}

function collectTextFromPayload(url: URL, rawText: string, bodyObj: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const key of ["note", "description", "content", "message", "text", "body", "title", "subText", "bigText", "addInfo"]) {
    const qVal = url.searchParams.get(key);
    if (qVal) parts.push(qVal);
    const bVal = bodyObj[key];
    if (typeof bVal === "string") parts.push(bVal);
  }

  if (rawText) {
    parts.push(rawText);
  }

  return parts.join(" | ");
}

function extractAmount(url: URL, bodyObj: Record<string, unknown>, combinedText: string): number | null {
  const qAmount = url.searchParams.get("amount") || url.searchParams.get("transferAmount");
  if (qAmount) {
    const parsed = Number(String(qAmount).replace(/[^0-9]/g, ""));
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  for (const key of ["amount", "transferAmount", "money", "value"]) {
    const val = bodyObj[key];
    if (typeof val === "number" && val > 0) return Math.round(val);
    if (typeof val === "string") {
      const parsed = Number(val.replace(/[^0-9]/g, ""));
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  }

  // Optional extraction from Vietnamese bank notification pattern e.g. +199,000VND or +199.000d
  const bankAmtMatch = combinedText.match(/\+?\s*([1-9][0-9]{1,3}(?:[.,][0-9]{3})+)\s*(?:VND|VNĐ|đ|d\b)/i);
  if (bankAmtMatch) {
    const digits = Number(bankAmtMatch[1].replace(/[.,]/g, ""));
    if (!Number.isNaN(digits) && digits > 0) return digits;
  }

  return null;
}

async function handlePaymentWebhook(req: Request) {
  try {
    const url = new URL(req.url);
    let rawText = "";
    let bodyObj: Record<string, unknown> = {};

    if (req.method === "POST" || req.method === "PUT") {
      rawText = await req.text().catch(() => "");
      if (rawText) {
        try {
          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed === "object") {
            bodyObj = parsed as Record<string, unknown>;
          }
        } catch {
          // Handle form-urlencoded or plain text notification
          const params = new URLSearchParams(rawText);
          params.forEach((v, k) => {
            bodyObj[k] = v;
          });
        }
      }
    }

    const configuredSecret = (process.env.PAYMENT_WEBHOOK_SECRET || "").trim();
    const providedSecret = extractWebhookSecret(req, url, bodyObj);

    if (configuredSecret && providedSecret !== configuredSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing webhook secret.",
          },
        },
        { status: 401 }
      );
    }

    const combinedText = collectTextFromPayload(url, rawText, bodyObj);
    const matches = combinedText.match(CODE_REGEX);

    if (!matches || matches.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          activated: false,
          error: {
            code: "CODE_NOT_FOUND",
            message: "No TDPROxxxxxx transfer code found in payment note/description.",
          },
        },
        { status: 400 }
      );
    }

    const candidateCodes = Array.from(new Set(matches.map((m) => m.toUpperCase())));
    const user = await prisma.user.findFirst({
      where: {
        proTransferCode: { in: candidateCodes },
      },
    });

    if (!user || !user.proTransferCode) {
      return NextResponse.json(
        {
          ok: false,
          activated: false,
          candidates: candidateCodes,
          error: {
            code: "USER_NOT_FOUND",
            message: `No user matched transfer code(s): ${candidateCodes.join(", ")}`,
          },
        },
        { status: 404 }
      );
    }

    const requiredAmount = Number(process.env.PAYMENT_AMOUNT || 199000);
    const strictAmount = process.env.PAYMENT_STRICT_AMOUNT === "true";
    const detectedAmount = extractAmount(url, bodyObj, combinedText);

    if (strictAmount && (detectedAmount === null || detectedAmount < requiredAmount)) {
      return NextResponse.json(
        {
          ok: false,
          activated: false,
          transferCode: user.proTransferCode,
          detectedAmount,
          requiredAmount,
          error: {
            code: "INSUFFICIENT_AMOUNT",
            message: `Detected amount (${detectedAmount ?? 0}) is less than required (${requiredAmount}).`,
          },
        },
        { status: 400 }
      );
    }

    const finalAmount = detectedAmount || requiredAmount;

    // Activate Lifetime Pro (isPro = true, proUntil = null) and log transaction
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: true,
          proUntil: null,
        },
      }),
      prisma.paymentTransaction.create({
        data: {
          userId: user.id,
          transferCode: user.proTransferCode,
          amount: finalAmount,
          rawNote: combinedText.slice(0, 1000),
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      activated: true,
      plan: "LIFETIME_PRO",
      transferCode: updatedUser.proTransferCode,
      amount: finalAmount,
      transactionId: transaction.id,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isPro: updatedUser.isPro,
        proUntil: updatedUser.proUntil,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing error";
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return handlePaymentWebhook(req);
}

export async function GET(req: Request) {
  return handlePaymentWebhook(req);
}
