'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { StreamUpdate } from '@/types';

type CollapsedUpdate = StreamUpdate & { count: number };

const LOG_EVENT_TYPES = new Set([
  'progress',
  'search',
  'scrape',
  'synthesising',
  'complete',
  'error',
]);

function collapseLogUpdates(updates: StreamUpdate[]): CollapsedUpdate[] {
  const result: CollapsedUpdate[] = [];
  for (const u of updates) {
    if (!LOG_EVENT_TYPES.has(u.event.type)) continue;
    const last = result[result.length - 1];
    if (last && last.event.type === u.event.type && last.event.message === u.event.message) {
      last.count += 1;
    } else {
      result.push({ ...u, count: 1 });
    }
  }
  return result;
}

function getLatestThinking(updates: StreamUpdate[]): StreamUpdate | undefined {
  for (let i = updates.length - 1; i >= 0; i--) {
    if (updates[i].event.type === 'thinking') return updates[i];
  }
  return undefined;
}

const cleanMessage = (msg: string) =>
  msg.replace(/ResearchMode\.(QUICK|STANDARD|DEEP)/gi, (_, mode) => mode.toLowerCase());

interface Props {
  updates: StreamUpdate[];
  startedAt?: Date;
  isComplete?: boolean;
}

const EVENT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  search:       { icon: '⌕', label: 'SEARCH', color: 'var(--accent-blue)' },
  scrape:       { icon: '↗', label: 'SCRAPE', color: 'var(--accent-purple)' },
  thinking:     { icon: '◈', label: 'THINK',  color: 'var(--accent-amber)' },
  synthesising: { icon: '◉', label: 'SYNTH',  color: 'var(--accent-green)' },
  progress:     { icon: '·', label: 'INFO',   color: 'var(--text-tertiary)' },
  complete:     { icon: '◉', label: 'DONE',   color: 'var(--accent-green)' },
  error:        { icon: '✕', label: 'ERROR',  color: 'var(--accent-red)' },
};

const WORKING_COLOR = 'var(--accent-amber)';

function fmtTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function RepeatCountBadge({ count, accentColor }: { count: number; accentColor: string }) {
  if (count <= 1) return null;
  return (
    <span
      className="sig-feed-count"
      style={{ '--count-accent': accentColor } as CSSProperties}
      title={`Same step repeated ${count} times`}
    >
      ×{count}
    </span>
  );
}

function PulseDots() {
  return (
    <span className="sig-feed-pulse" aria-hidden>
      <span className="sig-feed-pulse-dot sig-feed-pulse-dot--1" />
      <span className="sig-feed-pulse-dot sig-feed-pulse-dot--2" />
      <span className="sig-feed-pulse-dot sig-feed-pulse-dot--3" />
    </span>
  );
}

function WorkingStatusRow({ update }: { update: StreamUpdate }) {
  return (
    <div className="sig-feed-row sig-feed-working" aria-live="polite">
      <span
        className="sig-feed-working-icon"
        style={{ color: WORKING_COLOR }}
      >
        ◈
      </span>
      <span className="sig-feed-working-label" style={{ color: WORKING_COLOR }}>
        Working…
      </span>
      <div className="sig-feed-working-message">
        <p>{cleanMessage(update.event.message ?? '')}</p>
        <PulseDots />
      </div>
      <span className="sig-feed-time sig-feed-working-time">
        {fmtTime(update.timestamp)}
      </span>
    </div>
  );
}

function FeedLogRow({ u, rowKey, isActive }: { u: CollapsedUpdate; rowKey: string | number; isActive?: boolean }) {
  const cfg = EVENT_CONFIG[u.event.type] ?? EVENT_CONFIG.progress;
  const rowClass = u.event.type === 'scrape' ? 'sig-feed-row sig-feed-row--scrape' : 'sig-feed-row';
  return (
    <div key={rowKey} className={rowClass}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '15px',
        color: cfg.color,
        lineHeight: '20px',
      }}>
        {cfg.icon}
      </span>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        lineHeight: '20px',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: cfg.color,
        }}>
          {cfg.label}
        </span>
        <RepeatCountBadge count={u.count} accentColor={cfg.color} />
      </div>

      <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '20px',
          margin: 0,
        }}>
          {cleanMessage(u.event.message ?? '')}
          {isActive && <span className="sig-feed-cursor" aria-hidden>█</span>}
        </p>
        {(u.event.query || u.event.url) && (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: 0,
          }}>
            {u.event.query ?? u.event.url}
          </p>
        )}
      </div>

      <span className="sig-feed-time" style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
        textAlign: 'right',
        lineHeight: '20px',
      }}>
        {fmtTime(u.timestamp)}
      </span>
    </div>
  );
}

export default function StreamingFeed({ updates, startedAt, isComplete }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isComplete]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userScrolledRef.current = distanceFromBottom > 50;
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isComplete && !userScrolledRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [updates, isComplete]);

  const elapsedMs = startedAt
    ? isComplete && updates.length > 0
      ? updates[updates.length - 1].timestamp.getTime() - startedAt.getTime()
      : now - startedAt.getTime()
    : 0;

  const collapsed = collapseLogUpdates(updates);
  const latestThinking = getLatestThinking(updates);
  const pastSynthPhase = updates.some(
    (u) => u.event.type === 'synthesising' || u.event.type === 'complete',
  );
  const showWorking = !isComplete && !!latestThinking && !pastSynthPhase;
  const showIdleWaiting = !isComplete && !showWorking && collapsed.length > 0;

  const hiddenCount =
    isComplete && !expanded && collapsed.length > 4
      ? collapsed.length - 3
      : 0;
  const visibleLog =
    hiddenCount > 0 ? collapsed.slice(-3) : collapsed;

  const hasVisibleContent = visibleLog.length > 0 || showWorking || showIdleWaiting;

  return (
    <div>
      <div className="sig-feed-header">
        <span className="sig-feed-label">Live Feed</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!isComplete && collapsed.length > 0 && (
            <span className="sig-feed-step-counter">
              STEP {collapsed.length} / ~8
            </span>
          )}
          {startedAt && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.05em',
            }}>
              {fmtElapsed(elapsedMs)} elapsed
            </span>
          )}
        </div>
      </div>

      <div className="sig-feed-container" ref={containerRef}>
        {!hasVisibleContent && (
          <div style={{
            padding: '8px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
          }}>
            Waiting for agent...
          </div>
        )}

        {visibleLog.map((u, i) => {
          const key = isComplete && !expanded ? collapsed.length - 3 + i : i;
          const isActive = !isComplete && !showWorking && i === visibleLog.length - 1;
          return <FeedLogRow key={key} u={u} rowKey={key} isActive={isActive} />;
        })}

        {showIdleWaiting && (
          <div className="sig-feed-idle-dots">
            <PulseDots />
          </div>
        )}

        {showWorking && latestThinking && (
          <WorkingStatusRow update={latestThinking} />
        )}

        <div ref={bottomRef} />
      </div>

      {isComplete && (hiddenCount > 0 || expanded) && collapsed.length > 4 && (
        <button className="sig-feed-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded
            ? '↑ Collapse log'
            : `↓ Show ${hiddenCount} earlier step${hiddenCount === 1 ? '' : 's'}`}
        </button>
      )}
    </div>
  );
}
