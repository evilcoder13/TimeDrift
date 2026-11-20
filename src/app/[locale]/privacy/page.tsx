import React from "react";
import Link from "next/link";

export default async function PrivacyPolicyPage({
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
            {isVi ? "Chính sách Bảo mật (Privacy Policy)" : "Privacy Policy"}
          </h1>
          <p className="text-xs text-ink-muted font-mono mt-2">
            {isVi ? "Cập nhật lần cuối: 20/11/2026" : "Last Updated: November 20, 2026"}
          </p>
        </div>

        {isVi ? (
          <div className="space-y-5 text-sm leading-relaxed text-ink-soft">
            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                1. Giới thiệu
              </h2>
              <p>
                TimeDrift (&quot;chúng tôi&quot;, tại địa chỉ{" "}
                <span className="font-mono text-ink">https://timedrift.duckdns.org</span>)
                là ứng dụng web giúp người dùng thư giãn, tập trung và nghỉ ngơi thông qua
                các khung cảnh hoạt họa nét vẽ tay (line-art SVG) kết hợp với âm nhạc thư
                giãn lặp vô tận theo bộ hẹn giờ. Chúng tôi tôn trọng quyền riêng tư của bạn
                và cam kết chỉ thu thập những dữ liệu tối thiểu cần thiết để vận hành dịch vụ.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                2. Thông tin chúng tôi thu thập
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Sử dụng không cần đăng nhập (Khách / Free):</strong> Bạn có thể
                  nghe nhạc và xem cảnh thư giãn mà không cần tạo tài khoản. Chúng tôi chỉ
                  lưu tùy chọn ngôn ngữ (EN/VI) và giao diện Sáng/Tối trên trình duyệt của bạn.
                </li>
                <li>
                  <strong>Thông tin Đăng nhập Google OAuth:</strong> Khi bạn chọn đăng nhập
                  bằng Google để sử dụng hoặc nâng cấp gói Sanctuary Pro, chúng tôi chỉ nhận
                  và lưu trữ: <strong>Địa chỉ Email</strong>, <strong>Tên hiển thị</strong>,
                  và <strong>Ảnh đại diện cơ bản</strong> từ hồ sơ Google của bạn nhằm định
                  danh tài khoản.
                </li>
                <li>
                  <strong>Dữ liệu sử dụng & Thanh toán:</strong> Chúng tôi lưu các danh sách
                  phát (Playlists) bạn tạo, mã chuyển khoản định danh (dạng{" "}
                  <code className="font-mono">TDPROxxxxxx</code>) và trạng thái kích hoạt
                  gói thành viên Sanctuary Pro.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                3. Mục đích sử dụng thông tin
              </h2>
              <p>Chúng tôi sử dụng thông tin thu thập được duy nhất cho các mục đích:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Xác thực đăng nhập và đồng bộ trạng thái thành viên Sanctuary Pro.</li>
                <li>Lưu trữ các danh sách phát (Playlists) cá nhân của bạn.</li>
                <li>Kích hoạt tự động quyền lợi Pro khi bạn thực hiện nâng cấp.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                4. Chia sẻ & Bảo mật dữ liệu
              </h2>
              <p>
                Chúng tôi <strong>không bán, không trao đổi và không chia sẻ</strong> thông
                tin cá nhân hay email Google của bạn cho bất kỳ bên thứ ba nào vì mục đích
                quảng cáo hay tiếp thị. Mọi kết nối tới TimeDrift đều được mã hóa qua giao
                thức HTTPS/TLS.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                5. Quyền của người dùng & Liên hệ
              </h2>
              <p>
                Bạn có quyền yêu cầu xem hoặc xóa toàn bộ dữ liệu tài khoản và danh sách phát
                của mình bất kỳ lúc nào bằng cách liên hệ quản trị viên qua email:{" "}
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
                1. Overview
              </h2>
              <p>
                TimeDrift (&quot;we&quot;, &quot;our&quot;, accessible at{" "}
                <span className="font-mono text-ink">https://timedrift.duckdns.org</span>)
                is a relaxation web application featuring animated line-art scenes and
                looping ambient music on a timer. We value your privacy and collect only the
                minimum information required to provide our service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                2. Information We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Guest Usage (Free Tier):</strong> You can browse and play curated
                  relaxation templates without signing in. Only local preferences (language
                  and theme) are stored in your browser.
                </li>
                <li>
                  <strong>Google OAuth Sign-In:</strong> When you sign in with Google to
                  access or upgrade to Sanctuary Pro, we receive and store only your basic
                  Google profile information: your <strong>email address</strong>,{" "}
                  <strong>display name</strong>, and <strong>profile picture URL</strong>.
                </li>
                <li>
                  <strong>User Content & Membership Data:</strong> We store your custom
                  playlists, your unique Pro transfer reference code (e.g.{" "}
                  <code className="font-mono">TDPROxxxxxx</code>), and your Sanctuary Pro
                  membership status.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                3. How We Use Your Information
              </h2>
              <p>We use your information strictly to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authenticate your account and maintain your sign-in session.</li>
                <li>Verify and activate your Sanctuary Pro membership privileges.</li>
                <li>Save and synchronize your personal relaxation playlists.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                4. Data Sharing & Security
              </h2>
              <p>
                We <strong>do not sell, rent, or share</strong> your personal data or Google
                account information with third-party advertisers or data brokers. All traffic
                is encrypted via HTTPS/TLS, and animated scenes execute inside a strict
                sandboxed iframe with no network access.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-serif text-lg font-semibold text-ink">
                5. Data Deletion & Contact
              </h2>
              <p>
                You may request access to or complete deletion of your account and associated
                playlists at any time by contacting us at:{" "}
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
            href={`/${locale}/terms`}
            className="text-ink-muted hover:text-ink"
          >
            {isVi ? "Điều khoản Dịch vụ" : "Terms of Service"}
          </Link>
        </div>
      </div>
    </div>
  );
}
