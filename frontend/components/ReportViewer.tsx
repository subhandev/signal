'use client';

import { useState } from 'react';
import { StructuredReport, ReportSection } from '@/types';

interface Props {
  report: StructuredReport;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="sig-copy-btn" title="Copy to clipboard">
      {copied ? '✓' : '⊕'}
    </button>
  );
}

function ExpandableSection({ section }: { section: ReportSection }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="sig-analysis-card">
      <button
        className="sig-analysis-header"
        onClick={() => setOpen(!open)}
      >
        <span className="sig-analysis-heading">{section.heading}</span>
        <span className={`sig-analysis-chevron${open ? ' open' : ''}`}>›</span>
      </button>
      {open && (
        <div className="sig-analysis-body">{section.content}</div>
      )}
    </div>
  );
}

const CONFIDENCE_CLASS: Record<string, string> = {
  High:   'sig-confidence-badge sig-confidence-high',
  Medium: 'sig-confidence-badge sig-confidence-medium',
  Low:    'sig-confidence-badge sig-confidence-low',
};

export default function ReportViewer({ report }: Props) {
  const confidenceClass = CONFIDENCE_CLASS[report.confidence_level] ?? CONFIDENCE_CLASS.Medium;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Report header */}
      <div className="report-section sig-report-header">
        <p className="sig-report-title">Intelligence Report</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <span className="sig-meta-label">Subject</span>
              <span className="sig-meta-value">{report.query}</span>
            </div>
            <div>
              <span className="sig-meta-label">Mode</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}>
                {report.mode}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-tertiary)',
              }}>
                {' · '}
                {new Date(report.generated_at).toLocaleString([], {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <div title={report.confidence_rationale} className={confidenceClass}>
            {report.confidence_level} Confidence
          </div>
        </div>
        <hr className="sig-divider" />
      </div>

      {/* 01 — Executive Summary */}
      <div className="report-section" style={{ padding: '0 4px' }}>
        <div
          className="sig-section-copyable"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <p className="sig-section-stamp">01 · Executive Summary</p>
          <CopyButton text={report.executive_summary} />
        </div>
        <p className="sig-section-body">{report.executive_summary}</p>
      </div>

      {/* 02 — Key Findings */}
      <div className="report-section" style={{ padding: '0 4px' }}>
        <div
          className="sig-section-copyable"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <p className="sig-section-stamp">02 · Key Findings</p>
          <CopyButton text={report.key_findings.join('\n')} />
        </div>
        <div>
          {report.key_findings.map((f, i) => (
            <div key={i} className="sig-finding-row">
              <span className="sig-finding-num">{String(i + 1).padStart(2, '0')}</span>
              <p className="sig-finding-text">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 03 — Detailed Analysis */}
      <div className="report-section" style={{ padding: '0 4px' }}>
        <p className="sig-section-stamp">03 · Detailed Analysis</p>
        <div>
          {report.detailed_analysis.map((s, i) => (
            <ExpandableSection key={i} section={s} />
          ))}
        </div>
      </div>

      {/* 04 — Market Context */}
      <div className="report-section" style={{ padding: '0 4px' }}>
        <div
          className="sig-section-copyable"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <p className="sig-section-stamp">04 · Market Context</p>
          <CopyButton text={report.market_context} />
        </div>
        <div className="sig-prose-card sig-prose-card-blue">
          {report.market_context}
        </div>
      </div>

      {/* 05 — Risks & Gaps */}
      <div className="report-section" style={{ padding: '0 4px' }}>
        <div
          className="sig-section-copyable"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <p className="sig-section-stamp">05 · Risks & Gaps</p>
          <CopyButton text={report.risks_and_gaps} />
        </div>
        <div className="sig-prose-card sig-prose-card-amber">
          {report.risks_and_gaps}
        </div>
      </div>

      {/* 06 — Sources */}
      <div className="report-section" style={{ padding: '0 4px' }}>
        <p className="sig-section-stamp">06 · Sources</p>
        <div>
          {report.sources.map((s, i) => (
            <div key={i} className="sig-source-row">
              <span className="sig-source-index">[{String(i + 1).padStart(2, '0')}]</span>
              <div style={{ minWidth: 0 }}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sig-source-title"
                >
                  {s.title}
                </a>
                <span className="sig-source-url">{getDomain(s.url)}</span>
                {s.snippet && (
                  <span className="sig-source-snippet">{s.snippet}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
