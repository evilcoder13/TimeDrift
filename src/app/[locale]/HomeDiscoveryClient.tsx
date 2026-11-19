'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { DurationPickerSheet } from '@/components/player/DurationPickerSheet';
import { ProUpsellModal } from '@/components/modals/ProUpsellModal';

interface TagItem {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
}

interface TemplateItem {
  id: string;
  name: string;
  tags: TagItem[];
  scene: {
    id: string;
    name: string;
    description: string;
    bundlePath: string | null;
    tags: TagItem[];
  };
  music: {
    id: string;
    name: string;
    type: string;
    seconds: number;
    tags: TagItem[];
  };
}

interface HomeDiscoveryClientProps {
  templates: TemplateItem[];
  tags: TagItem[];
  isPro: boolean;
}

export const HomeDiscoveryClient: React.FC<HomeDiscoveryClientProps> = ({
  templates,
  tags,
  isPro,
}) => {
  const locale = useLocale();
  const router = useRouter();
  const tHome = useTranslations('home');
  const tApp = useTranslations('app');
  const tTags = useTranslations('tags');

  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);
  const [isDurationOpen, setIsDurationOpen] = useState<boolean>(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState<boolean>(false);
  const [isRandomLoading, setIsRandomLoading] = useState<boolean>(false);

  // Filter templates by selected tag chip
  const filteredTemplates = useMemo(() => {
    if (selectedTag === 'all') return templates;
    return templates.filter((tpl) =>
      tpl.tags.some((tag) => tag.slug === selectedTag)
    );
  }, [templates, selectedTag]);

  // Handle Quick Drift (default 15m or first template)
  const handleQuickDrift = () => {
    if (templates.length > 0) {
      router.push(`/${locale}/play?templateId=${templates[0].id}&duration=15`);
    } else {
      router.push(`/${locale}/play?duration=15`);
    }
  };

  // Handle Random Drift using /api/random (Rule R6)
  const handleRandomDrift = async () => {
    try {
      setIsRandomLoading(true);
      const res = await fetch(`/api/random${selectedTag !== 'all' ? `?tag=${selectedTag}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (data.type === 'TEMPLATE' && data.template?.id) {
          router.push(`/${locale}/play?templateId=${data.template.id}&duration=${isPro ? 60 : 15}`);
          return;
        } else if (data.type === 'CUSTOM' && data.scene?.id && data.music?.id) {
          router.push(`/${locale}/play?sceneId=${data.scene.id}&musicId=${data.music.id}&duration=${isPro ? 60 : 15}`);
          return;
        }
      }
      // Fallback
      router.push(`/${locale}/play?random=1&duration=${isPro ? 60 : 15}`);
    } catch {
      router.push(`/${locale}/play?random=1&duration=${isPro ? 60 : 15}`);
    } finally {
      setIsRandomLoading(false);
    }
  };

  // Open duration sheet for a specific template
  const handleTemplateClick = (tpl: TemplateItem) => {
    setActiveTemplate(tpl);
    setIsDurationOpen(true);
  };

  // Start chosen duration
  const handleStartSession = (minutes: number) => {
    setIsDurationOpen(false);
    if (activeTemplate) {
      router.push(`/${locale}/play?templateId=${activeTemplate.id}&duration=${minutes}`);
    } else {
      router.push(`/${locale}/play?duration=${minutes}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="max-w-focal-safe mx-auto text-center space-y-6 pt-4 pb-10">
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-ink tracking-tight">
          {tHome('title')}
        </h1>
        <p className="text-ink-soft text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          {tHome('subtitle')}
        </p>

        {/* Primary and Secondary CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleQuickDrift}
            className="w-full sm:w-auto px-7 py-3.5 rounded-card bg-accent hover:bg-accent-hover text-paper-light dark:text-paper font-medium text-sm transition-all duration-normal shadow-ink-sm focus-visible:ring-2 focus-visible:ring-accent outline-none"
          >
            {tHome('quick_drift')}
          </button>
          <button
            type="button"
            disabled={isRandomLoading}
            onClick={handleRandomDrift}
            className="w-full sm:w-auto px-6 py-3.5 rounded-card bg-paper-light border border-ink/15 hover:border-ink/30 text-ink font-medium text-sm transition-all duration-normal shadow-sm flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-accent outline-none disabled:opacity-60"
          >
            <span>{isRandomLoading ? tApp('loading') : tHome('random_drift')}</span>
            <span className="text-accent text-base">⚄</span>
          </button>
        </div>
      </div>

      {/* Horizontal Mood / Tag Chip Carousel */}
      <div className="w-full max-w-6xl mx-auto mb-8 overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              selectedTag === 'all'
                ? 'bg-ink text-paper shadow-ink-sm'
                : 'bg-paper-light text-ink-soft border border-ink/10 hover:border-ink/30 hover:text-ink'
            }`}
          >
            #{tHome('filter_all')}
          </button>

          {tags.map((tag) => {
            const label = locale === 'vi' ? tag.nameVi : tag.nameEn;
            const isSelected = selectedTag === tag.slug;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(tag.slug)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-ink text-paper shadow-ink-sm'
                    : 'bg-paper-light text-ink-soft border border-ink/10 hover:border-ink/30 hover:text-ink'
                }`}
              >
                #{label || (tTags.has(tag.slug as any) ? tTags(tag.slug as any) : tag.slug)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Exploration Grid */}
      <div className="w-full max-w-6xl mx-auto">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16 px-4 bg-paper-light/50 border border-ink/10 rounded-sheet">
            <p className="text-ink-soft text-sm sm:text-base">
              {tHome('empty_templates')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="group cursor-pointer bg-paper-light border border-ink/10 hover:border-ink/25 rounded-card overflow-hidden shadow-ink-sm hover:shadow-ink-md transition-all duration-300 flex flex-col"
              >
                {/* 16:9 Canvas / Art Preview Container */}
                <div className="relative aspect-video w-full bg-paper-dark/60 border-b border-ink/10 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/15 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  {/* Subtle minimalist line-art symbol representation */}
                  <div className="text-ink-soft/40 group-hover:text-accent/70 transition-colors text-4xl">
                    ◯
                  </div>

                  <span className="absolute bottom-2.5 right-3 text-[11px] font-mono px-2 py-0.5 rounded-full bg-paper/80 backdrop-blur-sm text-ink-soft border border-ink/10">
                    {template.music.seconds}s loop
                  </span>
                </div>

                {/* Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-accent transition-colors line-clamp-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-ink-soft line-clamp-1 font-sans">
                      {template.music.name} • <span className="capitalize">{template.music.type}</span>
                    </p>
                  </div>

                  {/* Tags & Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-paper border border-ink/10 text-ink-soft"
                        >
                          #{locale === 'vi' ? tag.nameVi : tag.nameEn}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-accent group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duration Picker Bottom Sheet / Modal */}
      <DurationPickerSheet
        isOpen={isDurationOpen}
        onClose={() => setIsDurationOpen(false)}
        onStart={handleStartSession}
        isPro={isPro}
        templateTitle={activeTemplate?.name}
        onProRequired={() => {
          setIsDurationOpen(false);
          setIsUpsellOpen(true);
        }}
      />

      {/* Dignified Pro Upsell Modal */}
      <ProUpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
      />
    </div>
  );
};
