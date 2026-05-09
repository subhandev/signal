import { getResearchJob } from '@/lib/api';
import ReportViewer from '@/components/ReportViewer';
import ExportButtons from '@/components/ExportButtons';
import Link from 'next/link';
import Nav from '@/components/Nav';

interface Props {
  params: Promise<{ id: string }>;
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      paddingTop: '80px',
      textAlign: 'center',
    }}>
      {children}
    </div>
  );
}

export default async function ReportPage({ params }: Props) {
  const { id } = await params;

  let job;
  try {
    job = await getResearchJob(id);
  } catch {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        <Nav />
        <div className="sig-content">
          <StatusMessage>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Report not found.
            </p>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'var(--accent-green)',
                textTransform: 'uppercase',
              }}
            >
              ← Back to SIGNAL
            </Link>
          </StatusMessage>
        </div>
      </div>
    );
  }

  if (job.status !== 'complete' || !job.report) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        <Nav />
        <div className="sig-content">
          <StatusMessage>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Research in progress or not yet available.
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Status: {job.status}
            </p>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'var(--accent-green)',
                textTransform: 'uppercase',
              }}
            >
              ← Back to SIGNAL
            </Link>
          </StatusMessage>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Nav />
      <div className="sig-content">
        <ExportButtons report={job.report} jobId={id} />
        <ReportViewer report={job.report} />
      </div>
    </div>
  );
}
