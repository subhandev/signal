'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavProps {
  onNewResearch?: () => void;
  showNewResearch?: boolean;
  isRunning?: boolean;
}

export default function Nav({ onNewResearch, showNewResearch, isRunning }: NavProps) {
  const pathname = usePathname();
  const onResearchPage = pathname === '/research' || pathname.startsWith('/research/');

  return (
    <header className="sig-nav">
      <Link href="/" className="sig-wordmark-btn">
        <span className={`live-dot${isRunning ? ' running' : ''}`} />
        <span className="nav-wordmark sig-wordmark-text">SIGNAL</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/gallery" className="sig-nav-link">Gallery</Link>
        {!onResearchPage && (
          <Link href="/research" className="sig-nav-link">Research</Link>
        )}
        {onResearchPage && (
          <Link href="/history" className="sig-nav-link">History</Link>
        )}
        {showNewResearch && (
          <button onClick={onNewResearch} className="sig-nav-new">
            New Research →
          </button>
        )}
      </div>
    </header>
  );
}
