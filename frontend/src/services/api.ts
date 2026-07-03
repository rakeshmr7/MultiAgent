import axios from 'axios';
import type { ReportResponse, ProgressUpdate } from '../types';

// In production the API is served same-origin under /api (see vercel.json).
// For local development set VITE_API_URL=http://localhost:8000 in frontend/.env.
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getHealth() {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  },

  async generateReportSync(topic: string): Promise<ReportResponse> {
    const response = await axios.post<ReportResponse>(`${API_URL}/generate-report`, { topic });
    return response.data;
  },

  async generateReportStream(
    topic: string,
    onUpdate: (update: ProgressUpdate) => void,
    onDone: () => void,
    onError: (err: any) => void
  ): Promise<() => void> {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      try {
        const response = await fetch(`${API_URL}/generate-report/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic }),
          signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Server returned ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body reader is not available.');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // Check if it's SSE data format
            if (trimmed.startsWith('data: ')) {
              try {
                const jsonStr = trimmed.slice(6);
                const update: ProgressUpdate = JSON.parse(jsonStr);
                onUpdate(update);
                
                if (update.event === 'completed' || update.event === 'failed' || update.event === 'error') {
                  onDone();
                  return;
                }
              } catch (e) {
                console.error('Failed to parse SSE JSON line:', trimmed, e);
              }
            }
          }
        }
        
        onDone();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          onError(err);
        }
      }
    })();

    // Return cleanup/abort function
    return () => {
      controller.abort();
    };
  },
};
