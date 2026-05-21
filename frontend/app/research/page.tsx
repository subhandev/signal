'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav';
import ResearchForm from '@/components/ResearchForm';
import StreamingFeed from '@/components/StreamingFeed';
import ReportViewer from '@/components/ReportViewer';
import ExportButtons from '@/components/ExportButtons';
import { createResearchStream } from '@/lib/stream';
import { StreamUpdate, StructuredReport } from '@/types';

type Phase = 'idle' | 'running' | 'complete' | 'error';

function ResearchPageInner() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<StreamUpdate[]>([]);
  const [report, setReport] = useState<StructuredReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<Date | undefined>();
  const cleanupRef = useRef<(() => void) | null>(null);
  const resumedFromUrl = useRef(false);

  const handleStart = (id: string) => {
    setJobId(id);
    setPhase('running');
    setUpdates([]);
    setReport(null);
    setError(null);
    setStartedAt(new Date());
  };

  useEffect(() => {
    const resumeId = searchParams.get('job');
    if (resumeId && !resumedFromUrl.current) {
      resumedFromUrl.current = true;
      handleStart(resumeId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (phase !== 'running' || !jobId) return;

    const cleanup = createResearchStream(
      jobId,
      (update) => setUpdates((prev) => [...prev, update]),
      (r) => { setReport(r); setPhase('complete'); },
      (msg) => { setError(msg); setPhase('error'); },
    );

    cleanupRef.current = cleanup;
    return () => cleanup();
  }, [phase, jobId]);

  const reset = () => {
    cleanupRef.current?.();
    setPhase('idle');
    setJobId(null);
    setUpdates([]);
    setReport(null);
    setError(null);
    setStartedAt(undefined);
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Nav
        isRunning={phase === 'running'}
        showNewResearch={phase === 'complete'}
        onNewResearch={reset}
      />

      <div className="sig-content">
        {phase === 'idle' && (
          <div className="sig-hero-wrap">
            <div className="sig-hero-glow" />
            <div className="sig-form-inner">
              <ResearchForm onStart={handleStart} />
            </div>
          </div>
        )}

        {(phase === 'running' || phase === 'complete') && (
          <StreamingFeed
            updates={updates}
            startedAt={startedAt}
            isComplete={phase === 'complete'}
          />
        )}

        {phase === 'complete' && report && jobId && (
          <>
            <ExportButtons report={report} jobId={jobId} />
            <ReportViewer report={report} />
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
              <button
                onClick={reset}
                className="sig-export-btn"
                style={{ flex: 'none', padding: '0 32px' }}
              >
                New Research →
              </button>
            </div>
          </>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <p style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              {error}
            </p>
            <button
              onClick={reset}
              className="sig-export-btn"
              style={{ flex: 'none', padding: '0 32px' }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={null}>
      <ResearchPageInner />
    </Suspense>
  );
}
