'use client';

import Link from 'next/link';

interface NavProps {
  onNewResearch?: () => void;
  showNewResearch?: boolean;
  isRunning?: boolean;
}

export default function Nav({ onNewResearch, showNewResearch, isRunning }: NavProps) {
  return (
    <header className="sig-nav">
      <Link href="/" className="sig-wordmark-btn">
        <span className={`live-dot${isRunning ? ' running' : ''}`} />
        <span className="nav-wordmark sig-wordmark-text">SIGNAL</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/gallery" className="sig-nav-link">Gallery</Link>
        <Link href="/research" className="sig-nav-link">Research</Link>
        {showNewResearch && (
          <button onClick={onNewResearch} className="sig-nav-new">
            New Research →
          </button>
        )}
      </div>
    </header>
  );
}
