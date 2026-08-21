import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/AchievementsContact';
import { Reveal } from '../components/ui/Reveal';
import { Breadcrumbs } from '../components/seo/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
import { useEngineeringPosts } from '../hooks/useEngineeringPosts';
import type { EngineeringPost } from '../content/blog/types';
import { blogIndexContent as t } from '../content/blog/pageContent';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const PostSkeleton = () => (
  <div className="rounded-3xl bg-bg-secondary border border-ink/5 overflow-hidden animate-pulse">
    <div className="aspect-video bg-ink/5" />
    <div className="p-6 space-y-3">
      <div className="h-3 w-24 bg-ink/10 rounded-full" />
      <div className="h-4 w-full bg-ink/10 rounded-full" />
      <div className="h-4 w-2/3 bg-ink/10 rounded-full" />
      <div className="h-3 w-1/2 bg-ink/10 rounded-full" />
    </div>
  </div>
);

const PostCard = ({ post, index }: { post: EngineeringPost; index: number }) => (
  <Reveal index={index % 6}>
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-3xl bg-bg-secondary border border-ink/5 hover:border-accent-blue/30 transition-all flex flex-col h-full overflow-hidden"
    >
      <div className="aspect-video bg-ink/5 overflow-hidden">
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-text/30">
            <FileText size={32} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs font-mono text-accent-blue uppercase tracking-widest truncate">
            {t.sourcePrefix} {post.source}
          </span>
          <ArrowUpRight
            size={16}
            className="text-secondary-text group-hover:text-accent-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-lg font-bold text-ink mb-2 group-hover:text-accent-blue transition-colors line-clamp-2">
          {post.title}
        </h2>
        {post.description && (
          <p className="text-secondary-text text-sm leading-relaxed flex-grow mb-3 line-clamp-3">{post.description}</p>
        )}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-secondary-text mt-auto">
          <span>{post.author}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{formatDate(post.publishedAt)}</span>
          {post.readTimeMinutes && (
            <>
              <span aria-hidden="true">&middot;</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} aria-hidden="true" />
                {post.readTimeMinutes} {t.readTimeSuffix}
              </span>
            </>
          )}
        </div>
      </div>
    </a>
  </Reveal>
);

// English-only for now, same reasoning as GuidesPage — see App.tsx route
// comment. Renders inside the shared Navbar/Footer so language switching
// elsewhere on the site keeps working.
//
// Content itself is a live feed (see useEngineeringPosts /
// src/lib/engineeringPosts.ts) — no local post data, and no per-post detail
// route. Every card links straight out to its original source.
export const BlogPage = () => {
  const { content } = useLanguage();
  const { posts, isLoading, isLoadingMore, error, hasMore, loadMore, retry } = useEngineeringPosts();

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const showInitialError = error && posts.length === 0;
  const showEmpty = !isLoading && !error && posts.length === 0;

  return (
    <div className="relative bg-bg-pure selection:bg-accent-blue/30 selection:text-accent-blue overflow-x-hidden min-h-screen">
      <Navbar />

      <main id="main-content" className="pt-20 sm:pt-28 pb-12 sm:pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <Breadcrumbs
            className="mb-3 sm:mb-6"
            items={[{ name: content.nav.breadcrumbHome, href: '/' }, { name: t.breadcrumbLabel }]}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12">
            <span className="text-accent-blue font-mono text-xs sm:text-sm tracking-widest uppercase mb-1 sm:mb-2 block">{t.eyebrow}</span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-3 sm:mb-5">
              {t.title} <span className="text-gradient">{t.titleAccent}</span>
            </h1>
            <p className="text-secondary-text max-w-2xl mx-auto text-base sm:text-lg">{t.description}</p>
          </motion.div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          )}

          {showInitialError && (
            <div className="max-w-md mx-auto text-center py-16">
              <AlertCircle size={32} className="mx-auto mb-4 text-secondary-text/50" aria-hidden="true" />
              <h2 className="text-lg font-bold text-ink mb-2">{t.initialErrorTitle}</h2>
              <p className="text-secondary-text text-sm mb-6">{t.initialErrorDescription}</p>
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 px-5 py-3 bg-accent-blue text-bg-pure font-bold rounded-xl hover:glow-blue transition-all"
              >
                {t.retryLabel}
              </button>
            </div>
          )}

          {showEmpty && (
            <div className="max-w-md mx-auto text-center py-16">
              <FileText size={32} className="mx-auto mb-4 text-secondary-text/50" aria-hidden="true" />
              <h2 className="text-lg font-bold text-ink mb-2">{t.emptyTitle}</h2>
              <p className="text-secondary-text text-sm">{t.emptyDescription}</p>
            </div>
          )}

          {!isLoading && posts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, idx) => (
                <PostCard key={post.id} post={post} index={idx} />
              ))}
            </div>
          )}

          {/* Infinite-scroll trigger — invisible, observed rather than
             rendered as content. Kept mounted whenever more pages might
             exist so IntersectionObserver has something to watch. */}
          {!isLoading && !showInitialError && hasMore && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}

          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 text-secondary-text text-sm py-10">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              {t.loadingLabel}
            </div>
          )}

          {error && posts.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-secondary-text text-sm">{t.loadMoreErrorLabel}</p>
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-bg-secondary border border-ink/10 text-ink font-medium rounded-xl hover:border-accent-blue/30 transition-all"
              >
                {t.retryLabel}
              </button>
            </div>
          )}

          {!isLoading && !error && !hasMore && posts.length > 0 && (
            <p className="text-center text-secondary-text text-sm py-10">{t.endOfResultsLabel}</p>
          )}
        </div>
      </main>

      <Footer />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,209,255,0.03),transparent_70%)]" />
      </div>
    </div>
  );
};
