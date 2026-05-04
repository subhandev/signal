'use client';

import { useState } from 'react';
import { StructuredReport } from '@/types';
import { exportPDF } from '@/lib/export';

interface Props {
  report: StructuredReport;
  jobId: string;
}

export default function ExportButtons({ report, jobId }: Props) {
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/report/${jobId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await exportPDF(report); } finally { setPdfLoading(false); }
  };

  return (
    <div className="sig-export-wrap">
      <button onClick={handlePDF} disabled={pdfLoading} className="sig-export-btn">
        {pdfLoading ? 'Generating...' : 'Export PDF'}
      </button>
      <button onClick={handleCopyLink} className="sig-export-btn">
        {copied ? '✓ Copied' : 'Copy Link'}
      </button>
    </div>
  );
}
