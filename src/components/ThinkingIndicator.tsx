import { useEffect, useState } from 'react';
import type { ThinkingStyle } from '../types';

type ThinkingProps = {
  style: ThinkingStyle;
  showTimer?: boolean;
  modelName?: string;
  tokensSaved?: number;
};

const THINKING_STAGES = [
  'Analyzing context & prompt parameters...',
  'Pruning tokens & structuring thoughts...',
  'Synthesizing model generation...',
  'Streaming response output...',
];

export function ThinkingIndicator({ style, showTimer = true, modelName = 'Aplx Model', tokensSaved }: ThinkingProps) {
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
    }, 1200);

    return () => {
      clearInterval(timer);
      clearInterval(stageTimer);
    };
  }, []);

  return (
    <div className="thinking-wrapper my-2 py-3 px-4 rounded-xl bg-[#0c101a]/80 border border-[#8ea8ff26] backdrop-blur-md max-w-lg">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8ea8ff] animate-ping" />
          <span className="text-xs font-mono tracking-wider uppercase text-[#aebfdc]">
            {modelName} Thinking
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#7d8fae]">
          {tokensSaved && tokensSaved > 0 ? (
            <span className="text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded text-[10px]">
              ⚡ -{tokensSaved} tok
            </span>
          ) : null}
          {showTimer && <span>{elapsed}s</span>}
        </div>
      </div>

      {/* Visual Animation by Style */}
      <div className="thinking-visual my-2.5">
        {style === 'orbital' && <OrbitalThinking />}
        {style === 'synaptic' && <SynapticThinking />}
        {style === 'matrix' && <MatrixThinking />}
        {style === 'shimmer' && <ShimmerThinking />}
        {style === 'minimal' && <MinimalThinking />}
      </div>

      <div className="text-xs text-[#9eb2d6] font-sans flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ad8dff]" />
        <span className="animate-pulse">{THINKING_STAGES[stageIndex]}</span>
      </div>
    </div>
  );
}

function OrbitalThinking() {
  return (
    <div className="relative h-10 w-full flex items-center justify-center overflow-hidden">
      <div className="relative w-28 h-8 flex items-center justify-center">
        {/* Core */}
        <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_12px_#8ea8ff] animate-pulse" />
        {/* Orbit Ring 1 */}
        <div className="absolute inset-0 border border-indigo-400/40 rounded-full animate-spin [animation-duration:3s]" />
        {/* Orbit Ring 2 */}
        <div className="absolute inset-1 border border-purple-400/30 rounded-full border-dashed animate-spin [animation-duration:5s] [animation-direction:reverse]" />
        {/* Orbiting Satellite 1 */}
        <div className="absolute w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-spin [animation-duration:2.5s] origin-[45px_16px]" />
        {/* Orbiting Satellite 2 */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 animate-spin [animation-duration:4s] [animation-direction:reverse] origin-[35px_12px]" />
      </div>
    </div>
  );
}

function SynapticThinking() {
  return (
    <div className="flex items-center justify-center gap-1.5 h-8">
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-300 animate-pulse"
          style={{
            height: `${12 + Math.sin(i * 0.8) * 14}px`,
            animationDelay: `${i * 0.12}s`,
            animationDuration: '0.9s',
          }}
        />
      ))}
    </div>
  );
}

function MatrixThinking() {
  return (
    <div className="font-mono text-[11px] text-emerald-400/90 h-8 flex items-center justify-between px-2 bg-[#061009] rounded border border-emerald-500/20 overflow-hidden">
      <span className="animate-pulse">0101.SYNAPSE</span>
      <div className="flex gap-1">
        <span className="animate-ping text-emerald-300">■</span>
        <span className="animate-pulse text-emerald-400">▲</span>
        <span className="animate-bounce text-emerald-500">◆</span>
      </div>
      <span className="text-emerald-500/60">PRUNING_GRAPH</span>
    </div>
  );
}

function ShimmerThinking() {
  return (
    <div className="relative h-6 w-full rounded-md bg-[#121828] overflow-hidden border border-[#8ea8ff22]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8ea8ff44] to-transparent animate-shimmer" />
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#a2b6dc]">
        PROCESSING STREAM...
      </div>
    </div>
  );
}

function MinimalThinking() {
  return (
    <div className="flex items-center gap-1.5 h-6">
      <div className="w-2 h-2 rounded-full bg-[#8ea8ff] animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-[#8ea8ff] animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-[#8ea8ff] animate-bounce" />
    </div>
  );
}
