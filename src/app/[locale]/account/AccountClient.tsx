"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import {
  Crown,
  Copy,
  Check,
  LogOut,
  Shield,
  Sparkles,
  QrCode,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface BillingData {
  planName: string;
  amount: number;
  currency: string;
  transferCode: string | null;
  bankId: string;
  accountNo: string;
  accountName: string;
  bankConfigured: boolean;
  qrImageUrl: string;
  transactions: Array<{
    id: string;
    transferCode: string;
    amount: number;
    createdAt: string;
  }>;
}

interface AccountClientProps {
  locale: string;
  initialUser: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    isPro?: boolean;
    proUntil?: string | Date | null;
  } | null;
}

export function AccountClient({ locale, initialUser }: AccountClientProps) {
  const isVi = locale === "vi";
  const [user, setUser] = useState(initialUser);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loadingBilling, setLoadingBilling] = useState<boolean>(Boolean(initialUser));
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState<boolean>(false);

  const isPro = Boolean(user?.isPro || user?.role === "ADMIN");
  const isAdmin = user?.role === "ADMIN";

  const fetchBillingStatus = async (silent = false) => {
    if (!silent) setLoadingBilling(true);
    try {
      const res = await fetch("/api/billing/qr", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.authenticated) {
        if (!isPro && data.user?.isPro) {
          setJustActivated(true);
        }
        setUser(data.user);
        setBilling(data.billing);
      }
    } catch {
      // ignore transient errors during polling
    } finally {
      if (!silent) setLoadingBilling(false);
    }
  };

  useEffect(() => {
    if (initialUser) {
      fetchBillingStatus();
    }
  }, []);

  // Poll every 3s while user is logged in and waiting for QR payment activation
  useEffect(() => {
    if (!user || isPro) return;
    const timer = setInterval(() => {
      fetchBillingStatus(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [user, isPro]);

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Activation Celebration Banner */}
      {justActivated && (
        <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-4 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-500" />
          <div>
            <h3 className="font-serif text-lg font-semibold">
              {isVi
                ? "🎉 Kích hoạt Sanctuary Pro Trọn Đời thành công!"
                : "🎉 Lifetime Sanctuary Pro Activated!"}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              {isVi
                ? "Hệ thống đã nhận được thanh toán của bạn. Toàn bộ tính năng Hẹn giờ 720 phút, Tự ghép Cảnh & Nhạc (Custom Pair) và Playlists đã được mở khóa vĩnh viễn."
                : "Your payment has been verified. 720-minute timers, Custom Pairing, and Playlists are now permanently unlocked."}
            </p>
          </div>
        </div>
      )}

      {/* Account Overview Card */}
      <div className="bg-paper-light rounded-2xl p-6 sm:p-8 border border-ink/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ink/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-ink font-medium">
              {isVi ? "Tài khoản & Đặc quyền" : "Account & Sanctuary Pass"}
            </h1>
            <p className="text-xs text-ink-soft mt-1">
              {isVi
                ? "Quản lý đăng nhập, gói thành viên Sanctuary Pro và quyền truy cập."
                : "Manage your sign-in session, Sanctuary Pro membership, and privileges."}
            </p>
          </div>

          {user ? (
            <div className="flex items-center gap-2.5">
              {isAdmin && (
                <Link
                  href={`/${locale}/admin`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 text-xs font-medium transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Studio</span>
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: `/${locale}/account` })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ink/15 hover:bg-ink/5 text-ink-soft hover:text-ink text-xs font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isVi ? "Đăng xuất" : "Sign Out"}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: `/${locale}/account` })}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-ink text-paper hover:bg-ink-soft text-sm font-medium transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.81-1.5 3.34-3.2 4.37v3.62h5.18c3.03-2.79 4.78-6.9 4.78-11.72 0-.8-.08-1.57-.23-2.3z"
                />
                <path
                  fill="currentColor"
                  d="M12.18 22c4.32 0 7.95-1.43 10.6-3.88l-5.18-3.62c-1.44.97-3.28 1.54-5.42 1.54-4.17 0-7.7-2.81-8.96-6.59H-2.1v3.74C.54 18.43 5.94 22 12.18 22z"
                />
              </svg>
              <span>{isVi ? "Đăng nhập với Google" : "Sign in with Google"}</span>
            </button>
          )}
        </div>

        {/* Status & Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-paper border border-ink/10">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              {isVi ? "Hạng thành viên" : "Membership Tier"}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              {isPro ? (
                <span className="inline-flex items-center gap-1.5 text-accent font-serif font-semibold text-lg">
                  <Crown className="w-4 h-4" />
                  {isVi ? "Sanctuary Pro (Trọn Đời)" : "Sanctuary Pro (Lifetime)"}
                </span>
              ) : (
                <span className="font-serif text-lg text-ink">
                  {isVi ? "Khách Thư Giãn (Free)" : "Tranquil Guest (Free)"}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-paper border border-ink/10">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              {isVi ? "Tài khoản Google" : "Google Account"}
            </div>
            <div className="mt-1.5 text-sm font-mono text-ink truncate">
              {user?.email || (isVi ? "Chưa đăng nhập" : "Not signed in")}
            </div>
          </div>
        </div>

        {/* Privileges Checklist */}
        <div className="pt-2">
          <div className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
            {isVi ? "Quyền lợi gói của bạn" : "Your Sanctuary Privileges"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-paper border border-ink/5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span className="text-ink">
                {isVi ? "Phát tất cả mẫu Cảnh & Nhạc tuyển chọn" : "Curated line-art scenes & ambient loops"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-paper border border-ink/5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span className="text-ink">
                {isVi ? "Không giới hạn số lượt nghe mỗi ngày" : "Unlimited daily sessions (3–15m per run)"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-paper border border-ink/5">
              <span className={isPro ? "text-accent font-bold" : "text-ink-muted"}>
                {isPro ? "✦" : "🔒"}
              </span>
              <span className={isPro ? "text-ink font-medium" : "text-ink-muted"}>
                {isVi ? "Hẹn giờ liên tục lên tới 720 phút (12 giờ)" : "Extended timer up to 720 minutes (12h)"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-paper border border-ink/5">
              <span className={isPro ? "text-accent font-bold" : "text-ink-muted"}>
                {isPro ? "✦" : "🔒"}
              </span>
              <span className={isPro ? "text-ink font-medium" : "text-ink-muted"}>
                {isVi ? "Tự ghép Cảnh & Nhạc + Tạo Playlists" : "Custom Scene & Music Pair + Playlists"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Upgrade Card (Shown when user is not yet PRO) */}
      {!isPro && (
        <div
          id="upgrade"
          className="bg-paper-light rounded-2xl p-6 sm:p-8 border-2 border-accent/40 shadow-md space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                <span>{isVi ? "Mua 1 lần · Dùng trọn đời" : "One-time payment · Lifetime Pass"}</span>
              </div>
              <h2 className="text-2xl font-serif font-semibold text-ink">
                {isVi ? "Nâng cấp Sanctuary Pro Trọn Đời" : "Unlock Lifetime Sanctuary Pro"}
              </h2>
              <p className="text-xs text-ink-soft mt-1">
                {isVi
                  ? "Quét mã VietQR bên dưới để kích hoạt tự động chỉ sau vài giây."
                  : "Scan the VietQR code below for instant automatic activation."}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-3xl font-serif font-bold text-accent">
                {formatVnd(billing?.amount || 199000)}
              </div>
              <div className="text-[11px] font-mono text-ink-muted">
                {isVi ? "Thanh toán 1 lần duy nhất" : "Single lifetime payment"}
              </div>
            </div>
          </div>

          {!user ? (
            <div className="p-6 rounded-2xl bg-paper border border-ink/10 text-center space-y-4">
              <QrCode className="w-10 h-10 text-accent mx-auto opacity-80" />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-serif text-base font-medium text-ink">
                  {isVi
                    ? "Đăng nhập Google để lấy Mã Chuyển Khoản & QR của riêng bạn"
                    : "Sign in with Google to generate your personal Transfer Code & QR"}
                </h3>
                <p className="text-xs text-ink-soft">
                  {isVi
                    ? "Hệ thống cần gắn mã chuyển khoản (TDPRO...) với email Google của bạn để kích hoạt tự động ngay khi nhận tiền."
                    : "We link your unique transfer code (TDPRO...) to your Google account so your Pro status activates automatically."}
                </p>
              </div>
              <button
                onClick={() => signIn("google", { callbackUrl: `/${locale}/account#upgrade` })}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-paper-light hover:bg-accent-hover text-sm font-medium transition-colors shadow-sm"
              >
                <span>{isVi ? "Đăng nhập Google & Lấy mã QR" : "Sign in with Google & Get QR"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : loadingBilling ? (
            <div className="py-12 text-center text-xs font-mono text-ink-muted flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-accent" />
              <span>{isVi ? "Đang tạo mã chuyển khoản..." : "Generating your transfer code..."}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* VietQR Image Column */}
              <div className="md:col-span-5 flex flex-col items-center p-4 rounded-2xl bg-white border border-ink/10 shadow-sm">
                {billing?.qrImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={billing.qrImageUrl}
                    alt="VietQR Sanctuary Pro"
                    className="w-full max-w-[240px] h-auto rounded-lg"
                  />
                )}
                <span className="text-[11px] font-mono text-stone-500 mt-2 text-center">
                  {isVi
                    ? "Mở App Ngân hàng / MoMo quét mã QR"
                    : "Scan with any Vietnam Banking App"}
                </span>
              </div>

              {/* Transfer Details Column */}
              <div className="md:col-span-7 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-paper border border-ink/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">{isVi ? "Ngân hàng:" : "Bank:"}</span>
                    <span className="font-mono font-semibold text-ink">{billing?.bankId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">{isVi ? "Số tài khoản:" : "Account No:"}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-ink">{billing?.accountNo}</span>
                      {billing?.accountNo && (
                        <button
                          type="button"
                          onClick={() => copyText("acc", billing.accountNo)}
                          className="p-1 rounded hover:bg-ink/10 text-ink-soft"
                          title="Copy"
                        >
                          {copiedField === "acc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">{isVi ? "Chủ tài khoản:" : "Account Name:"}</span>
                    <span className="font-mono font-semibold text-ink">{billing?.accountName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">{isVi ? "Số tiền:" : "Amount:"}</span>
                    <span className="font-mono font-bold text-accent text-sm">
                      {formatVnd(billing?.amount || 199000)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
                    <div>
                      <span className="block text-ink-muted">
                        {isVi ? "Nội dung chuyển khoản (Bắt buộc):" : "Transfer Note (Required):"}
                      </span>
                      <span className="text-[11px] text-ink-soft">
                        {isVi
                          ? "Giữ nguyên mã này để hệ thống tự động kích hoạt"
                          : "Include this exact code in your transfer description"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30 font-mono text-sm font-bold text-accent tracking-wider">
                        {billing?.transferCode}
                      </span>
                      {billing?.transferCode && (
                        <button
                          type="button"
                          onClick={() => copyText("code", billing.transferCode!)}
                          className="p-2 rounded-lg bg-ink text-paper hover:bg-ink-soft transition-colors"
                          title="Copy transfer code"
                        >
                          {copiedField === "code" ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Polling Indicator */}
                <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-ink">
                    <RefreshCw className="w-4 h-4 text-accent animate-spin shrink-0" />
                    <span>
                      {isVi
                        ? "Đang chờ nhận chuyển khoản... Trang sẽ tự động mở khóa PRO ngay khi tiền về!"
                        : "Waiting for transfer... This page will unlock PRO automatically once received!"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchBillingStatus(false)}
                    className="px-2.5 py-1 rounded-lg bg-paper border border-ink/15 hover:border-ink/30 text-[11px] font-mono shrink-0"
                  >
                    {isVi ? "Kiểm tra ngay" : "Check now"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
