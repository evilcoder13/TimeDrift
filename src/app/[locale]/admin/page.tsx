import Link from "next/link";
import { prisma } from "@/server/db";
import { Tag, Music, Film, Layers, Users, ArrowRight } from "lucide-react";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [tagCount, musicCount, sceneCount, templateCount, userCount] = await Promise.all([
    prisma.tag.count(),
    prisma.music.count(),
    prisma.scene.count(),
    prisma.template.count(),
    prisma.user.count(),
  ]);

  const cards = [
    {
      title: "Emotion Tags Manager",
      spec: "AD-1",
      href: `/${locale}/admin/tags`,
      count: tagCount,
      label: "Tags registered",
      desc: "Create and edit bilingual emotion tags (EN/VI) and inspect usage across scenes and melodies.",
      icon: Tag,
    },
    {
      title: "Music Studio",
      spec: "AD-2",
      href: `/${locale}/admin/music`,
      count: musicCount,
      label: "Melody tracks",
      desc: "Generate MusicGen loops, inspect 3-loop audition seams, verify R10 readiness, and toggle publishing.",
      icon: Music,
    },
    {
      title: "Scene Studio",
      spec: "AD-3",
      href: `/${locale}/admin/scenes`,
      count: sceneCount,
      label: "Line-art scenes",
      desc: "Synthesize scenes via omlx LLM, edit TypeScript in Monaco, inspect live sandbox with diurnal tau scrubber.",
      icon: Film,
    },
    {
      title: "Template Builder",
      spec: "AD-4",
      href: `/${locale}/admin/templates`,
      count: templateCount,
      label: "Harmonized templates",
      desc: "Assemble scene + melody pairs ranked by Jaccard similarity (R7) and manage live publication (R8).",
      icon: Layers,
    },
    {
      title: "User Management",
      spec: "AD-5",
      href: `/${locale}/admin/users`,
      count: userCount,
      label: "Users registered",
      desc: "Grant or revoke Pro Sanctuary access (R9), configure pro expiration dates, and promote admin roles.",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-ink tracking-tight mb-2">
          Admin Cockpit & Editorial Studio
        </h1>
        <p className="text-sm text-ink-soft max-w-2xl">
          Content generation pipeline, validation gates (R7–R12), and creative director sign-off controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.spec}
              href={c.href}
              className="group p-6 rounded-2xl border border-ink/10 bg-paper-light hover:border-ink/25 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-ink/5 text-ink-soft">
                    {c.spec}
                  </span>
                </div>
                <h2 className="font-serif text-lg font-medium text-ink group-hover:text-accent transition-colors mb-1">
                  {c.title}
                </h2>
                <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed mb-4">
                  {c.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-ink/5 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-serif font-bold text-ink">{c.count}</span>
                  <span className="text-xs text-ink-muted ml-2">{c.label}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink-soft group-hover:bg-accent group-hover:text-paper transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
