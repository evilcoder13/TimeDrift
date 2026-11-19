import React from "react";
import Link from "next/link";
import { getCurrentSession } from "@/server/guards";
import { SystemHealthDrawer } from "@/components/admin/SystemHealthDrawer";
import { Tag, Music, Film, Layers, Users, ShieldAlert, ArrowLeft } from "lucide-react";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getCurrentSession();

  // Role check: If not admin, render gentle unauthorized message
  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl text-ink font-medium mb-2">Restricted Sanctuary Area</h1>
        <p className="text-sm text-ink-soft max-w-md mb-6 leading-relaxed">
          The Admin Studio Cockpit requires administrative privileges. Please verify your credentials or sign in with an authorized account.
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-ink/15 bg-paper-light text-ink hover:border-ink/30 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Sanctuary
        </Link>
      </div>
    );
  }

  const navItems = [
    { href: `/${locale}/admin/tags`, label: "Tags (AD-1)", icon: Tag },
    { href: `/${locale}/admin/music`, label: "Music Studio (AD-2)", icon: Music },
    { href: `/${locale}/admin/scenes`, label: "Scene Studio (AD-3)", icon: Film },
    { href: `/${locale}/admin/templates`, label: "Templates (AD-4)", icon: Layers },
    { href: `/${locale}/admin/users`, label: "Users (AD-5)", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="border-b border-ink/10 bg-paper-light/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2 text-ink-soft hover:text-ink transition-colors text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to App
            </Link>
            <div className="h-4 w-px bg-ink/15" />
            <Link href={`/${locale}/admin`} className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-ink tracking-tight">TimeDrift</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/20">
                Admin Studio
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <SystemHealthDrawer />
            <div className="text-xs text-ink-muted hidden sm:block font-mono">
              {session.user.email}
            </div>
          </div>
        </div>

        {/* Secondary Navigation Ribbon */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2 scrollbar-none border-t border-ink/5 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-ink/5 transition-all whitespace-nowrap text-xs font-medium"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
