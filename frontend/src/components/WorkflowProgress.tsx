import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Play } from 'lucide-react';
import type { AgentStatus } from '../types';

interface WorkflowProgressProps {
  status: AgentStatus;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ status }) => {
  const steps = [
    { id: 'validating', label: 'Validating Topic', runStatus: ['validating'] },
    { id: 'researching', label: 'Researching', runStatus: ['researching'] },
    { id: 'writing', label: 'Writing', runStatus: ['writing'] },
    { id: 'editing', label: 'Editing', runStatus: ['editing'] },
    { id: 'completed', label: 'Completed', runStatus: ['completed'] },
  ];

  const getStepState = (_stepId: string, idx: number) => {
    // If failed
    if (status === 'failed') {
      // Find out where we failed. If validating fails, the validator failed.
      // If we failed and this is the step that failed (e.g. validating is index 0)
      if (idx === 0) {
        return 'failed';
      }
      return 'pending';
    }

    if (status === 'idle') return 'pending';

    const currentIdx = steps.findIndex(s => s.runStatus.includes(status));
    
    if (idx < currentIdx) {
      return 'completed';
    } else if (idx === currentIdx) {
      return status === 'completed' ? 'completed' : 'active';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Workflow Progress
      </h3>
      <div className="relative flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-2">
        {steps.map((step, idx) => {
          const stepState = getStepState(step.id, idx);
          
          return (
            <div key={step.id} className="flex md:flex-col items-center gap-3 md:gap-2 flex-1 w-full relative">
              {/* Connector line for horizontal layout */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 bg-slate-200 dark:bg-slate-800 z-0">
                  <div 
                    className={`h-full bg-indigo-500 transition-all duration-500 ${
                      stepState === 'completed' ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}

              <div className="z-10 relative">
                {stepState === 'completed' && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 bg-white dark:bg-slate-950 rounded-full animate-bounce" />
                )}
                {stepState === 'active' && (
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white animate-pulse">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping -z-10"></span>
                  </div>
                )}
                {stepState === 'failed' && (
                  <AlertCircle className="w-8 h-8 text-rose-500 bg-white dark:bg-slate-950 rounded-full" />
                )}
                {stepState === 'pending' && (
                  <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 bg-white dark:bg-slate-950 rounded-full" />
                )}
              </div>

              <div className="flex flex-col md:items-center">
                <span className={`text-sm font-semibold ${
                  stepState === 'active' ? 'text-indigo-500 dark:text-indigo-400' : 
                  stepState === 'completed' ? 'text-emerald-500 dark:text-emerald-400' :
                  stepState === 'failed' ? 'text-rose-500 dark:text-rose-400' :
                  'text-slate-400 dark:text-slate-600'
                }`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden md:block">
                  {stepState === 'active' ? 'Running...' : stepState === 'completed' ? 'Done' : stepState === 'failed' ? 'Failed' : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
