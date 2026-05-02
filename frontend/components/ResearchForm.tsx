'use client';

import { useState } from 'react';
import { ResearchMode } from '@/types';
import { startResearch } from '@/lib/api';

interface Props {
  onStart: (jobId: string) => void;
}

const MODES: { value: ResearchMode; label: string; desc: string }[] = [
  { value: 'quick',    label: 'Quick',    desc: '~15s · Fast facts' },
  { value: 'standard', label: 'Standard', desc: '~45s · Balanced' },
  { value: 'deep',     label: 'Deep',     desc: '~2min · Exhaustive' },
];

const EXAMPLES = ['OpenAI', 'Anthropic', 'Tesla Q1 2025', 'Climate tech'];

export default function ResearchForm({ onStart }: Props) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ResearchMode>('standard');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const job = await startResearch(query.trim(), mode);
      onStart(job.job_id);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const selectedMode = MODES.find((m) => m.value === mode)!;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <label className="sig-form-label">Enter Your Research Query</label>

      <textarea
        className="sig-textarea"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter a topic, company, or question..."
        rows={3}
        disabled={loading}
      />

      {/* Mode selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="sig-mode-row">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`sig-mode-btn${mode === m.value ? ' sig-mode-active' : ''}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-tertiary)',
        }}>
          {selectedMode.desc}
        </p>
      </div>

      {/* Example chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          flexShrink: 0,
        }}>
          Try:
        </span>
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            className="sig-chip"
            onClick={() => setQuery(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!query.trim() || loading}
        className="sig-submit"
      >
        {loading ? (
          <>
            <span className="blink-cursor">▋</span>
            <span>Initialising...</span>
          </>
        ) : (
          'Run Research →'
        )}
      </button>
    </form>
  );
}
