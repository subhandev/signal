import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <section style={{ padding: '120px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '72px', letterSpacing: '0.05em' }}>
          SIGNAL
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '16px', lineHeight: 1.6 }}>
          Turn any topic into structured intelligence.
        </p>
        <div style={{ marginTop: '32px' }}>
          <Link
            href="/research"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: 'var(--accent-green)',
              color: '#0A0A0B',
              fontWeight: 600,
              borderRadius: '4px',
            }}
          >
            Start Researching →
          </Link>
        </div>
      </section>
    </div>
  );
}
