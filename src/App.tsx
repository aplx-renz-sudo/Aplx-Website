import { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowUp,
  Check,
  ChevronLeft,
  Copy,
  Menu,
  MessageSquarePlus,
  Orbit,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  WandSparkles,
  Telescope,
  BookOpen,
  Code2,
  KeyRound,
  Zap,
  Cat,
  Palette,
  BrainCircuit,
  Sliders,
  Download,
  Upload,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  Search,
  Pencil,
  Command,
  Plus,
  CornerDownLeft,
} from 'lucide-react';
import { createProvider, isProviderReady } from './providers';
import type { ChatTurn } from './providers/types';
import { getProvider } from './providers/registry';
import { clearLocalData, loadProviderConfig, saveProviderConfig, type ProviderConfig } from './lib/credential';
import { ChatModelSelect, ProviderSettings } from './components/ProviderSettings';
import { AboutPage } from './pages/AboutPage';
import { PetCompanion, type PetMood } from './components/PetCompanion';
import { ThinkingIndicator } from './components/ThinkingIndicator';
import { TokenSaverBadge } from './components/TokenSaverBadge';
import { CodeBlock } from './components/CodeBlock';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import {
  AppearanceSettings,
  TokenSaverSettings,
  PetSettings,
  ThinkingSettings,
  PersonaSettings,
  DataManagementSettings,
} from './components/CustomizerSettings';
import { sounds } from './lib/audio';
import { loadTokenStats, saveTokenStats, optimizeTokens } from './lib/tokenSaver';
import {
  loadConversations,
  saveConversations,
  getActiveConversationId,
  setActiveConversationId,
  generateTitleFromPrompt,
  type Conversation,
} from './lib/conversations';
import { startSpeechRecognition, speakText, stopSpeaking, isSpeechRecognitionSupported } from './lib/speech';
import type { View, Message, Preferences, TokenStats } from './types';

const preferenceKey = 'aplx:preferences:v2';

const defaultPreferences: Preferences = {
  theme: 'black',
  customTheme: {
    enabled: false,
    gradientStart: '#1e053a',
    gradientEnd: '#003b46',
    gradientAngle: 135,
    accentColor: '#8ea8ff',
    glowIntensity: 50,
    backgroundTint: '#040711',
  },
  font: 'dm-sans',
  bubbleStyle: 'glass',
  compact: false,
  sendOnEnter: true,
  motion: true,
  soundEffects: true,

  petId: 'fox',
  petSize: 'medium',
  petPosition: 'bottom-right',
  petInteractive: true,

  thinkingStyle: 'orbital',
  showThinkingTimer: true,
  thinkingDelayMs: 400,

  tokenSaverMode: 'balanced',
  tokenSaverTargetPercent: 22,

  persona: 'helpful',
  customSystemPrompt: 'You are Aplx, a brilliant, private, and precise AI assistant.',
  temperature: 0.7,
  maxHistoryTurns: 12,
  streamSpeed: 'normal',
};

const now = () => new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(new Date());

