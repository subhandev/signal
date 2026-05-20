import { getResearchJob, researchStreamUrl } from '@/lib/api';
import { SSEEvent, StreamUpdate } from '@/types';

export function createResearchStream(
  jobId: string,
  onUpdate: (update: StreamUpdate) => void,
  onComplete: (report: any) => void,
  onError: (error: string) => void,
): () => void {
  const eventSource = new EventSource(researchStreamUrl(jobId));
  let closed = false;

  const finish = () => {
    if (closed) return;
    closed = true;
    eventSource.close();
  };

  eventSource.onmessage = (e) => {
    try {
      const event: SSEEvent = JSON.parse(e.data);
      onUpdate({ event, timestamp: new Date() });

      if (event.type === 'complete' && event.report) {
        finish();
        onComplete(event.report);
      }

      if (event.type === 'error') {
        finish();
        onError(event.message);
      }
    } catch (err) {
      console.error('SSE parse error', err);
    }
  };

  eventSource.onerror = async () => {
    finish();
    try {
      const job = await getResearchJob(jobId);
      if (job.status === 'complete' && job.report) {
        onComplete(job.report);
        return;
      }
      if (job.status === 'failed') {
        onError(job.error || 'Research failed');
        return;
      }
      if (job.status === 'running' || job.status === 'pending') {
        onError(
          'Live stream interrupted — research is still running. Wait a moment and open this job from History.',
        );
        return;
      }
    } catch {
      /* fall through */
    }
    onError('Stream connection lost');
  };

  return finish;
}
