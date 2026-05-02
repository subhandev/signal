'use client';

import { useEffect, useRef, useState } from 'react';
import { StreamUpdate } from '@/types';

type CollapsedUpdate = StreamUpdate & { count: number };

function collapseUpdates(updates: StreamUpdate[]): CollapsedUpdate[] {
  const result: CollapsedUpdate[] = [];
  for (const u of updates) {
    const last = result[result.length - 1];
    if (last && last.event.type === u.event.type && last.event.message === u.event.message) {
      last.count += 1;
    } else {
      result.push({ ...u, count: 1 });
    }
  }
  return result;
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

function fmtTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function StreamingFeed({ updates, startedAt, isComplete }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isComplete]);

  useEffect(() => {
    if (!isComplete) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [updates, isComplete]);

  const elapsedMs = startedAt
    ? isComplete && updates.length > 0
      ? updates[updates.length - 1].timestamp.getTime() - startedAt.getTime()
      : now - startedAt.getTime()
    : 0;

  const collapsed = collapseUpdates(updates);
  const visibleUpdates =
    isComplete && !expanded ? collapsed.slice(-3) : collapsed;

  return (
    <div>
      <div className="sig-feed-header">
        <span className="sig-feed-label">Live Feed</span>
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

      <div className="sig-feed-container">
        {updates.length === 0 && (
          <div style={{
            padding: '8px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
          }}>
            Waiting for agent...
          </div>
        )}

        {visibleUpdates.map((u, i) => {
          const cfg = EVENT_CONFIG[u.event.type] ?? EVENT_CONFIG.progress;
          const key = isComplete && !expanded ? collapsed.length - 3 + i : i;
          return (
            <div key={key} className="sig-feed-row">
              {/* Icon */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                color: cfg.color,
                lineHeight: '20px',
              }}>
                {cfg.icon}
              </span>

              {/* Label */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: cfg.color,
                lineHeight: '20px',
              }}>
                {cfg.label}
              </span>

              {/* Message */}
              <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: '20px',
                  margin: 0,
                }}>
                  {cleanMessage(u.event.message ?? '')}
                </p>
                {u.count > 1 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    flexShrink: 0,
                  }}>
                    ×{u.count}
                  </span>
                )}
                {(u.event.query || u.event.url) && (
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                    margin: 0,
                  }}>
                    {u.event.query ?? u.event.url}
                  </p>
                )}
              </div>

              {/* Time */}
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
        })}

        <div ref={bottomRef} />
      </div>

      {isComplete && collapsed.length > 3 && (
        <button className="sig-feed-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded
            ? '↑ Collapse Log'
            : `↓ Show Full Log (${updates.length} events)`}
        </button>
      )}
    </div>
  );
}
