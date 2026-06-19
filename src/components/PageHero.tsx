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
 */
export default function PageHero({ title, eyebrow, stats, action, children }: PageHeroProps) {
  return (
    <header className="home-hero">
      <div className="home-hero-top">
        <div>
          {eyebrow && <p className="home-eyebrow">{eyebrow}</p>}
          <h1 className="home-title">{title}</h1>
        </div>
        {action}
      </div>

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
  );
}
