import { useState } from 'react';
import { Sparkles, X, Search, BookmarkPlus } from 'lucide-react';

export type PromptTemplate = {
  id: string;
  title: string;
  category: 'code' | 'creative' | 'analysis' | 'productivity';
  prompt: string;
  icon: string;
};

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'code-refactor',
    title: 'Code Architecture Refactoring',
    category: 'code',
    icon: '⚡',
    prompt: 'Please review and refactor the following code for maximum performance, idiomatic cleanliness, and edge-case resilience:\n\n```\n// Paste code here\n```',
  },
  {
    id: 'bug-hunter',
    title: 'Root-Cause Bug Diagnosis',
    category: 'code',
    icon: '🐛',
    prompt: 'I am encountering a defect in my program. Analyze this code and error log to identify the exact root cause and provide a drop-in fix:\n\n**Error:**\n\n**Code:**\n```\n\n```',
  },
  {
    id: 'prompt-optimizer',
    title: 'Prompt Enhancer & Token Saver',
    category: 'productivity',
    icon: '✨',
    prompt: 'Rewrite and optimize the following user prompt to be crystal-clear, dense in instructions, and highly structured for LLM execution with minimal token waste:\n\n"[Your draft idea here]"',
  },
  {
    id: 'system-design',
    title: 'Scalable System Design Blueprint',
    category: 'analysis',
    icon: '🏗️',
    prompt: 'Design an end-to-end cloud architecture for [Application Name]. Detail the database schema, cache layers, API endpoints, error fallbacks, and scalability bottlenecks.',
  },
  {
    id: 'executive-summary',
    title: 'Executive Meeting Summary',
    category: 'productivity',
    icon: '📋',
    prompt: 'Condense the following raw notes into a high-impact executive summary with: 1) Core Decisions, 2) Key Metrics, and 3) Action Items with Owners:\n\n[Paste Notes]',
  },
  {
    id: 'security-audit',
    title: 'Security Vulnerability Audit',
    category: 'code',
    icon: '🛡️',
    prompt: 'Perform a comprehensive security audit on this implementation. Check for XSS, SQL/command injections, auth bypassing, race conditions, and insecure defaults:\n\n```\n\n```',
  },
  {
    id: 'creative-concept',
    title: 'Worldbuilding & Narrative Arc',
    category: 'creative',
    icon: '🌌',
    prompt: 'Develop an intriguing sci-fi concept with unique physics laws, factions, conflict hooks, and philosophical themes about artificial intelligence.',
  },
];

const SAVED_PROMPTS_KEY = 'aplx:custom_prompts';

export function PromptLibraryModal({
  isOpen,
  onClose,
  onSelectPrompt,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [customPrompts, setCustomPrompts] = useState<PromptTemplate[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_PROMPTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const allPrompts = [...customPrompts, ...DEFAULT_PROMPTS];

  const filtered = allPrompts.filter(p => {
    const matchesCat = category === 'all' || p.category === category;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;
    const created: PromptTemplate = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: 'productivity',
      icon: '💡',
      prompt: newPrompt.trim(),
    };
    const updated = [created, ...customPrompts];
    setCustomPrompts(updated);
    try {
      localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updated));
    } catch {}
    setNewTitle('');
    setNewPrompt('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0c101a]/95 border border-white/[0.1] shadow-2xl text-[#f5f5f7] overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-400" size={17} />
            <h3 className="text-sm font-semibold text-[#f5f5f7]">Prompt Library</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.08] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-white/[0.06] bg-white/[0.01] space-y-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Search size={14} className="text-[#636366]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompt templates…"
              className="bg-transparent text-xs text-[#f5f5f7] outline-none w-full placeholder:text-[#636366]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'code', label: 'Coding' },
                { id: 'productivity', label: 'Productivity' },
                { id: 'analysis', label: 'Analysis' },
                { id: 'creative', label: 'Creative' },
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    category === c.id
                      ? 'bg-white text-black'
                      : 'bg-white/[0.05] text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.09]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs text-[#2997ff] hover:underline flex items-center gap-1 flex-none ml-2"
            >
              <BookmarkPlus size={13} /> {showAddForm ? 'Cancel' : 'New Template'}
            </button>
          </div>
        </div>

        {/* Custom Template Add Form */}
        {showAddForm && (
          <form onSubmit={handleSaveCustom} className="p-4 bg-white/[0.02] border-b border-white/[0.08] space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Template title (e.g. SQL Query Generator)"
              className="w-full px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[#f5f5f7] outline-none"
            />
            <textarea
              rows={3}
              value={newPrompt}
              onChange={e => setNewPrompt(e.target.value)}
              placeholder="Prompt template instructions…"
              className="w-full p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[#f5f5f7] outline-none font-mono"
            />
            <div className="flex justify-end">
              <button type="submit" className="primary px-3 py-1 text-xs rounded-lg font-semibold">
                Save Template
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#636366]">No templates match your query.</div>
          ) : (
            filtered.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPrompt(p.prompt);
                  onClose();
                }}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.16] hover:bg-white/[0.06] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{p.icon}</span>
                    <b className="text-xs text-[#f5f5f7] font-medium">{p.title}</b>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#86868b]">
                    {p.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#86868b] line-clamp-2 font-mono leading-relaxed">{p.prompt}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