function Mark({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !String(children).includes('\n');
          if (isInline) {
            return (
              <code className="font-mono text-xs bg-[#121b2d] border border-[#8ea8ff26] px-1.5 py-0.5 rounded text-[#d6e4ff]" {...props}>
                {children}
              </code>
            );
          }
          return <CodeBlock language={match ? match[1] : ''} code={String(children).replace(/\n$/, '')} />;
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(loadProviderConfig);

  // Multi-conversation state
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string>(getActiveConversationId);
  const [searchHistory, setSearchHistory] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editConvTitle, setEditConvTitle] = useState('');

  const [sidebar, setSidebar] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    'provider' | 'tokensaver' | 'appearance' | 'pets' | 'thinking' | 'persona' | 'privacy' | 'about'
  >('provider');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [petMood, setPetMood] = useState<PetMood>('idle');
  const [tokenStats, setTokenStats] = useState<TokenStats>(loadTokenStats);

  // Modal states
  const [showPromptLib, setShowPromptLib] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const saved = localStorage.getItem(preferenceKey);
      if (saved) return { ...defaultPreferences, ...JSON.parse(saved) };
    } catch {}
    return defaultPreferences;
  });

  const stop = useRef(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);
  const speechRecognizer = useRef<{ stop: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current active conversation
  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConvId) || conversations[0];
  }, [conversations, activeConvId]);

  const messages = currentConversation?.messages || [];

  const updatePreferences = (next: Preferences) => {
    setPreferences(next);
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(next));
    } catch {}
  };

  const goSettings = (tab: typeof settingsTab = 'provider') => {
    setSettingsTab(tab);
    setView('settings');
  };

  const persistProvider = (config: ProviderConfig) => {
    setProviderConfig(config);
    saveProviderConfig(config);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowPromptLib(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        goSettings('provider');
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.trim()) {
      setPetMood('typing');
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => {
        setPetMood('idle');
      }, 1500);
    }
  };

  const updateCurrentMessages = (updater: (prev: Message[]) => Message[]) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === currentConversation.id) {
          const newMsgs = updater(c.messages);
          return {
            ...c,
            messages: newMsgs,
            updatedAt: Date.now(),
          };
        }
        return c;
      });
      saveConversations(updated);
      return updated;
    });
  };

  const handleCreateNewChat = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'welcome',
          role: 'model',
          time: now(),
          content: "Welcome to **Aplx**.\n\nWhat would you like to explore or build today?",
        },
      ],
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setActiveConvId(newId);
    setActiveConversationId(newId);
    setView('chat');
    setSidebar(false);
    setPetMood('idle');
    stopSpeaking();
  };

  const handleSwitchConversation = (id: string) => {
    setActiveConvId(id);
    setActiveConversationId(id);
    setSidebar(false);
    stopSpeaking();
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length === 1) {
      handleCreateNewChat();
      return;
    }
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    saveConversations(remaining);
    if (activeConvId === id) {
      const nextId = remaining[0].id;
      setActiveConvId(nextId);
      setActiveConversationId(nextId);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map(c => (c.id === id ? { ...c, title: newTitle.trim() || 'Untitled' } : c));
    setConversations(updated);
    saveConversations(updated);
    setEditingConvId(null);
  };

  // Voice dictation toggle
  const toggleVoiceInput = () => {
    if (isRecordingVoice) {
      speechRecognizer.current?.stop();
      setIsRecordingVoice(false);
    } else {
      const recognizer = startSpeechRecognition(
        transcript => {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        },
        () => setIsRecordingVoice(false),
        () => setIsRecordingVoice(false)
      );
      if (recognizer) {
        speechRecognizer.current = recognizer;
        setIsRecordingVoice(true);
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  // Text-to-Speech Speak toggle
  const toggleReadAloud = (msg: Message) => {
    if (speakingMsgId === msg.id) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msg.id);
      speakText(msg.content, () => setSpeakingMsgId(null));
    }
  };

  // File context ingestion
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        setAttachmentName(file.name);
        setInput(prev => `[Context from file: ${file.name}]\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\`\n\n${prev}`);
      }
    };
    reader.readAsText(file);
  };

  const send = async (text = input, replaceId?: string) => {
    const rawPrompt = text.trim();
    if (!rawPrompt || streaming) return;
    if (!isProviderReady(providerConfig)) {
      goSettings('provider');
      return;
    }

    if (preferences.soundEffects) sounds.playSend();
    setAttachmentName(null);

    // Auto-update conversation title if it's currently generic
    if (currentConversation.title === 'New conversation' || currentConversation.title === 'A new beginning') {
      const autoTitle = generateTitleFromPrompt(rawPrompt);
      setConversations(prev => {
        const up = prev.map(c => (c.id === currentConversation.id ? { ...c, title: autoTitle } : c));
        saveConversations(up);
        return up;
      });
    }

    // 1. Optimize tokens & history via Token Saver
    let currentHistory: ChatTurn[] = [];
    const baseMessages = replaceId ? messages.filter(m => m.id !== replaceId) : messages;
    currentHistory = baseMessages.filter(m => m.content).map(({ role, content }) => ({ role, content }));

    const optimization = optimizeTokens(
      rawPrompt,
      currentHistory,
      preferences.tokenSaverMode,
      preferences.maxHistoryTurns
    );

    // Update global token stats
    if (preferences.tokenSaverMode !== 'off') {
      const newStats: TokenStats = {
        totalTokensProcessed: tokenStats.totalTokensProcessed + optimization.originalTokens,
        totalTokensSaved: tokenStats.totalTokensSaved + optimization.tokensSaved,
        totalMessagesSent: tokenStats.totalMessagesSent + 1,
      };
      setTokenStats(newStats);
      saveTokenStats(newStats);
    }

    const user: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: rawPrompt,
      time: now(),
    };

    const assistantId = crypto.randomUUID();
    const assistant: Message = {
      id: assistantId,
      role: 'model',
      content: '',
      time: 'now',
      tokensSaved: optimization.tokensSaved,
    };

    updateCurrentMessages(prev => {
      const base = replaceId ? prev.filter(m => m.id !== replaceId) : prev;
      return [...base, user, assistant];
    });

    setInput('');
    setStreaming(true);
    setIsThinking(true);
    setPetMood('thinking');
    stop.current = false;

    const providerName = getProvider(providerConfig.provider).name;

    if (preferences.thinkingDelayMs > 0) {
      await new Promise(r => setTimeout(r, preferences.thinkingDelayMs));
    }

    try {
      let finalHistory = optimization.optimizedHistory;
      if (preferences.customSystemPrompt && preferences.customSystemPrompt.trim()) {
        finalHistory = [
          { role: 'user', content: `[SYSTEM DIRECTIVE: ${preferences.customSystemPrompt}]` },
          { role: 'model', content: 'Understood. I will adhere strictly to these parameters.' },
          ...finalHistory,
        ];
      }

      await createProvider({
        provider: providerConfig.provider,
        apiKey: providerConfig.apiKey,
        model: providerConfig.model,
        baseUrl: providerConfig.baseUrl,
      }).stream(optimization.optimizedPrompt, finalHistory, chunk => {
        if (!stop.current) {
          setIsThinking(false);
          updateCurrentMessages(m =>
            m.map(x => (x.id === assistant.id ? { ...x, content: x.content + chunk } : x))
          );
        }
      });

      if (preferences.soundEffects) sounds.playReceive();
      setPetMood('happy');
      setTimeout(() => setPetMood('idle'), 4000);
    } catch {
      setIsThinking(false);
      updateCurrentMessages(m =>
        m.map(x =>
          x.id === assistant.id
            ? {
                ...x,
                content: `I couldn't reach ${providerName}. Check your provider settings, API key, and quota in Settings.`,
              }
            : x
        )
      );
      setPetMood('idle');
    } finally {
      setIsThinking(false);
      setStreaming(false);
      updateCurrentMessages(m => m.map(x => (x.id === assistant.id ? { ...x, time: now() } : x)));
    }
  };

  const regenerate = (messageId: string) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx < 0) return;
    const userMsg = [...messages.slice(0, idx)].reverse().find(m => m.role === 'user');
    if (userMsg) void send(userMsg.content, messageId);
  };

  const exportChat = (format: 'json' | 'markdown' | 'text') => {
    let content = '';
    let mime = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(messages, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else if (format === 'markdown') {
      content =
        `# ${currentConversation.title} (${new Date().toLocaleString()})\n\n` +
        messages
          .map(m => `### ${m.role === 'user' ? 'User' : 'Aplx'} (${m.time})\n\n${m.content}\n\n---`)
          .join('\n\n');
      mime = 'text/markdown';
      ext = 'md';
    } else {
      content = messages.map(m => `[${m.role.toUpperCase()} - ${m.time}]:\n${m.content}\n`).join('\n\n');
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aplx-${currentConversation.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importChat = (jsonStr: string) => {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      const newId = `imported-${Date.now()}`;
      const newConv: Conversation = {
        id: newId,
        title: 'Imported conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: parsed,
      };
      const updated = [newConv, ...conversations];
      setConversations(updated);
      saveConversations(updated);
      setActiveConvId(newId);
      setActiveConversationId(newId);
      setView('chat');
    }
  };

  const clearAllData = () => {
    clearLocalData();
    localStorage.removeItem(preferenceKey);
    localStorage.removeItem('aplx:conversations:v1');
    setProviderConfig(loadProviderConfig());
    setPreferences(defaultPreferences);
    const fresh = loadConversations();
    setConversations(fresh);
    setActiveConvId(fresh[0].id);
    alert('All local credentials and customized data cleared.');
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: preferences.motion ? 'smooth' : 'instant' });
  }, [messages, isThinking, preferences.motion]);

  const customCssVars = useMemo(() => {
    if (!preferences.customTheme.enabled) return {};
    const ct = preferences.customTheme;
    return {
      '--app-custom-bg': ct.backgroundTint,
      '--app-custom-gradient-start': ct.gradientStart,
      '--app-custom-gradient-end': ct.gradientEnd,
      '--app-custom-accent': ct.accentColor,
      '--app-custom-glow': ct.glowIntensity,
      '--app-custom-glow-color': `${ct.accentColor}33`,
    } as React.CSSProperties;
  }, [preferences.customTheme]);

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div
      style={customCssVars}
      className={`app theme-${preferences.theme} font-${preferences.font} bubble-${preferences.bubbleStyle} ${
        preferences.customTheme.enabled ? 'custom-theme-active' : ''
      } ${preferences.compact ? 'compact' : ''} ${preferences.motion ? 'motion-on' : ''} ${
        view === 'about' ? 'about-open' : ''
      }`}
    >
      <SpaceBackground motion={preferences.motion} />

      {/* Floating or Docked Companion Pet */}
      {view === 'chat' && preferences.petPosition !== 'composer' && (
        <PetCompanion
          petId={preferences.petId}
          position={preferences.petPosition}
          size={preferences.petSize}
          mood={petMood}
          soundEnabled={preferences.soundEffects}
          interactive={preferences.petInteractive}
        />
      )}

      {/* Modals */}
      <PromptLibraryModal
        isOpen={showPromptLib}
        onClose={() => setShowPromptLib(false)}
        onSelectPrompt={p => {
          setInput(p);
          setShowPromptLib(false);
        }}
      />
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {view === 'landing' && (
        <Landing
          launch={() => setView('chat')}
          settings={() => goSettings('provider')}
          privacy={() => setView('privacy')}
          about={() => setView('about')}
          petId={preferences.petId}
          soundEnabled={preferences.soundEffects}
        />
      )}

      {view === 'chat' && (
        <>
          <aside className={'sidebar ' + (sidebar ? 'open' : '')}>
            <div className="brand">
              <span className="brand-mark">A</span>
              <span>APLX</span>
              <button className="close mobile" onClick={() => setSidebar(false)}>
                <X size={18} />
              </button>
            </div>

            <button className="new-chat" onClick={handleCreateNewChat}>
              <MessageSquarePlus size={17} /> New conversation
            </button>

            {/* Conversation Search */}
            <div className="px-1 my-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#101420] border border-[#212b40] text-xs text-[#7e92b8]">
                <Search size={13} />
                <input
                  type="text"
                  value={searchHistory}
                  onChange={e => setSearchHistory(e.target.value)}
                  placeholder="Search chats..."
                  className="bg-transparent text-xs text-white outline-none w-full placeholder:text-[#5f7092]"
                />
              </div>
            </div>

            <div className="nav-label">CONVERSATIONS ({filteredConversations.length})</div>

            <div className="overflow-y-auto max-h-[38vh] space-y-1 pr-1">
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleSwitchConversation(conv.id)}
                  className={`group relative flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                    conv.id === activeConvId
                      ? 'bg-[#151c2e] text-white border border-[#2d3b5b]'
                      : 'text-[#8ea0c2] hover:bg-[#0f1422] hover:text-white'
                  }`}
                >
                  {editingConvId === conv.id ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleRenameConversation(conv.id, editConvTitle);
                      }}
                      className="flex items-center w-full"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editConvTitle}
                        onChange={e => setEditConvTitle(e.target.value)}
                        onBlur={() => handleRenameConversation(conv.id, editConvTitle)}
                        className="bg-[#0b0e17] text-xs text-white p-1 rounded border border-[#8ea8ff] outline-none w-full"
                      />
                    </form>
                  ) : (
                    <>
                      <span className="truncate pr-2 font-medium">{conv.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingConvId(conv.id);
                            setEditConvTitle(conv.title);
                          }}
                          className="p-1 text-[#6f82a6] hover:text-white rounded"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={e => handleDeleteConversation(conv.id, e)}
                          className="p-1 text-[#6f82a6] hover:text-rose-400 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="side-bottom">
              <button onClick={() => setShowPromptLib(true)}>
                <Sparkles size={17} className="text-[#8ea8ff]" /> Prompt Library
              </button>
              <button onClick={() => goSettings('tokensaver')}>
                <Zap size={17} className="text-emerald-400" /> Token Saver (~22%)
              </button>
              <button onClick={() => goSettings('appearance')}>
                <Palette size={17} /> Themes & Styling
              </button>
              <button onClick={() => goSettings('pets')}>
                <Cat size={17} /> Companion Pets
              </button>
              <button onClick={() => setShowShortcuts(true)}>
                <Command size={17} /> Shortcuts
              </button>
              <button onClick={() => goSettings('provider')}>
                <Settings size={17} /> All Settings
              </button>
              <button onClick={() => setView('privacy')}>
                <ShieldCheck size={17} /> Privacy & security
              </button>
              <button onClick={() => setView('about')}>
                <Orbit size={17} /> About Aplx
              </button>
              <a className="github-side" href="https://github.com/Korentic/Aplx" target="_blank" rel="noreferrer">
                Install Aplx ↗
              </a>
              <div className="web-status">
                <span /> Aplx Web <small>{getProvider(providerConfig.provider).name}</small>
              </div>
            </div>
          </aside>

          <main className="chat">
            <header>
              <div className="flex items-center gap-3">
                <button className="icon mobile" onClick={() => setSidebar(true)}>
                  <Menu />
                </button>
                <label className="model">
                  <span />
                  <ChatModelSelect
                    config={providerConfig}
                    onModelChange={m => persistProvider({ ...providerConfig, model: m })}
                  />
                </label>
              </div>

              <div className="header-actions items-center flex gap-2">
                <TokenSaverBadge
                  mode={preferences.tokenSaverMode}
                  stats={tokenStats}
                  onOpenSettings={() => goSettings('tokensaver')}
                  onResetStats={setTokenStats}
                />
                <button className="icon" title="Prompt Library (Ctrl+K)" onClick={() => setShowPromptLib(true)}>
                  <Sparkles size={18} />
                </button>
                <button className="icon" title="Clear conversation" onClick={handleCreateNewChat}>
                  <Trash2 size={18} />
                </button>
                <button className="icon" title="Settings" onClick={() => goSettings('provider')}>
                  <Settings size={18} />
                </button>
              </div>
            </header>

            <section className="messages">
              {messages.map(m => (
                <MessageView
                  key={m.id}
                  message={m}
                  regenerate={() => regenerate(m.id)}
                  isThinking={isThinking && streaming && m.role === 'model' && !m.content}
                  thinkingStyle={preferences.thinkingStyle}
                  showThinkingTimer={preferences.showThinkingTimer}
                  onSpeak={() => toggleReadAloud(m)}
                  isSpeaking={speakingMsgId === m.id}
                  onEditPrompt={newPrompt => send(newPrompt, m.id)}
                />
              ))}

              {messages.length === 1 && <PromptDeck choose={send} />}
              <div ref={messagesEnd} />
            </section>

            <div className="relative">
              {/* Composer-docked Pet */}
              {preferences.petPosition === 'composer' && (
                <PetCompanion
                  petId={preferences.petId}
                  position="composer"
                  size={preferences.petSize}
                  mood={petMood}
                  soundEnabled={preferences.soundEffects}
                  interactive={preferences.petInteractive}
                />
              )}

              {/* Attachment Pill Indicator */}
              {attachmentName && (
                <div className="max-w-[790px] mx-auto mb-1 px-4 flex items-center gap-2 text-xs text-[#8ea8ff]">
                  <span className="bg-[#141b2e] px-2 py-0.5 rounded border border-[#273554] flex items-center gap-1.5">
                    <Paperclip size={12} /> Attached: {attachmentName}
                    <button
                      onClick={() => setAttachmentName(null)}
                      className="text-[#6d80a6] hover:text-white ml-1"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.md,.js,.ts,.tsx,.py,.json,.csv,.sql,.html,.css"
              />

              <Composer
                value={input}
                change={handleInputChange}
                send={() => send()}
                stop={() => {
                  stop.current = true;
                  setStreaming(false);
                  setIsThinking(false);
                  stopSpeaking();
                }}
                streaming={streaming}
                sendOnEnter={preferences.sendOnEnter}
                onOpenPrompts={() => setShowPromptLib(true)}
                onToggleVoice={toggleVoiceInput}
                isRecordingVoice={isRecordingVoice}
                onAttachFile={() => fileInputRef.current?.click()}
              />
            </div>
          </main>
        </>
      )}

      {view === 'settings' && (
        <FullSettingsModal
          tab={settingsTab}
          setTab={setSettingsTab}
          providerConfig={providerConfig}
          onProviderChange={persistProvider}
          preferences={preferences}
          setPreferences={updatePreferences}
          tokenStats={tokenStats}
          onResetTokenStats={() => setTokenStats(loadTokenStats())}
          onExportChat={exportChat}
          onImportChat={importChat}
          onClearAllData={clearAllData}
          back={() => setView('chat')}
          onAbout={() => setView('about')}
        />
      )}

      {view === 'privacy' && (
        <Privacy
          back={() => setView('landing')}
          settings={() => goSettings('provider')}
          about={() => setView('about')}
        />
      )}

      {view === 'about' && (
        <AboutPage
          launch={() => setView('chat')}
          home={() => setView('landing')}
          settings={() => goSettings('provider')}
          motion={preferences.motion}
        />
      )}
    </div>
  );
}

