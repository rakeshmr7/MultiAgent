import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, FileDown, Printer, Trash2, BookOpen } from 'lucide-react';

interface ReportViewerProps {
  report: string;
  onClear: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClear }) => {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadMarkdown = () => {
    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    
    // Extract first line as title or default
    const firstLine = report.trim().split('\n')[0] || '';
    const cleanTitle = firstLine.replace('#', '').trim().toLowerCase().replace(/\s+/g, '_') || 'market_report';
    
    element.download = `${cleanTitle}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-200/50 dark:border-slate-800/80 overflow-hidden shadow-lg print-container">
      {/* Header Controls - Hidden during print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/40 dark:border-slate-800/80 gap-3 no-print">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">
            Market Research Report
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Copy Text
              </>
            )}
          </button>
          
          <button
            onClick={downloadMarkdown}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Markdown
          </button>
          
          <button
            onClick={printReport}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Print/PDF
          </button>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />
          
          <button
            onClick={onClear}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 cursor-pointer transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Report View */}
      <div className="p-6 md:p-10 bg-white dark:bg-slate-900/40 print:p-0">
        <article className="prose prose-slate dark:prose-invert max-w-none 
          prose-headings:font-bold prose-headings:font-sans prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
          prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
          prose-a:text-indigo-500 hover:prose-a:text-indigo-600
          prose-ul:list-disc prose-ol:list-decimal
          prose-table:border-collapse prose-table:w-full
          prose-th:border prose-th:border-slate-200 dark:prose-th:border-slate-800 prose-th:p-2 prose-th:bg-slate-50 dark:prose-th:bg-slate-900/60
          prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-800 prose-td:p-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};
