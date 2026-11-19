import React from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/server/guards";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const session = await getCurrentSession();

  const user = session?.user;
  const isPro = user?.isPro === true || user?.role === "ADMIN";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-washi-surface dark:bg-midnight-surface rounded-2xl p-8 border border-ink-hairline/20 shadow-sm">
        <h1 className="text-3xl font-serif text-ink dark:text-ink-light mb-6">
          {t("nav.account") || "Tài khoản của bạn"}
        </h1>

        <div className="space-y-6">
          <div className="flex items-center justify-between py-4 border-b border-ink-hairline/10">
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-muted">
                {locale === "vi" ? "Trạng thái người dùng" : "Membership Tier"}
              </div>
              <div className="text-lg font-medium text-ink dark:text-ink-light mt-1 flex items-center gap-2">
                {isPro ? (
                  <span className="inline-flex items-center gap-1.5 text-ochre font-semibold">
                    <span>✦</span> {locale === "vi" ? "Thành viên Sanctuary Pro" : "Sanctuary Pro Member"}
                  </span>
                ) : (
                  <span>{locale === "vi" ? "Khách thư giãn (Free)" : "Tranquil Guest (Free)"}</span>
                )}
              </div>
            </div>
            {isPro && (
              <span className="px-3 py-1 text-xs rounded-full bg-ochre/15 text-ochre font-medium border border-ochre/30">
                Active
              </span>
            )}
          </div>

          <div className="py-4 border-b border-ink-hairline/10">
            <div className="text-xs uppercase tracking-wider text-ink-muted">
              {locale === "vi" ? "Email đăng nhập" : "Email"}
            </div>
            <div className="text-base text-ink dark:text-ink-light mt-1">
              {user?.email || (locale === "vi" ? "Chưa đăng nhập (Khách)" : "Guest Session")}
            </div>
          </div>

          <div className="py-4 border-b border-ink-hairline/10">
            <div className="text-xs uppercase tracking-wider text-ink-muted">
              {locale === "vi" ? "Đặc quyền của bạn" : "Available Privileges"}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted dark:text-ink-muted">
              <li className="flex items-center gap-2">
                <span className="text-ochre">✓</span>
                <span>{locale === "vi" ? "Phát các mẫu thư giãn tuyển chọn chuẩn âm học" : "Curated soundscapes and animated line-art"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-ochre">✓</span>
                <span>{locale === "vi" ? "Chế độ toàn màn hình tự ẩn giao diện sau 4s" : "Full-screen immersion with receding controls"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={isPro ? "text-ochre" : "text-stone-400"}>{isPro ? "✓" : "🔒"}</span>
                <span>{locale === "vi" ? "Tự do ghép cặp cảnh & nhạc (Custom Pair)" : "Custom scene & melody pairing"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={isPro ? "text-ochre" : "text-stone-400"}>{isPro ? "✓" : "🔒"}</span>
                <span>{locale === "vi" ? "Tạo hành trình phát liên tục tới 720 phút (Playlists)" : "Curated journeys up to 720 minutes"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
