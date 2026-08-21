import { useState, useMemo } from 'react';
import { X, Command, Search, Sparkles, MessageSquare, Compass } from 'lucide-react';

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
    description: 'Close active modal or dialog',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xl animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0c101a]/95 border border-white/[0.1] shadow-2xl text-[#f5f5f7] overflow-hidden animate-modal-pop relative flex flex-col max-h-[85vh]"
        role="dialog"
        aria-label="Keyboard Shortcuts"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[#f5f5f7]">
              <Command size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#f5f5f7]">Keyboard Shortcuts</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b]">
                  {isMac ? 'macOS' : 'Windows / Linux'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.08] transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Search size={14} className="text-[#636366] flex-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search shortcuts…"
              className="w-full bg-transparent text-xs text-[#f5f5f7] placeholder-[#636366] outline-none"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-[10.5px] text-[#86868b] hover:text-white px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Shortcuts List Content */}
        <div className="px-5 py-3 overflow-y-auto space-y-4 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-[#636366]">
              <Command size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No matching shortcuts found</p>
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
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#86868b] uppercase tracking-wider px-1">
                    <CategoryIcon size={13} className="text-[#2997ff]" />
                    <span>{category}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {items.map(s => {
                      const keyList = isMac ? s.keys.mac : s.keys.win;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="text-xs text-[#f5f5f7]">
                              {s.description}
                            </span>
                            {s.badge && (
                              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-[#86868b]">
                                {s.badge}
                              </span>
                            )}
                          </div>

                          {/* Keycap Display */}
                          <div className="flex items-center gap-1 flex-none">
                            {keyList.map((k, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <kbd className="px-2 py-1 rounded-md bg-white/[0.08] border border-white/[0.12] text-[#f5f5f7] font-mono text-[11px] font-medium shadow-sm inline-flex items-center justify-center min-w-[24px]">
                                  {k}
                                </kbd>
                                {idx < keyList.length - 1 && (
                                  <span className="text-[#636366] text-xs">+</span>
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
        <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-[11px] text-[#86868b]">
          <span>Ready for rapid input</span>
          <span className="font-mono text-[10.5px]">Press <kbd className="px-1 py-0.5 rounded bg-white/[0.08] text-[#f5f5f7]">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
