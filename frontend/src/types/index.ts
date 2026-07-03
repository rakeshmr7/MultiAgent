export type AgentStatus = 'idle' | 'validating' | 'researching' | 'writing' | 'editing' | 'completed' | 'failed';

export interface ReportRequest {
  topic: string;
}

export interface ReportResponse {
  status: 'completed' | 'failed';
  report?: string;
  execution_time?: string;
  agents?: string[];
  errors?: string[];
}

export interface ProgressUpdate {
  event: 'status' | 'completed' | 'failed' | 'error';
  status: AgentStatus;
  message?: string;
  report?: string;
  elapsed: number;
  agents?: string[];
  errors?: string[];
}

export interface LogMessage {
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'error';
}
