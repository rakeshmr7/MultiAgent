import React, { useEffect, useRef } from 'react';
import { Terminal, ShieldCheck, Database, FilePenLine, UserCheck, Play } from 'lucide-react';
import type { AgentStatus, LogMessage } from '../types';

interface LogConsoleProps {
  status: AgentStatus;
  logs: LogMessage[];
  elapsedTime: number;
}

export const LogConsole: React.FC<LogConsoleProps> = ({ status, logs, elapsedTime }) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getAgentInfo = (status: AgentStatus) => {
    switch (status) {
      case 'validating':
        return {
          name: 'Domain Validator',
          description: 'Validating domain relevance...',
          icon: <ShieldCheck className="w-5 h-5 text-indigo-500 animate-spin" />,
        };
      case 'researching':
        return {
          name: 'Research Agent',
          description: 'Scouting concepts and technical data...',
          icon: <Database className="w-5 h-5 text-teal-500 animate-pulse" />,
        };
      case 'writing':
        return {
          name: 'Writer Agent',
          description: 'Synthesizing report sections...',
          icon: <FilePenLine className="w-5 h-5 text-amber-500 animate-bounce" />,
        };
      case 'editing':
        return {
          name: 'Editor Agent',
          description: 'Refining grammar, tone, and layout...',
          icon: <UserCheck className="w-5 h-5 text-pink-500 animate-pulse" />,
        };
      case 'completed':
        return {
          name: 'Workflow Complete',
          description: 'Report successfully generated.',
          icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
        };
      case 'failed':
        return {
          name: 'Workflow Terminated',
          description: 'Topic rejected or error occurred.',
          icon: <AlertIcon className="w-5 h-5 text-rose-500" />,
        };
      default:
        return {
          name: 'Orchestrator Idle',
          description: 'Waiting for topic input...',
          icon: <Play className="w-5 h-5 text-slate-400 dark:text-slate-600" />,
        };
    }
  };

  const AlertIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );

  const activeAgent = getAgentInfo(status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Active Agent Panel */}
      <div className="glass-card rounded-2xl p-5 lg:col-span-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
            Active Agent
          </h3>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800/80">
              {activeAgent.icon}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{activeAgent.name}</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{activeAgent.description}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">Elapsed Time</span>
          <span className="font-mono text-lg font-bold text-slate-700 dark:text-indigo-400">
            {elapsedTime.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Terminal logs panel */}
      <div className="glass-card rounded-2xl p-5 lg:col-span-2 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center">
            <Terminal className="w-4 h-4 mr-2" /> Live Execution Logs
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800/40">
            LOGS_OK
          </span>
        </div>
        
        <div className="flex-1 min-h-[140px] max-h-[180px] overflow-y-auto bg-slate-950 dark:bg-slate-900/90 rounded-xl p-4 font-mono text-xs text-indigo-300/90 shadow-inner border border-slate-900 dark:border-slate-800">
          <div className="space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">No logs recorded yet. Start report generation to listen to multi-agent stream.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-1">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  <span className={`font-semibold ${
                    log.type === 'error' ? 'text-rose-400' :
                    log.type === 'success' ? 'text-emerald-400' :
                    'text-indigo-400'
                  }`}>{log.agent}:</span>
                  <span className={`${
                    log.type === 'error' ? 'text-rose-300' :
                    log.type === 'success' ? 'text-slate-200' :
                    'text-slate-300'
                  } break-words`}>{log.message}</span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
