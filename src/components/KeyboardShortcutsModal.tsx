import { useState, useMemo } from 'react';
import { X, Command, Search, Sparkles, MessageSquare, Compass, Sliders, Shield } from 'lucide-react';

interface ShortcutItem {
  id: string;
  category: 'Chat & Composition' | 'Workspace Navigation' | 'Quick Actions';
  keys: { mac: string[]; win: string[] };
  description: string;
  badge?: string;
}

const SHORTCUT_CATALOG: ShortcutItem[] = [
  {
    id: 'send',
    category: 'Chat & Composition',
    keys: { mac: ['↵ Return'], win: ['Enter'] },
    description: 'Send prompt or execute action',
    badge: 'Primary',
  },
  {
    id: 'newline',
    category: 'Chat & Composition',
    keys: { mac: ['⇧ Shift', '↵ Return'], win: ['Shift', 'Enter'] },
    description: 'Add new line without submitting',
  },
  {
    id: 'prompts',
    category: 'Quick Actions',
    keys: { mac: ['⌘ Cmd', 'K'], win: ['Ctrl', 'K'] },
    description: 'Open Curated Prompt Template Library',
    badge: 'Popular',
  },
  {
    id: 'newchat',
    category: 'Workspace Navigation',
    keys: { mac: ['⌘ Cmd', '⇧ Shift', 'N'], win: ['Ctrl', 'Shift', 'N'] },
    description: 'Start fresh conversation thread',
  },
  {
    id: 'shortcuts',
    category: 'Workspace Navigation',
    keys: { mac: ['⌘ Cmd', '/'], win: ['Ctrl', '/'] },
    description: 'Toggle Keyboard Shortcuts Cheat Sheet',
  },
  {
    id: 'settings',
    category: 'Workspace Navigation',
    keys: { mac: ['⌘ Cmd', ','], win: ['Ctrl', ','] },
    description: 'Open AI Provider & Customizer Settings',
  },
  {
    id: 'escape',
    category: 'Chat & Composition',
    keys: { mac: ['Esc'], win: ['Esc'] },
    description: 'Close active modal, drawer, or dialog',
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const isMac = useMemo(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || '');
    }
    return false;
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return SHORTCUT_CATALOG;
    return SHORTCUT_CATALOG.filter(
      s =>
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keys.mac.some(k => k.toLowerCase().includes(q)) ||
        s.keys.win.some(k => k.toLowerCase().includes(q))
    );
  }, [search]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(filtered.map(s => s.category)));
    return list;
  }, [filtered]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[#080d19] border border-[#202f4f] shadow-2xl shadow-black/80 text-[#dce5fb] overflow-hidden animate-modal-pop relative flex flex-col max-h-[85vh]"
        role="dialog"
        aria-label="Keyboard Shortcuts"
      >
        {/* Glow backdrop accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#8ea8ff]/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1b2742] bg-[#0c1222]/90 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8ea8ff]/20 to-[#6b8cff]/5 border border-[#8ea8ff]/30 flex items-center justify-center text-[#8ea8ff] shadow-lg shadow-[#8ea8ff]/10">
              <Command size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Keyboard Shortcuts</h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#16233f] text-[#8ea8ff] border border-[#243760]">
                  {isMac ? 'macOS' : 'Windows / Linux'}
                </span>
              </div>
              <p className="text-xs text-[#7f94bc] mt-0.5">Quick tactile hotkeys for faster navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-[#7e92b8] hover:text-white hover:bg-[#152038] rounded-xl border border-transparent hover:border-[#27385a] transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-4 pb-2 relative z-10">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#0d1527] border border-[#1e2e4e] focus-within:border-[#8ea8ff] focus-within:ring-1 focus-within:ring-[#8ea8ff] transition-all">
            <Search size={16} className="text-[#6479a0] flex-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search shortcuts (e.g. prompt, new, settings)..."
              className="w-full bg-transparent text-xs text-[#eef3ff] placeholder-[#5f749b] outline-none font-medium"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-[11px] text-[#7f93ba] hover:text-white px-1.5 py-0.5 rounded hover:bg-[#1c2946]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Shortcuts List Content */}
        <div className="px-6 py-4 overflow-y-auto space-y-6 flex-1 custom-scrollbar relative z-10">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-[#6f83aa]">
              <Command size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No matching shortcuts found</p>
              <span className="text-xs text-[#526384]">Try searching for something else</span>
            </div>
          ) : (
            categories.map(category => {
              const items = filtered.filter(s => s.category === category);
              const CategoryIcon =
                category === 'Chat & Composition'
                  ? MessageSquare
                  : category === 'Workspace Navigation'
                  ? Compass
                  : Sparkles;

              return (
                <div key={category} className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#7d93bc] uppercase tracking-wider px-1">
                    <CategoryIcon size={14} className="text-[#8ea8ff]" />
                    <span>{category}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {items.map(s => {
                      const keyList = isMac ? s.keys.mac : s.keys.win;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-[#0c1324]/80 border border-[#1b2947] hover:border-[#2b4170] hover:bg-[#101930] transition-all group shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-3">
                            <span className="text-xs font-medium text-[#d0dcf5] group-hover:text-white transition-colors">
                              {s.description}
                            </span>
                            {s.badge && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#182645] text-[#8ea8ff] border border-[#263c6c] flex-none">
                                {s.badge}
                              </span>
                            )}
                          </div>

                          {/* Tactile Keycap Display */}
                          <div className="flex items-center gap-1.5 flex-none">
                            {keyList.map((k, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <kbd className="px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-[#19243c] to-[#0f1728] border border-[#2e426a] text-[#edf3ff] font-mono text-[11.5px] font-semibold shadow-[0_2px_0_0_#070a12,0_3px_6px_rgba(0,0,0,0.4)] group-hover:border-[#415d96] group-hover:shadow-[0_2px_0_0_#070a12,0_4px_10px_rgba(142,168,255,0.15)] transition-all inline-flex items-center justify-center min-w-[28px] text-center">
                                  {k}
                                </kbd>
                                {idx < keyList.length - 1 && (
                                  <span className="text-[#4e648c] text-xs font-bold">+</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#192540] bg-[#090f1e] flex items-center justify-between text-xs text-[#7084aa] relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Active in all conversation views</span>
          </div>
          <span className="font-mono text-[11px] text-[#55698e]">Press <kbd className="px-1.5 py-0.5 rounded bg-[#131b2e] border border-[#212f4d] text-[#8ea8ff]">Esc</kbd> to dismiss</span>
        </div>
      </div>
    </div>
  );
}

