import Link from 'next/link';
import Nav from '@/components/Nav';
import { getGallery, getStats } from '@/lib/api';
import { GalleryItem, SiteStats } from '@/types';

const CONFIDENCE_CLASS: Record<string, string> = {
  High:   'sig-confidence-badge sig-confidence-high',
  Medium: 'sig-confidence-badge sig-confidence-medium',
  Low:    'sig-confidence-badge sig-confidence-low',
};

function fmtStat(n: number): string {
  if (n === 0) return '—';
  return n >= 1000 ? n.toLocaleString() : String(n);
}


function ReportCard({ item }: { item: GalleryItem }) {
  const badgeClass = CONFIDENCE_CLASS[item.confidence_level ?? ''] ?? CONFIDENCE_CLASS.Medium;
  return (
    <Link href={`/report/${item.job_id}`} className="sig-report-card">
      <div className="sig-report-card-header">
        <p className="sig-report-card-title">{item.query}</p>
        {item.confidence_level && (
          <span className={badgeClass}>{item.confidence_level}</span>
        )}
      </div>
      {item.first_finding && (
        <p className="sig-report-card-finding">{item.first_finding}</p>
      )}
      <p className="sig-report-card-meta">
        {item.mode.toUpperCase()} · {item.source_count} source{item.source_count !== 1 ? 's' : ''} · {new Date(item.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
    </Link>
  );
}

export default async function LandingPage() {
  let stats: SiteStats = { total_reports: 0, sources_read: 0, avg_searches: 0, success_rate: 0 };
  let featured: GalleryItem[] = [];

  try { stats = await getStats(); } catch {}
  try { featured = (await getGallery(3)); } catch {}

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Nav />

      {/* Hero */}
      <section className="sig-hero">
        <div className="sig-hero-bg" />
        <div className="sig-hero-content">
          <h1 className="sig-hero-title">SIGNAL</h1>
          <p className="sig-hero-tagline">
            Turn any topic into<br />
            <span style={{ color: 'var(--accent-green)' }}>structured intelligence.</span>
          </p>
          <div className="sig-cta-row">
            <Link href="/research" className="sig-cta-primary">Try It Free →</Link>
            <Link href="/gallery" className="sig-cta-secondary">View Gallery →</Link>
          </div>
          <p className="sig-stack-label">
            Built with · LangChain · OpenAI GPT-4o · FastAPI · Tavily
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="sig-lp-section">
        <p className="sig-section-stamp">How It Works</p>
        <div className="sig-how-grid">
          <div className="sig-how-step">
            <span className="sig-how-num">01</span>
            <h3 className="sig-how-title">Enter a topic</h3>
            <p className="sig-how-desc">Any company, question, or market to research.</p>
          </div>
          <span className="sig-how-arrow">→</span>
          <div className="sig-how-step">
            <span className="sig-how-num">02</span>
            <h3 className="sig-how-title">Agent searches</h3>
            <p className="sig-how-desc">Searches the web, scrapes pages, synthesises data.</p>
          </div>
          <span className="sig-how-arrow">→</span>
          <div className="sig-how-step">
            <span className="sig-how-num">03</span>
            <h3 className="sig-how-title">Get a report</h3>
            <p className="sig-how-desc">Structured intelligence with sources and confidence.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="sig-stats-bar">
        <div className="sig-stats-inner">
          <div className="sig-stat-card">
            <span className="sig-stat-num" style={{ color: stats.total_reports > 0 ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
              {fmtStat(stats.total_reports)}
            </span>
            <span className="sig-stat-label">Reports Run</span>
          </div>
          <div className="sig-stat-card">
            <span className="sig-stat-num" style={{ color: stats.sources_read > 0 ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
              {fmtStat(stats.sources_read)}
            </span>
            <span className="sig-stat-label">Sources Read</span>
          </div>
          <div className="sig-stat-card">
            <span className="sig-stat-num" style={{ color: stats.avg_searches > 0 ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
              {stats.avg_searches > 0 ? stats.avg_searches : '—'}
            </span>
            <span className="sig-stat-label">Avg Searches per Report</span>
          </div>
          <div className="sig-stat-card">
            <span className="sig-stat-num" style={{ color: stats.success_rate > 0 ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
              {stats.success_rate > 0 ? `${stats.success_rate}%` : '—'}
            </span>
            <span className="sig-stat-label">Success Rate</span>
          </div>
        </div>
      </div>

      {/* Featured Reports */}
      <section className="sig-lp-section">
        <p className="sig-section-stamp">From the Gallery</p>
        {featured.length > 0 ? (
          <div className="sig-featured-grid">
            {featured.map((item) => <ReportCard key={item.job_id} item={item} />)}
          </div>
        ) : (
          <div className="sig-gallery-empty">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--text-tertiary)' }}>◈</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-tertiary)' }}>
              No reports yet — be the first to research something.
            </p>
          </div>
        )}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link href="/gallery" className="sig-cta-secondary" style={{ display: 'inline-flex' }}>
            View All Reports →
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="sig-landing-cta">
        <p className="sig-landing-cta-title">Ready to research anything?</p>
        <Link href="/research" className="sig-cta-primary">Start Researching →</Link>
      </div>

      {/* Footer */}
      <footer className="sig-footer">
        <div className="sig-footer-inner">
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>SIGNAL</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>Autonomous research intelligence.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)' }}>Built with LangChain · OpenAI · FastAPI</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>© 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
