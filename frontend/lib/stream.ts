import { SSEEvent, StreamUpdate } from '@/types';

export function createResearchStream(
  jobId: string,
  onUpdate: (update: StreamUpdate) => void,
  onComplete: (report: any) => void,
  onError: (error: string) => void,
): () => void {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const eventSource = new EventSource(`${API_BASE}/api/research/${jobId}/stream`);

  eventSource.onmessage = (e) => {
    try {
      const event: SSEEvent = JSON.parse(e.data);
      onUpdate({ event, timestamp: new Date() });

      if (event.type === 'complete' && event.report) {
        eventSource.close();
        onComplete(event.report);
      }

      if (event.type === 'error') {
        eventSource.close();
        onError(event.message);
      }
    } catch (err) {
      console.error('SSE parse error', err);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    onError('Stream connection lost');
  };

  return () => eventSource.close();
}
