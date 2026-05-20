import { GalleryItem, SiteStats } from '@/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_BASE}. Start the backend locally (port 8000) or set NEXT_PUBLIC_API_URL in frontend/.env.local.`,
    );
  }
}

export async function startResearch(query: string, mode: string) {
  const res = await apiFetch(`${API_BASE}/api/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, mode }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(detail || `Failed to start research (${res.status})`);
  }
  return res.json();
}

export async function getResearchJob(jobId: string) {
  const res = await apiFetch(`${API_BASE}/api/research/${jobId}`);
  if (!res.ok) throw new Error('Job not found');
  return res.json();
}

export async function listResearchJobs() {
  const res = await apiFetch(`${API_BASE}/api/research`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getGallery(limit = 50): Promise<GalleryItem[]> {
  const res = await apiFetch(`${API_BASE}/api/gallery?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch gallery');
  return res.json();
}

/** Normalize stats from API — production may still use legacy field names and placeholder values when empty. */
function normalizeStats(raw: Record<string, unknown>): SiteStats {
  const num = (v: unknown, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const reports_run = num(raw.reports_run ?? raw.total_reports);

  // Legacy API returns avg_searches: 3 and success_rate: 98 even with zero jobs.
  if (reports_run === 0) {
    return {
      reports_run: 0,
      sources_read: 0,
      avg_searches_per_report: 0,
      success_rate: 0,
    };
  }

  return {
    reports_run,
    sources_read: num(raw.sources_read),
    avg_searches_per_report: num(raw.avg_searches_per_report ?? raw.avg_searches),
    success_rate: num(raw.success_rate),
  };
}

export async function getStats(): Promise<SiteStats> {
  const res = await apiFetch(`${API_BASE}/api/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const raw = (await res.json()) as Record<string, unknown>;
  return normalizeStats(raw);
}
