import React from 'react';
import { Terminal, Shield, Cpu, BookOpen, AlertTriangle } from 'lucide-react';

interface SamplePromptsProps {
  onSelect: (prompt: string) => void;
  disabled: boolean;
}

export const SamplePrompts: React.FC<SamplePromptsProps> = ({ onSelect, disabled }) => {
  const prompts = [
    {
      text: 'Future of Agentic AI',
      icon: <Terminal className="w-3.5 h-3.5 mr-1 text-indigo-500" />,
      label: 'Agentic AI'
    },
    {
      text: 'Cybersecurity in the Quantum Era',
      icon: <Shield className="w-3.5 h-3.5 mr-1 text-teal-500" />,
      label: 'Quantum Security'
    },
    {
      text: 'NVIDIA and the AI Chip War',
      icon: <Cpu className="w-3.5 h-3.5 mr-1 text-amber-500" />,
      label: 'AI Hardware'
    },
    {
      text: 'Serverless Cloud Architecture in 2026',
      icon: <BookOpen className="w-3.5 h-3.5 mr-1 text-pink-500" />,
      label: 'Cloud Dev'
    },
    {
      text: 'Classic Lasagna Recipe',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500" />,
      label: 'Test Reject Domain'
    }
  ];

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Try Sample Topics
      </p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(p.text)}
            disabled={disabled}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 hover:border-indigo-500 dark:hover:border-indigo-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {p.icon}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
