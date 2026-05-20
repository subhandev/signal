import { GalleryItem, SiteStats } from '@/types';

/** Backend origin for SSR and Next.js rewrites (no trailing slash). */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000';

/** @deprecated Prefer apiUrl() — kept for error messages and external imports. */
export const API_BASE = BACKEND_URL;

function resolveApiBase(): string {
  // Browser: same-origin paths proxied by next.config rewrites → avoids CORS / direct Railway issues.
  if (typeof window !== 'undefined') return '';
  return BACKEND_URL;
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = resolveApiBase();
  return base ? `${base}${p}` : p;
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'network error';
    const hint =
      typeof window !== 'undefined'
        ? 'Ensure `npm run dev` is running. In frontend/.env.local set NEXT_PUBLIC_API_URL to http://localhost:8000 (local backend) or your Railway URL.'
        : 'Set NEXT_PUBLIC_API_URL for server-side fetches.';
    throw new Error(
      `Cannot reach the API (${BACKEND_URL}). ${detail}. ${hint}`,
    );
  }
}

export async function startResearch(query: string, mode: string) {
  const res = await apiFetch(apiUrl('/api/research'), {
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
  const res = await apiFetch(apiUrl(`/api/research/${jobId}`));
  if (!res.ok) throw new Error('Job not found');
  return res.json();
}

export async function listResearchJobs() {
  const res = await apiFetch(apiUrl('/api/research'));
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getGallery(limit = 50): Promise<GalleryItem[]> {
  const res = await apiFetch(apiUrl(`/api/gallery?limit=${limit}`), {
    cache: 'no-store',
  });
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
  const res = await apiFetch(apiUrl('/api/stats'), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const raw = (await res.json()) as Record<string, unknown>;
  return normalizeStats(raw);
}
