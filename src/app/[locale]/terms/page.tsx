import React from "react";
import Link from "next/link";

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isVi = locale === "vi";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="bg-paper-light rounded-2xl p-6 sm:p-10 border border-ink/10 shadow-sm space-y-6 text-ink">
        <div className="pb-6 border-b border-ink/10">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
            TimeDrift Sanctuary
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
            {isVi ? "Điều khoản Dịch vụ (Terms of Service)" : "Terms of Service"}
          </h1>
          <p className="text-xs text-ink-muted font-mono mt-2">
            {isVi ? "Cập nhật lần cuối: 20/11/2026" : "Last Updated: November 20, 2026"}
          </p>
        </div>

        {isVi ? (
          <div className="space-y-5 text-sm leading-relaxed text-ink-soft">
            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                1. Sử dụng Dịch vụ
              </h2>
              <p>
                TimeDrift cung cấp không gian nghe nhạc và xem hoạt họa thư giãn trực tuyến.
                Người dùng miễn phí có thể sử dụng các mẫu (Templates) và phát ngẫu nhiên
                với bộ hẹn giờ từ 3–15 phút mỗi lượt (không giới hạn số lượt mỗi ngày).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                2. Gói Thành viên Sanctuary Pro Trọn Đời
              </h2>
              <p>
                Khi nâng cấp gói Sanctuary Pro (thanh toán 1 lần 199.000 VNĐ), tài khoản
                Google của bạn sẽ được mở khóa vĩnh viễn các tính năng: hẹn giờ liên tục lên
                tới 720 phút, tự do ghép cặp cảnh & nhạc (Custom Pair), và tạo danh sách phát
                (Playlists).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                3. Liên hệ & Hỗ trợ
              </h2>
              <p>
                Mọi thắc mắc hoặc yêu cầu hỗ trợ kỹ thuật/thanh toán vui lòng liên hệ:{" "}
                <a
                  href="mailto:damneddevil@gmail.com"
                  className="text-accent underline font-mono"
                >
                  damneddevil@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-5 text-sm leading-relaxed text-ink-soft">
            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                1. Service Usage
              </h2>
              <p>
                TimeDrift provides an online sanctuary of animated line-art scenes and
                looping ambient music. Free users may play curated templates and random pairs
                for 3–15 minutes per run with no daily cap.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                2. Lifetime Sanctuary Pro Pass
              </h2>
              <p>
                The Lifetime Sanctuary Pro Pass (one-time payment of 199,000 VND) permanently
                unlocks extended timers up to 720 minutes, custom scene & music pairing, and
                personal playlists for your Google account.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                3. Contact & Support
              </h2>
              <p>
                For any billing or technical support inquiries, please contact:{" "}
                <a
                  href="mailto:damneddevil@gmail.com"
                  className="text-accent underline font-mono"
                >
                  damneddevil@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        )}

        <div className="pt-6 border-t border-ink/10 flex items-center justify-between text-xs">
          <Link
            href={`/${locale}`}
            className="text-accent hover:underline font-medium"
          >
            {isVi ? "← Quay về Trang chủ TimeDrift" : "← Return to TimeDrift Sanctuary"}
          </Link>
          <Link
            href={`/${locale}/privacy`}
            className="text-ink-muted hover:text-ink"
          >
            {isVi ? "Chính sách Bảo mật" : "Privacy Policy"}
          </Link>
        </div>
      </div>
    </div>
  );
}
