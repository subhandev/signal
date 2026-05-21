import { listResearchJobs } from '@/lib/api';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { ResearchJob } from '@/types';

const STATUS_CONFIG: Record<string, { dotColor: string; label: string; textColor: string; pulsing: boolean }> = {
  complete: { dotColor: 'var(--accent-green)', label: 'COMPLETE', textColor: 'var(--accent-green)', pulsing: false },
  running:  { dotColor: 'var(--accent-amber)', label: 'RUNNING',  textColor: 'var(--accent-amber)', pulsing: true },
  pending:  { dotColor: 'var(--text-tertiary)', label: 'PENDING',  textColor: 'var(--text-tertiary)', pulsing: false },
  failed:   { dotColor: 'var(--accent-red)',   label: 'FAILED',   textColor: 'var(--accent-red)',   pulsing: false },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className="sig-status-badge" style={{ color: cfg.textColor }}>
      <span
        className={`sig-status-dot${cfg.pulsing ? ' running' : ''}`}
        style={{ background: cfg.dotColor }}
      />
      {cfg.label}
    </span>
  );
}

export default async function HistoryPage() {
  let jobs: ResearchJob[] = [];
  try { jobs = await listResearchJobs(); } catch { /* backend may not be running */ }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Nav />

      <div className="sig-content" style={{ gap: '0' }}>
        <h1 className="sig-history-title">Research History</h1>

        {jobs.length === 0 ? (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--text-tertiary)',
          }}>
            No research jobs yet.
          </p>
        ) : (
          <div>
            {/* Table header */}
            <div className="sig-table-head">
              <span className="sig-table-head-cell">Query</span>
              <span className="sig-table-head-cell sig-col-mode">Mode</span>
              <span className="sig-table-head-cell">Status</span>
              <span className="sig-table-head-cell sig-col-date">Date</span>
              <span className="sig-table-head-cell" />
            </div>

            {/* Table rows */}
            {jobs.map((job) => (
              <Link
                key={job.job_id}
                href={
                  job.status === 'complete'
                    ? `/report/${job.job_id}`
                    : `/research?job=${job.job_id}`
                }
                className="sig-table-row-link"
              >
                <span className="sig-table-cell-query">{job.query}</span>
                <span className="sig-table-cell-mono sig-col-mode">{job.mode}</span>
                <StatusBadge status={job.status} />
                <span className="sig-table-cell-mono sig-col-date" style={{ letterSpacing: 0, fontSize: '11px' }}>
                  {new Date(job.created_at).toLocaleString([], {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span className="sig-table-arrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
