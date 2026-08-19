import { X, Command } from 'lucide-react';

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: 'Enter', desc: 'Send message (when configured in settings)' },
    { key: 'Shift + Enter', desc: 'Insert new line in message input' },
    { key: 'Ctrl/Cmd + K', desc: 'Open Prompt Template Library' },
    { key: 'Ctrl/Cmd + Shift + N', desc: 'Start a new conversation' },
    { key: 'Ctrl/Cmd + /', desc: 'Open Keyboard Shortcuts cheat sheet' },
    { key: 'Ctrl/Cmd + ,', desc: 'Open Settings Hub' },
    { key: 'Escape', desc: 'Close open modal or dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0b0e17] border border-[#2b354f] shadow-2xl text-[#dce5fb] overflow-hidden animate-modal-pop">
        <div className="flex items-center justify-between p-4 border-b border-[#1f283d] bg-[#0f1422]">
          <div className="flex items-center gap-2">
            <Command size={18} className="text-[#8ea8ff]" />
            <b className="text-base text-white">Keyboard Shortcuts</b>
          </div>
          <button onClick={onClose} className="p-1 text-[#7c8eb2] hover:text-white rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {SHORTCUTS.map(s => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2 rounded-lg bg-[#101524] border border-[#1e273d] text-xs"
            >
              <span className="text-[#9bb0d6]">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-[#172036] border border-[#2a3754] text-[#8ea8ff] font-mono text-[11px] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
