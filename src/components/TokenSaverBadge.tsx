import { useState } from 'react';
import { Zap, ShieldCheck, BarChart3, RefreshCw, X, ChevronRight } from 'lucide-react';
import type { TokenSaverMode, TokenStats } from '../types';
import { resetTokenStats } from '../lib/tokenSaver';

type TokenSaverBadgeProps = {
  mode: TokenSaverMode;
  stats: TokenStats;
  onOpenSettings: () => void;
  onResetStats: (fresh: TokenStats) => void;
};

export function TokenSaverBadge({ mode, stats, onOpenSettings, onResetStats }: TokenSaverBadgeProps) {
  const [open, setOpen] = useState(false);

  const percentage = mode === 'aggressive' ? 32 : mode === 'balanced' ? 22 : mode === 'light' ? 12 : 0;
  const overallSavedPercent = stats.totalTokensProcessed > 0
    ? Math.round((stats.totalTokensSaved / stats.totalTokensProcessed) * 100)
    : percentage;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all border ${
          mode !== 'off'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 shadow-[0_0_10px_#10b98122]'
            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
        }`}
        title="Token Saver Status & Metrics"
      >
        <Zap size={12} className={mode !== 'off' ? 'text-emerald-400 fill-emerald-400' : 'text-zinc-500'} />
        <span>{mode !== 'off' ? `Token Saver ~${percentage}%` : 'Token Saver: Off'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 p-4 rounded-xl bg-[#0c0f17] border border-[#2b354f] shadow-2xl z-50 text-[#e1e8f8] backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#20293d]">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Zap size={16} className="text-emerald-400 fill-emerald-400" />
              <span>Token Saver Dashboard</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-[#8394b8] hover:text-white rounded"
            >
              <X size={15} />
            </button>
          </div>

          <div className="py-3 space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141a29] border border-[#232f48]">
              <div>
                <div className="text-[#8e9ebc]">Active Efficiency Mode</div>
                <div className="font-semibold text-emerald-300 capitalize text-sm">{mode} (~{percentage}% target)</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#101420] border border-[#1d263b]">
                <span className="text-[#7d8fae] block text-[11px]">Tokens Saved</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {stats.totalTokensSaved.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#6b7b99] block">
                  ~{overallSavedPercent}% of input
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#101420] border border-[#1d263b]">
                <span className="text-[#7d8fae] block text-[11px]">Messages Processed</span>
                <span className="text-base font-mono font-bold text-[#dce6ff]">
                  {stats.totalMessagesSent.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#6b7b99] block">turns optimized</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#101420] text-[#9bb0d6] text-[11px] leading-relaxed flex items-start gap-2">
              <ShieldCheck size={16} className="text-indigo-400 flex-none mt-0.5" />
              <span>
                Compresses conversational filler, normalizes formatting, and prunes sliding context without losing semantic meaning.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#20293d] flex items-center justify-between gap-2">
            <button
              onClick={() => {
                const fresh = resetTokenStats();
                onResetStats(fresh);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-[#7d8fae] hover:text-[#c4d4f4]"
            >
              <RefreshCw size={12} /> Reset stats
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onOpenSettings();
              }}
              className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-white font-medium"
            >
              Configure <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
