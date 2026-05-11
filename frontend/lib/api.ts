import { GalleryItem, SiteStats } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function startResearch(query: string, mode: string) {
  const res = await fetch(`${API_BASE}/api/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, mode }),
  });
  if (!res.ok) throw new Error('Failed to start research');
  return res.json();
}

export async function getResearchJob(jobId: string) {
  const res = await fetch(`${API_BASE}/api/research/${jobId}`);
  if (!res.ok) throw new Error('Job not found');
  return res.json();
}

export async function listResearchJobs() {
  const res = await fetch(`${API_BASE}/api/research`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getGallery(limit = 50): Promise<GalleryItem[]> {
  const res = await fetch(`${API_BASE}/api/gallery?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch gallery');
  return res.json();
}

export async function getStats(): Promise<SiteStats> {
  const res = await fetch(`${API_BASE}/api/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
