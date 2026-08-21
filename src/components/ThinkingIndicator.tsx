import { useEffect, useState } from 'react';
import type { ThinkingStyle } from '../types';
import { Sparkles } from 'lucide-react';

type ThinkingProps = {
  style: ThinkingStyle;
  showTimer?: boolean;
  modelName?: string;
  tokensSaved?: number;
};

const THINKING_STAGES = [
  'Analyzing prompt & reasoning parameters…',
  'Optimizing token structure…',
  'Formulating thought graph…',
  'Synthesizing generation…',
];

export function ThinkingIndicator({ style: _style, showTimer = true, modelName = 'Aplx' }: ThinkingProps) {
  const [elapsed, setElapsed] = useState(0.1);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const seconds = (Date.now() - startTime) / 1000;
      setElapsed(Number(seconds.toFixed(1)));
    }, 100);

    const stageTimer = setInterval(() => {
      setStageIndex(prev => (prev + 1) % THINKING_STAGES.length);
    }, 1400);

    return () => {
      clearInterval(timer);
      clearInterval(stageTimer);
    };
  }, []);

  return (
    <div className="my-2.5 py-3 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl max-w-lg shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles size={12} className="animate-pulse" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-[#f5f5f7]">
            {modelName} Reasoning
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#86868b]">
          {showTimer && <span>{elapsed}s</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 py-1">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:200ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:400ms]" />
        </div>
        <span className="text-xs text-[#86868b] transition-opacity duration-300">
          {THINKING_STAGES[stageIndex]}
        </span>
      </div>
    </div>
  );
}
