export type ResearchMode = 'quick' | 'standard' | 'deep';
export type ResearchStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface ResearchJob {
  job_id: string;
  status: ResearchStatus;
  query: string;
  mode: ResearchMode;
  created_at: string;
  report?: StructuredReport;
}

export interface StructuredReport {
  executive_summary: string;
  key_findings: string[];
  detailed_analysis: ReportSection[];
  market_context: string;
  risks_and_gaps: string;
  confidence_level: 'High' | 'Medium' | 'Low';
  confidence_rationale: string;
  sources: Source[];
  generated_at: string;
  query: string;
  mode: string;
}

export interface ReportSection {
  heading: string;
  content: string;
}

export interface Source {
  title: string;
  url: string;
  snippet?: string;
}

export interface SSEEvent {
  type: 'progress' | 'search' | 'scrape' | 'thinking' | 'synthesising' | 'complete' | 'error';
  message: string;
  query?: string;
  url?: string;
  report?: StructuredReport;
}

export interface StreamUpdate {
  event: SSEEvent;
  timestamp: Date;
}

export interface GalleryItem {
  job_id: string;
  query: string;
  mode: string;
  confidence_level: string | null;
  executive_summary: string | null;
  first_finding: string | null;
  source_count: number;
  created_at: string;
}

export interface SiteStats {
  reports_run: number;
  sources_read: number;
  avg_searches_per_report: number;
  success_rate: number;
}
