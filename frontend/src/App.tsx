import { useState, useEffect, useRef } from 'react';
import { Cpu, Moon, Sun, Terminal, Play, AlertTriangle } from 'lucide-react';
import { api } from './services/api';
import type { AgentStatus, LogMessage } from './types';
import { SamplePrompts } from './components/SamplePrompts';
import { WorkflowProgress } from './components/WorkflowProgress';
import { LogConsole } from './components/LogConsole';
import { ReportViewer } from './components/ReportViewer';

function App() {
  // UI & Design State
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark mode for rich aesthetics
  });
  
  // Service health status
  const [healthStatus, setHealthStatus] = useState<{ status: string } | null>(null);

  // Workflow State
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [report, setReport] = useState<string>('');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const abortStreamRef = useRef<(() => void) | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Apply Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Check backend health on mount
  useEffect(() => {
    api.getHealth()
      .then(res => setHealthStatus(res))
      .catch(() => setHealthStatus({ status: 'unreachable' }));
  }, []);

  // Cleanup abort signal on unmount
  useEffect(() => {
    return () => {
      if (abortStreamRef.current) abortStreamRef.current();
      stopTimer();
    };
  }, []);

  const getTimestamp = () => {
    return new Date().toTimeString().split(' ')[0];
  };

  const startTimer = () => {
    stopTimer();
    setElapsedTime(0);
    const start = Date.now();
    timerIntervalRef.current = window.setInterval(() => {
      setElapsedTime((Date.now() - start) / 1000);
    }, 100);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleGenerateReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    // Reset workflow states
    if (abortStreamRef.current) abortStreamRef.current();
    stopTimer();
    
    setStatus('validating');
    setReport('');
    setErrors([]);
    setLogs([
      {
        timestamp: getTimestamp(),
        agent: 'Orchestrator',
        message: `Starting report workflow for topic: "${topic}"`,
        type: 'info'
      }
    ]);
    
    startTimer();

    try {
      const abortFn = await api.generateReportStream(
        topic,
        (update) => {
          // SSE Stream update callback
          if (update.event === 'status') {
            setStatus(update.status);
            setLogs((prev) => [
              ...prev,
              {
                timestamp: getTimestamp(),
                agent: update.status === 'validating' ? 'Validator' :
                       update.status === 'researching' ? 'Researcher' :
                       update.status === 'writing' ? 'Writer' : 'Editor',
                message: update.message || 'Processing...',
                type: 'info'
              }
            ]);
          } else if (update.event === 'completed') {
            setStatus('completed');
            setReport(update.report || '');
            setLogs((prev) => [
              ...prev,
              {
                timestamp: getTimestamp(),
                agent: 'Editor',
                message: update.message || 'Report finalized.',
                type: 'success'
              },
              {
                timestamp: getTimestamp(),
                agent: 'Orchestrator',
                message: `Workflow completed successfully in ${update.elapsed.toFixed(2)}s using agents: [Researcher, Writer, Editor]`,
                type: 'success'
              }
            ]);
            stopTimer();
            setElapsedTime(update.elapsed);
          } else if (update.event === 'failed' || update.event === 'error') {
            setStatus('failed');
            const errs = update.errors || ['Topic rejection or workflow failed.'];
            setErrors(errs);
            setLogs((prev) => [
              ...prev,
              {
                timestamp: getTimestamp(),
                agent: 'Validator',
                message: errs[0],
                type: 'error'
              },
              {
                timestamp: getTimestamp(),
                agent: 'Orchestrator',
                message: 'Workflow terminated early.',
                type: 'error'
              }
            ]);
            stopTimer();
          }
        },
        () => {
          // Finished callback
          stopTimer();
        },
        (error) => {
          // Error callback
          setStatus('failed');
          setErrors([error.message || 'Unknown network error']);
          setLogs((prev) => [
            ...prev,
            {
              timestamp: getTimestamp(),
              agent: 'System',
              message: error.message || 'Failed to connect to generator endpoint.',
              type: 'error'
            }
          ]);
          stopTimer();
        }
      );
      
      abortStreamRef.current = abortFn;
    } catch (err: any) {
      setStatus('failed');
      setErrors([err.message || 'Failed to start generator']);
      stopTimer();
    }
  };

  const handleSelectSample = (sampleText: string) => {
    setTopic(sampleText);
  };

  const handleClear = () => {
    setTopic('');
    setStatus('idle');
    setReport('');
    setLogs([]);
    setElapsedTime(0);
    setErrors([]);
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }
    stopTimer();
  };

  const isGenerating = ['validating', 'researching', 'writing', 'editing'].includes(status);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-grid-pattern py-10 px-4 md:px-8">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-slow-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none animate-slow-glow" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Top Navbar */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-200/50 dark:border-slate-800/80 no-print">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                Antigravity <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">MultiAgent</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                Tech Market Research Orchestrator
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Backend Health Badge */}
            {healthStatus ? (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                healthStatus.status === 'healthy' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  healthStatus.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
                API: {healthStatus.status === 'healthy' ? 'Ready' : 'Offline'}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600">
                Checking API...
              </span>
            )}

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main Interface Content */}
        <main className="space-y-8">
          
          {/* Form Card - Hidden during print */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-6 shadow-xl no-print">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                Generate Tech Market Research Report
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter any technology sector, company, or concept. Our multi-agent LangGraph workflow validates the topic, gathers structured research, drafts the report sections, and edits the document.
              </p>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                    placeholder="e.g., Future of Agentic AI, Cyber threats in Kubernetes..."
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800/80 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all pr-12 shadow-sm font-sans"
                  />
                  <Terminal className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-600 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="px-8 py-4 rounded-2xl bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Generate Report
                </button>
              </div>

              {/* Sample Prompts */}
              <SamplePrompts onSelect={handleSelectSample} disabled={isGenerating} />
            </form>
          </div>

          {/* Validation Rejection / Error Alert - Hidden during print */}
          {errors.length > 0 && (
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 flex items-start gap-3 no-print animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-rose-800 dark:text-rose-400">
                  Topic Rejected / Execution Error
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-400/90 leading-relaxed">
                  {errors[0]}
                </p>
                <p className="text-[10px] text-rose-500/80 font-medium">
                  Note: Only the "Technology Market Research" domain is supported by the validator agent.
                </p>
              </div>
            </div>
          )}

          {/* Workflow Progress Panel - Hidden during print */}
          {(status !== 'idle' || isGenerating) && (
            <div className="space-y-6 no-print">
              <WorkflowProgress status={status} />
              <LogConsole status={status} logs={logs} elapsedTime={elapsedTime} />
            </div>
          )}

          {/* Final Report Viewer */}
          <ReportViewer report={report} onClear={handleClear} />

        </main>
      </div>
    </div>
  );
}

export default App;