function SpaceBackground({ motion }: { motion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!motion) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      el.style.setProperty('--star-x', `${x}px`);
      el.style.setProperty('--star-y', `${y}px`);
      el.classList.add('near');
    };
    const onLeave = () => el.classList.remove('near');
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [motion]);
  return (
    <div ref={ref} className="space" aria-hidden="true">
      <i />
      <b />
    </div>
  );
}

function Landing({
  launch,
  settings,
  privacy,
  about,
  petId,
  soundEnabled,
}: {
  launch: () => void;
  settings: () => void;
  privacy: () => void;
  about: () => void;
  petId?: string;
  soundEnabled?: boolean;
}) {
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const petAvatar = petId === 'cat' ? '🐱' : petId === 'bunny' ? '🐰' : petId === 'dragon' ? '🐉' : petId === 'slime' ? '💧' : petId === 'robo' ? '🤖' : petId === 'shiba' ? '🐕' : '🦊';

  const handleMascotClick = (e: React.MouseEvent) => {
    if (soundEnabled) sounds.playPetChirp();
    const id = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHearts(prev => [...prev.slice(-3), { id, x }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 1200);
  };

  return (
    <main className="landing animate-fade-in-up">
      <nav>
        <div className="wordmark">
          <span>A</span> APLX
        </div>
        <div>
          <button onClick={about}>About</button>
          <button onClick={privacy}>Privacy</button>
          <button onClick={launch} className="nav-launch playful-btn">
            Launch Aplx <ArrowUp size={14} />
          </button>
        </div>
      </nav>
      <div className="hero animate-float-hero">
        <div className="eyebrow flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-[#8ea8ff] animate-twinkle" />
          <span>PRIVATE AI SOFTWARE</span>
          {/* Playful Floating Pet Mascot on Hero */}
          <span
            onClick={handleMascotClick}
            title="Click me for pets! ✨"
            className="relative cursor-pointer text-base hover:scale-125 transition-transform inline-block select-none animate-playful-bounce ml-1"
          >
            {petAvatar}
            {hearts.map(h => (
              <span
                key={h.id}
                style={{ left: `${h.x}px`, top: '-10px' }}
                className="absolute text-rose-400 text-sm pointer-events-none animate-float-heart z-20"
              >
                ❤️
              </span>
            ))}
          </span>
        </div>
        <h1>
          AI, on <i className="lively-shimmer-text">your</i> terms.
        </h1>
        <p>
          Aplx is your AI assistant with deep customization, interactive companions, token conservation, prompt libraries, and direct provider routing.
        </p>
        <div className="hero-actions">
          <button className="primary playful-btn" onClick={launch}>
            Launch Aplx <ArrowUp size={16} />
          </button>
          <button className="secondary playful-btn" onClick={settings}>
            <KeyRound size={16} /> Connect a provider
          </button>
        </div>
        <div className="trust">
          <span className="playful-pill">
            <ShieldCheck size={17} /> Your key, your browser
          </span>
          <span className="playful-pill">
            <Zap size={17} /> Token Saver ~22%
          </span>
          <span className="playful-pill">
            <Orbit size={17} /> Browser → provider
          </span>
          <span className="playful-pill">
            <Sparkles size={17} /> Companions & Prompt Library
          </span>
        </div>
      </div>
      <footer>
        APLX WEB <span>•</span> A project by KORENTIC <span>•</span>
        <a href="https://github.com/Korentic/Aplx" target="_blank" rel="noreferrer">
          GITHUB · INSTALL APLX ↗
        </a>
      </footer>
    </main>
  );
}

function PromptDeck({ choose }: { choose: (prompt: string) => void }) {
  const prompts = [
    ['Plan a project', 'Turn an idea into a clear plan.', Telescope],
    ['Explain a concept', 'Learn something with useful examples.', BookOpen],
    ['Write some code', 'Build, debug, or refactor together.', Code2],
    ['Explore an idea', 'Think through the possibilities.', WandSparkles],
  ] as const;
  return (
    <div className="prompt-deck">
      {prompts.map(([title, body, Icon]) => (
        <button onClick={() => choose(`${title}: ${body}`)} key={title}>
          <Icon size={17} />
          <b>{title}</b>
          <span>{body}</span>
        </button>
      ))}
    </div>
  );
}

function MessageView({
  message,
  regenerate,
  isThinking,
  thinkingStyle,
  showThinkingTimer,
  onSpeak,
  isSpeaking,
  onEditPrompt,
}: {
  message: Message;
  regenerate: () => void;
  isThinking?: boolean;
  thinkingStyle: Preferences['thinkingStyle'];
  showThinkingTimer: boolean;
  onSpeak: () => void;
  isSpeaking?: boolean;
  onEditPrompt?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftEdit, setDraftEdit] = useState(message.content);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftEdit.trim()) return;
    setIsEditing(false);
    onEditPrompt?.(draftEdit);
  };

  return (
    <article className={'message ' + message.role}>
      <div className="avatar">{message.role === 'user' ? 'Y' : 'A'}</div>
      <div className="message-body">
        <div className="message-meta flex items-center justify-between">
          <div>
            {message.role === 'user' ? 'You' : 'Aplx'}{' '}
            <time>{message.time}</time>
          </div>
          {message.tokensSaved && message.tokensSaved > 0 ? (
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded">
              ⚡ Saved ~{message.tokensSaved} tokens
            </span>
          ) : null}
        </div>

        {/* Thinking Indicator Animation */}
        {isThinking ? (
          <ThinkingIndicator
            style={thinkingStyle}
            showTimer={showThinkingTimer}
            modelName="Aplx"
            tokensSaved={message.tokensSaved}
          />
        ) : isEditing ? (
          <form onSubmit={handleSaveEdit} className="my-2 space-y-2">
            <textarea
              rows={3}
              value={draftEdit}
              onChange={e => setDraftEdit(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#090d16] border border-[#8ea8ff] text-sm text-[#eef3ff] outline-none font-sans"
            />
            <div className="flex gap-2">
              <button type="submit" className="primary px-3 py-1 text-xs rounded-md font-bold">
                Save & Branch
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="secondary px-3 py-1 text-xs rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <Mark text={message.content || 'Thinking…'} />
        )}

        <div className="message-tools flex items-center gap-1">
          <button onClick={copy} title="Copy message">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>

          {message.role === 'model' && message.content && (
            <>
              <button onClick={regenerate} title="Regenerate response">
                <RotateCcw size={14} /> Regenerate
              </button>
              <button onClick={onSpeak} title={isSpeaking ? 'Stop audio' : 'Read aloud'}>
                {isSpeaking ? (
                  <VolumeX size={14} className="text-rose-400" />
                ) : (
                  <Volume2 size={14} className="text-[#8ea8ff]" />
                )}
                <span>{isSpeaking ? 'Stop' : 'Speak'}</span>
              </button>
            </>
          )}

          {message.role === 'user' && !isEditing && (
            <button onClick={() => setIsEditing(true)} title="Edit user prompt">
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Composer({
  value,
  change,
  send,
  stop,
  streaming,
  sendOnEnter,
  onOpenPrompts,
  onToggleVoice,
  isRecordingVoice,
  onAttachFile,
}: {
  value: string;
  change: (x: string) => void;
  send: () => void;
  stop: () => void;
  streaming: boolean;
  sendOnEnter: boolean;
  onOpenPrompts: () => void;
  onToggleVoice: () => void;
  isRecordingVoice: boolean;
  onAttachFile: () => void;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }, [value]);

  return (
    <div className="composer-wrap">
      <div className="composer flex items-end gap-2">
        {/* Quick Tools */}
        <div className="flex items-center gap-1 pb-1">
          <button
            type="button"
            onClick={onAttachFile}
            title="Attach file (text/code/json)"
            className="p-1.5 text-[#7385a8] hover:text-[#dce5fb] hover:bg-[#192238] rounded-lg transition-colors"
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            onClick={onOpenPrompts}
            title="Open Prompt Library (Ctrl+K)"
            className="p-1.5 text-[#7385a8] hover:text-[#8ea8ff] hover:bg-[#192238] rounded-lg transition-colors"
          >
            <Sparkles size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleVoice}
            title={isRecordingVoice ? 'Stop voice recording' : 'Dictate with voice'}
            className={`p-1.5 rounded-lg transition-colors ${
              isRecordingVoice
                ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                : 'text-[#7385a8] hover:text-[#dce5fb] hover:bg-[#192238]'
            }`}
          >
            {isRecordingVoice ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>

        <textarea
          ref={area}
          value={value}
          onChange={e => change(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && sendOnEnter) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Message Aplx… (Press Ctrl+K for templates)"
          rows={1}
          className="flex-1"
        />

        {streaming ? (
          <button className="send stop" onClick={stop} aria-label="Stop generating">
            <span />
          </button>
        ) : (
          <button className="send" disabled={!value.trim()} onClick={send} aria-label="Send message">
            <ArrowUp size={18} />
          </button>
        )}
      </div>
      <p>{sendOnEnter ? 'Enter sends · Shift + Enter adds a line' : 'Enter adds a line · Use ↑ to send'}</p>
    </div>
  );
}

function FullSettingsModal({
  tab,
  setTab,
  providerConfig,
  onProviderChange,
  preferences,
  setPreferences,
  tokenStats,
  onResetTokenStats,
  onExportChat,
  onImportChat,
  onClearAllData,
  back,
  onAbout,
}: {
  tab: 'provider' | 'tokensaver' | 'appearance' | 'pets' | 'thinking' | 'persona' | 'privacy' | 'about';
  setTab: (x: typeof tab) => void;
  providerConfig: ProviderConfig;
  onProviderChange: (c: ProviderConfig) => void;
  preferences: Preferences;
  setPreferences: (x: Preferences) => void;
  tokenStats: TokenStats;
  onResetTokenStats: () => void;
  onExportChat: (format: 'json' | 'markdown' | 'text') => void;
  onImportChat: (jsonStr: string) => void;
  onClearAllData: () => void;
  back: () => void;
  onAbout: () => void;
}) {
  const TABS: { id: typeof tab; label: string; icon: typeof Settings }[] = [
    { id: 'provider', label: 'AI Provider & Models', icon: Sparkles },
    { id: 'tokensaver', label: 'Token Saver (~22%)', icon: Zap },
    { id: 'appearance', label: 'Themes & Customizer', icon: Palette },
    { id: 'pets', label: 'Companion Pets', icon: Cat },
    { id: 'thinking', label: 'Thinking Deliberation', icon: BrainCircuit },
    { id: 'persona', label: 'AI Persona & Creativity', icon: Sliders },
    { id: 'privacy', label: 'Data & Privacy', icon: ShieldCheck },
    { id: 'about', label: 'About & Ecosystem', icon: Orbit },
  ];

  return (
    <main className="settings-page">
      <header className="settings-header">
        <button className="back" onClick={back}>
          <ChevronLeft size={19} /> Back to Aplx
        </button>
        <div className="wordmark">
          <span>A</span> APLX
        </div>
        <div className="web-pill">
          WEB <i />
        </div>
      </header>
      <div className="settings-layout">
        <aside className="settings-nav">
          <p>SETTINGS HUB</p>
          <div className="space-y-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`settings-tab-btn ${tab === t.id ? 'selected' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <Icon size={16} className={t.id === 'tokensaver' ? 'text-emerald-400' : ''} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="settings-content">
          {tab === 'provider' && (
            <ProviderSettings
              config={providerConfig}
              onChange={onProviderChange}
              onSave={() => {}}
            />
          )}

          {tab === 'tokensaver' && (
            <TokenSaverSettings
              preferences={preferences}
              setPreferences={setPreferences}
              tokenStats={tokenStats}
              onResetTokenStats={onResetTokenStats}
            />
          )}

          {tab === 'appearance' && (
            <AppearanceSettings
              preferences={preferences}
              setPreferences={setPreferences}
            />
          )}

          {tab === 'pets' && (
            <PetSettings
              preferences={preferences}
              setPreferences={setPreferences}
            />
          )}

          {tab === 'thinking' && (
            <ThinkingSettings
              preferences={preferences}
              setPreferences={setPreferences}
            />
          )}

          {tab === 'persona' && (
            <PersonaSettings
              preferences={preferences}
              setPreferences={setPreferences}
            />
          )}

          {tab === 'privacy' && (
            <DataManagementSettings
              onExportChat={onExportChat}
              onImportChat={onImportChat}
              onClearAllData={onClearAllData}
            />
          )}

          {tab === 'about' && (
            <>
              <div className="section-kicker">ABOUT</div>
              <h2>Aplx Web</h2>
              <p className="lead">The browser-based, private member of the Aplx ecosystem.</p>
              <div className="about-grid">
                <div>
                  <small>VERSION</small>
                  <b>0.2.0 Peak Edition</b>
                </div>
                <div>
                  <small>BUILT BY</small>
                  <b>Korentic</b>
                </div>
                <div>
                  <small>MODE</small>
                  <b>Client-Side · Direct Routing</b>
                </div>
              </div>
              <button className="about-story-link" onClick={onAbout}>
                Read the full story <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <div className="credits">
                <div className="section-kicker">CREDITS</div>
                <h3>Built with the help of</h3>
                <p>
                  CodeX (GPT 5.6 Terra), Minimax-m3, Korentic (R3nz), Claude Opus and Sonnet 4.6, GitHub Copilot, and the open-source community.
                </p>
                <a href="https://github.com/Korentic/Aplx" target="_blank" rel="noreferrer">
                  Explore & install Aplx on GitHub ↗
                </a>
              </div>
              <p className="fine">
                Aplx Desktop supports offline + online workflows. Aplx Web runs purely in your browser and connects only to the provider credentials you configure.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Privacy({ back, settings, about }: { back: () => void; settings: () => void; about: () => void }) {
  return (
    <main className="privacy-page animate-fade-in-up">
      <nav>
        <div className="wordmark">
          <span>A</span> APLX
        </div>
        <div className="about-nav-actions">
          <button onClick={about}>About</button>
          <button className="nav-launch playful-btn" onClick={back}>
            Home
          </button>
        </div>
      </nav>
      <div className="privacy-hero animate-float-hero">
        <div className="eyebrow flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#8ea8ff] animate-twinkle" /> <span>PRIVACY & SECURITY</span>
        </div>
        <h1>
          Your key is <i className="lively-shimmer-text">yours.</i>
        </h1>
        <p>Aplx is deliberately built so your provider credentials never pass through an Aplx server.</p>
        <div className="details">
          <h3>Connection details</h3>
          <dl>
            <dt>Assistant</dt>
            <dd>Aplx (your interface)</dd>
            <dt>Model provider</dt>
            <dd>Your chosen provider</dd>
            <dt>Credential</dt>
            <dd>User-provided (Local)</dd>
            <dt>Request route</dt>
            <dd>Browser → your provider</dd>
            <dt>Aplx server access</dt>
            <dd>None</dd>
            <dt>API key stored by Aplx server</dt>
            <dd>No</dd>
          </dl>
        </div>
        <button className="primary playful-btn" onClick={settings}>
          Connect a provider <ArrowUp size={16} />
        </button>
      </div>
    </main>
  );
}
