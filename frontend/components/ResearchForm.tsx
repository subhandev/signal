'use client';

import { useState } from 'react';
import { ResearchMode } from '@/types';
import { startResearch } from '@/lib/api';
import { getSuggestedPrompts } from '@/lib/suggestedPrompts';

interface Props {
  onStart: (jobId: string) => void;
}

const MODES: { value: ResearchMode; label: string; desc: string }[] = [
  { value: 'quick',    label: 'Quick',    desc: '~15s · Fast facts' },
  { value: 'standard', label: 'Standard', desc: '~45s · Balanced' },
  { value: 'deep',     label: 'Deep',     desc: '~2min · Exhaustive' },
];

export default function ResearchForm({ onStart }: Props) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ResearchMode>('standard');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState(() => getSuggestedPrompts());

  const refreshSuggestions = () => setSuggestions(getSuggestedPrompts());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const job = await startResearch(query.trim(), mode);
      onStart(job.job_id);
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to start research');
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
        <p className="sig-mode-desc">{selectedMode.desc}</p>
      </div>

      {/* Example chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span className="sig-form-hint">Try:</span>
        <button
          type="button"
          className="sig-chip"
          onClick={refreshSuggestions}
          disabled={loading}
          title="Show different suggestions"
          aria-label="Refresh suggestions"
        >
          ↻ More ideas
        </button>
        {suggestions.map((q, i) => (
          <button
            key={`${i}-${q}`}
            type="button"
            className="sig-chip"
            title={q}
            disabled={loading}
            onClick={() => setQuery(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {submitError && (
        <p className="sig-form-error" role="alert">{submitError}</p>
      )}

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
