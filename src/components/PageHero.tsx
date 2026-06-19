import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface HeroStat {
  value: ReactNode;
  label: string;
}

interface PageHeroProps {
  title: string;
  eyebrow?: string;
  stats?: HeroStat[];
  /** Optional element shown at the top-right of the hero (e.g. a close button). */
  action?: ReactNode;
  /** Optional extra content rendered under the title (e.g. buttons). */
  children?: ReactNode;
}

/**
 * The mint gradient header used at the top of every page — a title, an
 * optional eyebrow line, and a row of stat "chips". The page's own content
 * goes inside a <main className="home-sheet"> that curves up over this hero,
 * matching the Home screen layout.
 *
 * As the big title scrolls out of view, a slim fixed "page-topbar" slides down
 * and keeps the title pinned at the top (iOS/Revolut "large title" pattern).
 * A sentinel placed just below the title is watched with an IntersectionObserver.
 */
export default function PageHero({ title, eyebrow, stats, action, children }: PageHeroProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || !sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-8px 0px 0px 0px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, []);

  // Gentle parallax + fade on the big hero as you scroll, so the page feels
  // layered and fluid. GPU-composited (transform/opacity only), throttled with
  // requestAnimationFrame, and skipped entirely when reduced motion is on.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY || 0;
      const fade = Math.max(0, 1 - y / 200);
      el.style.opacity = String(0.2 + 0.8 * fade);
      el.style.transform = `translate3d(0, ${(y * 0.35).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className={`page-topbar${collapsed ? ' is-visible' : ''}`}>
        <span className="page-topbar-title">{title}</span>
        {action}
      </div>

      <header className="home-hero" ref={heroRef}>
        <div className="home-hero-top">
          <div>
            {eyebrow && <p className="home-eyebrow">{eyebrow}</p>}
            <h1 className="home-title">{title}</h1>
          </div>
          {action}
        </div>

        {/* Sentinel: when this scrolls past the top, the slim bar appears. */}
        <div ref={sentinelRef} aria-hidden="true" />

        {stats && stats.length > 0 && (
          <div className="hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {children}
      </header>
    </>
  );
}
