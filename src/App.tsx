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
  HelpCircle,
  Gamepad2,
  Cpu,
  User,
  UserCheck,
} from 'lucide-react';
import { createProvider, isProviderReady } from './providers';
import type { ChatTurn } from './providers/types';
import { getProvider, type ProviderId } from './providers/registry';
import { clearLocalData, loadProviderConfig, saveProviderConfig, type ProviderConfig } from './lib/credential';
import { ChatModelSelect, ProviderSettings } from './components/ProviderSettings';
import { AboutPage } from './pages/AboutPage';
import { PetCompanion, type PetMood } from './components/PetCompanion';
import { PetArtwork } from './components/PetArtwork';
import { ThinkingIndicator } from './components/ThinkingIndicator';
import { TokenSaverBadge } from './components/TokenSaverBadge';
import { CodeBlock } from './components/CodeBlock';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { OfflineAccountModal } from './components/OfflineAccountModal';
import { InteractiveTourGuide } from './components/InteractiveTourGuide';
import { ApiKeyRequiredModal } from './components/ApiKeyRequiredModal';
import { detectLocalOfflineModels, getCachedLocalModels, type LocalDetectionResult } from './lib/localModelDetector';
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
import { loadUserProfile, saveUserProfile, isUserSetupComplete } from './lib/userProfile';
import type { View, Message, Preferences, TokenStats, UserProfile } from './types';

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

  // User Profile (Offline Account)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(loadUserProfile);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aplx:guide_dismissed') === 'true';
    } catch {
      return false;
    }
  });

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

  // Local Offline Model Auto-Detection & Key Enforcement State
  const [localDetection, setLocalDetection] = useState<LocalDetectionResult | null>(getCachedLocalModels);
  const [missingKeyModal, setMissingKeyModal] = useState<{
    isOpen: boolean;
    providerId: ProviderId;
    providerName: string;
  }>({
    isOpen: false,
    providerId: 'gemini',
    providerName: 'Google Gemini',
  });

  // Auto-detect local offline models on mount
  useEffect(() => {
    let isMounted = true;
    detectLocalOfflineModels(providerConfig.baseUrls?.ollama || providerConfig.baseUrl).then(res => {
      if (isMounted) {
        setLocalDetection(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Filtered conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchHistory.trim()) return conversations;
    const q = searchHistory.toLowerCase();
    return conversations.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchHistory]);

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
          content: `Welcome to **Aplx**.\n\nWhat would you like to explore or build today?`,
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

  // Launch button handler: checks if offline account setup is complete
  const handleLaunchApp = () => {
    if (!isUserSetupComplete()) {
      setShowAccountModal(true);
    } else {
      setView('chat');
    }
  };

  const handleAccountComplete = (profile: UserProfile, startTour: boolean) => {
    setUserProfile(profile);
    saveUserProfile(profile);
    setShowAccountModal(false);
    setView('chat');
    setGuideDismissed(true);
    try {
      localStorage.setItem('aplx:guide_dismissed', 'true');
    } catch {}
    if (startTour) {
      setShowTour(true);
    }
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

    if (!isUserSetupComplete()) {
      setShowAccountModal(true);
      return;
    }

    if (!isProviderReady(providerConfig)) {
      const activeDef = getProvider(providerConfig.provider);
      if (activeDef.requiresKey && (!providerConfig.apiKey || !providerConfig.apiKey.trim())) {
        setMissingKeyModal({
          isOpen: true,
          providerId: providerConfig.provider,
          providerName: activeDef.name,
        });
        return;
      }
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

    // 1. Optimize tokens & history via active Token Saver with model awareness
    let currentHistory: ChatTurn[] = [];
    const baseMessages = replaceId ? messages.filter(m => m.id !== replaceId) : messages;
    currentHistory = baseMessages.filter(m => m.content).map(({ role, content }) => ({ role, content }));

    const optimization = optimizeTokens(
      rawPrompt,
      currentHistory,
      preferences.tokenSaverMode,
      preferences.maxHistoryTurns,
      providerConfig.model
    );

    // Update global token stats & per-model stats
    if (preferences.tokenSaverMode !== 'off') {
      const prevModelStats = tokenStats.byModel?.[providerConfig.model] || { processed: 0, saved: 0 };
      const newStats: TokenStats = {
        totalTokensProcessed: tokenStats.totalTokensProcessed + optimization.originalTokens,
        totalTokensSaved: tokenStats.totalTokensSaved + optimization.tokensSaved,
        totalMessagesSent: tokenStats.totalMessagesSent + 1,
        byModel: {
          ...(tokenStats.byModel || {}),
          [providerConfig.model]: {
            processed: prevModelStats.processed + optimization.originalTokens,
            saved: prevModelStats.saved + optimization.tokensSaved,
          },
        },
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
      modelUsed: providerConfig.model,
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
                content:
                  'Unable to complete request. Please verify your API key and quota in Settings (Gear icon), or test connection.',
              }
            : x
        )
      );
      setPetMood('sleeping');
    } finally {
      setStreaming(false);
      setIsThinking(false);
    }
  };

  const regenerate = (id: string) => {
    const idx = messages.findIndex(m => m.id === id);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg?.role === 'user') {
      send(userMsg.content, id);
    }
  };

  const exportChat = (format: 'json' | 'markdown' | 'text') => {
    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(conversations, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'markdown') {
      content = `# ${currentConversation.title}\n\n` +
        messages
          .map(m => `### ${m.role === 'user' ? 'User' : 'Aplx'} (${m.time})\n\n${m.content}\n\n---`)
          .join('\n\n');
      mimeType = 'text/markdown';
      ext = 'md';
    } else {
      content = messages
        .map(m => `[${m.time}] ${m.role === 'user' ? 'User' : 'Aplx'}:\n${m.content}`)
        .join('\n\n---\n\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aplx-${currentConversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importChat = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].messages) {
        setConversations(parsed);
        saveConversations(parsed);
        setActiveConvId(parsed[0].id);
        setActiveConversationId(parsed[0].id);
        alert('Conversations imported successfully!');
      } else {
        alert('Invalid Aplx chat export format.');
      }
    } catch {
      alert('Could not parse JSON file.');
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to erase all chats, keys, and reset settings?')) {
      clearLocalData();
      localStorage.removeItem(preferenceKey);
      localStorage.removeItem('aplx:user_profile');
      window.location.reload();
    }
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Dynamic Theme CSS Custom Properties
  const themeClass = useMemo(() => {
    if (preferences.customTheme?.enabled) return 'custom-theme-active';
    return `theme-${preferences.theme}`;
  }, [preferences.theme, preferences.customTheme]);

  const customThemeStyles = useMemo(() => {
    if (!preferences.customTheme?.enabled) return {};
    const ct = preferences.customTheme;
    return {
      '--app-custom-bg': ct.backgroundTint,
      '--app-custom-gradient-start': ct.gradientStart,
      '--app-custom-gradient-end': ct.gradientEnd,
      '--app-custom-accent': ct.accentColor,
      '--app-custom-glow': ct.glowIntensity,
      '--theme-glow': `${ct.accentColor}44`,
    } as React.CSSProperties;
  }, [preferences.customTheme]);

  return (
    <div
      className={`app font-${preferences.font} bubble-${preferences.bubbleStyle} ${themeClass} ${
        preferences.compact ? 'compact' : ''
      } ${preferences.motion ? 'motion-on' : ''}`}
      style={customThemeStyles}
    >
      <SpaceBackground motion={preferences.motion} />

      {/* Floating Pet Companion if positioned as corner/floating */}
      {view === 'chat' && preferences.petPosition === 'bottom-right' && (
        <PetCompanion
          petId={preferences.petId}
          position="bottom-right"
          size={preferences.petSize}
          mood={petMood}
          soundEnabled={preferences.soundEffects}
          interactive={preferences.petInteractive}
        />
      )}

      {/* Offline Account Modal */}
      <OfflineAccountModal
        isOpen={showAccountModal}
        onComplete={handleAccountComplete}
        onClose={() => setShowAccountModal(false)}
        existingProfile={userProfile}
        soundEnabled={preferences.soundEffects}
      />

      {/* Interactive Video Game Tour Guide */}
      <InteractiveTourGuide
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        petId={preferences.petId}
        soundEnabled={preferences.soundEffects}
      />

      {/* Prompt Library Modal */}
      <PromptLibraryModal
        isOpen={showPromptLib}
        onClose={() => setShowPromptLib(false)}
        onSelectPrompt={p => {
          setInput(p);
          setShowPromptLib(false);
        }}
      />
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Missing Provider API Key Modal */}
      <ApiKeyRequiredModal
        isOpen={missingKeyModal.isOpen}
        onClose={() => setMissingKeyModal(prev => ({ ...prev, isOpen: false }))}
        providerId={missingKeyModal.providerId}
        providerConfig={providerConfig}
        onGoToSettings={provId => {
          setMissingKeyModal(prev => ({ ...prev, isOpen: false }));
          goSettings('provider');
        }}
        onSwitchToLocal={modelId => {
          setMissingKeyModal(prev => ({ ...prev, isOpen: false }));
          const targetModel = modelId || localDetection?.recommendedModel?.id || 'llama3.3';
          persistProvider({
            ...providerConfig,
            provider: 'ollama',
            model: targetModel,
            baseUrl: localDetection?.baseUrl || 'http://localhost:11434',
          });
        }}
        localDetection={localDetection}
      />

      {view === 'landing' && (
        <Landing
          launch={handleLaunchApp}
          settings={() => goSettings('provider')}
          privacy={() => setView('privacy')}
          about={() => setView('about')}
          petId={preferences.petId}
          soundEnabled={preferences.soundEffects}
          onOpenGuide={() => setShowTour(true)}
        />
      )}

      {view === 'chat' && (
        <>
          <aside className={'sidebar ' + (sidebar ? 'open' : '')}>
            <div className="brand flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView('landing')}
                className="flex items-center cursor-pointer hover:opacity-85 transition-opacity group text-left bg-transparent border-0 p-0 text-inherit"
                title="Go to Landing Page"
                aria-label="Go to Landing Page"
              >
                <span className="brand-mark group-hover:scale-105 transition-transform">A</span>
                <span className="group-hover:text-white transition-colors">APLX</span>
              </button>
              
              <div className="flex items-center gap-1.5">
                {/* Compact Clickable Avatar Button */}
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="profile-avatar-btn playful-pop group border border-[#26375a] hover:border-[#8ea8ff] bg-[#0c1322] transition-all cursor-pointer"
                  title={userProfile ? `${userProfile.name} (Click to manage profile)` : 'Click to create Offline Profile'}
                  aria-label="Account profile"
                >
                  <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1.5px] shadow-sm shadow-indigo-950/50 aspect-square flex-none overflow-hidden">
                    <div className="w-full h-full rounded-full bg-[#080d1a] flex items-center justify-center overflow-hidden text-xs aspect-square">
                      {userProfile?.avatarType === 'custom' && userProfile.avatar ? (
                        <img
                          src={userProfile.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover aspect-square rounded-full block"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs leading-none select-none">
                          {userProfile?.avatar === 'hacker'
                            ? '👾'
                            : userProfile?.avatar === 'wizard'
                            ? '🧙‍♂️'
                            : userProfile?.avatar === 'alchemist'
                            ? '🔮'
                            : userProfile?.avatar === 'architect'
                            ? '⚡'
                            : userProfile?.avatar === 'cat'
                            ? '🐱'
                            : userProfile?.avatar === 'fox'
                            ? '🦊'
                            : userProfile?.avatar === 'robot'
                            ? '🤖'
                            : '🧑‍🚀'}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Status dot */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#060913] ${
                      userProfile ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </button>

                <button className="close mobile" onClick={() => setSidebar(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <button className="new-chat playful-pop" onClick={handleCreateNewChat}>
              <MessageSquarePlus size={17} /> New conversation
            </button>

            {/* Conversation Search (Blended Dark Theme) */}
            <div className="px-1 my-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#090d16] border border-[#1f293d] text-xs text-[#7e92b8] focus-within:border-[#8ea8ff]">
                <Search size={13} className="text-[#64748b]" />
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
                  className={`group relative flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all playful-pop ${
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
              <button className="playful-pop" onClick={() => setShowTour(true)}>
                <Gamepad2 size={17} className="text-cyan-400" /> Interactive Guide
              </button>
              <button className="playful-pop" onClick={() => setShowPromptLib(true)}>
                <Sparkles size={17} className="text-[#8ea8ff]" /> Prompt Library
              </button>
              <button className="playful-pop" onClick={() => goSettings('tokensaver')}>
                <Zap size={17} className="text-emerald-400" /> Token Saver Active
              </button>
              <button className="playful-pop" onClick={() => goSettings('appearance')}>
                <Palette size={17} /> Themes & Styling
              </button>
              <button className="playful-pop" onClick={() => goSettings('pets')}>
                <Cat size={17} /> Companion Pets
              </button>
              <button className="playful-pop" onClick={() => setShowShortcuts(true)}>
                <Command size={17} /> Shortcuts
              </button>
              <button className="playful-pop" onClick={() => goSettings('provider')}>
                <Settings size={17} /> All Settings
              </button>
              <button className="playful-pop" onClick={() => setView('privacy')}>
                <ShieldCheck size={17} /> Privacy & security
              </button>
              <button className="playful-pop" onClick={() => setView('about')}>
                <Orbit size={17} /> About Aplx
              </button>
              <a className="github-side playful-pop" href="https://github.com/Korentic/Aplx" target="_blank" rel="noreferrer">
                Install Aplx ↗
              </a>
              <div className="web-status">
                <span /> Aplx Web <small>{getProvider(providerConfig.provider).name}</small>
              </div>
            </div>
          </aside>

          <main className="chat">
            {/* Sticky Model & Actions Header */}
            <header>
              <div className="flex items-center gap-3">
                <button
                  className="icon mobile hidden max-[760px]:inline-flex playful-pop"
                  onClick={() => setSidebar(true)}
                  title="Open Navigation"
                  aria-label="Open Navigation"
                >
                  <Menu size={18} />
                </button>
                <label className="model">
                  <span />
                  <ChatModelSelect
                    config={providerConfig}
                    detectedLocalModels={localDetection}
                    onRequireKeyPrompt={(provName, provId) => {
                      setMissingKeyModal({
                        isOpen: true,
                        providerId: provId,
                        providerName: provName,
                      });
                    }}
                    onModelChange={(m, provId) => {
                      const def = getProvider(provId);
                      const key =
                        providerConfig.apiKeys?.[provId] ||
                        (provId === providerConfig.provider ? providerConfig.apiKey : '');
                      const baseUrl =
                        providerConfig.baseUrls?.[provId] ||
                        def.baseUrl ||
                        'http://localhost:11434';
                      persistProvider({
                        ...providerConfig,
                        provider: provId,
                        model: m,
                        apiKey: key,
                        baseUrl,
                      });
                    }}
                  />
                </label>

                {/* Auto-detected Offline Models Chip (1-Click Switch) */}
                {localDetection?.isAvailable && localDetection.models.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const best = localDetection.recommendedModel || localDetection.models[0];
                      if (best) {
                        persistProvider({
                          ...providerConfig,
                          provider: 'ollama',
                          model: best.id,
                          baseUrl: localDetection.baseUrl || 'http://localhost:11434',
                        });
                      }
                    }}
                    className="playful-pop hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-semibold cursor-pointer shadow-sm shadow-cyan-950/40"
                    title={`⚡ ${localDetection.models.length} local models detected (${localDetection.provider === 'ollama' ? 'Ollama' : 'LM Studio'}). Click to switch to offline model.`}
                  >
                    <Cpu size={13} className="text-cyan-400" />
                    <span>⚡ {localDetection.models.length} Offline Model{localDetection.models.length > 1 ? 's' : ''} Ready</span>
                  </button>
                )}
              </div>

              <div className="header-actions items-center flex gap-2">
                {/* Minimalist Profile Picture Avatar in Header */}
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="profile-avatar-btn playful-pop group border border-[#233454] hover:border-[#8ea8ff] bg-[#0c1322] transition-all cursor-pointer flex-none"
                  title={userProfile ? `${userProfile.name} • Click to manage profile & avatar` : 'Offline Account • Click to customize'}
                  aria-label="Manage Account Profile"
                >
                  <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1.5px] shadow-sm shadow-indigo-950/40 aspect-square flex-none overflow-hidden">
                    <div className="w-full h-full rounded-full bg-[#080d1a] flex items-center justify-center overflow-hidden text-xs aspect-square">
                      {userProfile?.avatarType === 'custom' && userProfile.avatar ? (
                        <img
                          src={userProfile.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover aspect-square rounded-full block"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xs leading-none select-none">
                          {userProfile?.avatar === 'hacker'
                            ? '👾'
                            : userProfile?.avatar === 'wizard'
                            ? '🧙‍♂️'
                            : userProfile?.avatar === 'alchemist'
                            ? '🔮'
                            : userProfile?.avatar === 'architect'
                            ? '⚡'
                            : userProfile?.avatar === 'cat'
                            ? '🐱'
                            : userProfile?.avatar === 'fox'
                            ? '🦊'
                            : userProfile?.avatar === 'robot'
                            ? '🤖'
                            : '🧑‍🚀'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#090f1d] ${
                      userProfile ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </button>

                <TokenSaverBadge
                  mode={preferences.tokenSaverMode}
                  stats={tokenStats}
                  onOpenSettings={() => goSettings('tokensaver')}
                  onResetStats={setTokenStats}
                />
                <button className="icon playful-pop" title="Prompt Library (Ctrl+K)" onClick={() => setShowPromptLib(true)}>
                  <Sparkles size={18} />
                </button>
                <button className="icon playful-pop" title="Clear conversation" onClick={handleCreateNewChat}>
                  <Trash2 size={18} />
                </button>
                <button className="icon playful-pop" title="Settings" onClick={() => goSettings('provider')}>
                  <Settings size={18} />
                </button>
              </div>
            </header>

            {/* Centered Chat Messages */}
            <section className="messages">
              {messages.map(m => (
                <MessageView
                  key={m.id}
                  message={m}
                  userProfile={userProfile}
                  regenerate={() => regenerate(m.id)}
                  isThinking={isThinking && streaming && m.role === 'model' && !m.content}
                  thinkingStyle={preferences.thinkingStyle}
                  showThinkingTimer={preferences.showThinkingTimer}
                  onSpeak={() => toggleReadAloud(m)}
                  isSpeaking={speakingMsgId === m.id}
                  onEditPrompt={newPrompt => send(newPrompt, m.id)}
                />
              ))}

              {messages.length === 1 && (
                <PromptDeck
                  choose={send}
                  showGuideBanner={!userProfile && !guideDismissed}
                  onOpenGuide={() => setShowTour(true)}
                  onDismissGuide={() => {
                    setGuideDismissed(true);
                    try {
                      localStorage.setItem('aplx:guide_dismissed', 'true');
                    } catch {}
                  }}
                />
              )}
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
                <div className="max-w-[820px] mx-auto mb-1 px-4 flex items-center gap-2 text-xs text-[#8ea8ff]">
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
                onOpenHelp={() => setShowTour(true)}
                onToggleVoice={toggleVoiceInput}
                isRecordingVoice={isRecordingVoice}
                onAttachFile={() => fileInputRef.current?.click()}
                onOpenTokenSaver={() => goSettings('tokensaver')}
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
          launch={handleLaunchApp}
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
  petId = 'fox',
  soundEnabled,
  onOpenGuide,
}: {
  launch: () => void;
  settings: () => void;
  privacy: () => void;
  about: () => void;
  petId?: string;
  soundEnabled?: boolean;
  onOpenGuide?: () => void;
}) {
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);

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
        <div className="flex items-center gap-4">
          <button onClick={about} className="playful-pop text-xs text-[#a0b0d0] hover:text-white px-3 py-1.5">
            About
          </button>
          <button onClick={privacy} className="playful-pop text-xs text-[#a0b0d0] hover:text-white px-3 py-1.5">
            Privacy
          </button>
          <button onClick={launch} className="nav-launch playful-pop">
            Launch Aplx <ArrowUp size={14} />
          </button>
        </div>
      </nav>
      <div className="hero animate-float-hero">
        <div className="eyebrow flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-[#8ea8ff] animate-twinkle" />
          <span>PRIVATE AI WORKSTATION</span>
          {/* Playful Floating Pet Mascot on Hero */}
          <span
            onClick={handleMascotClick}
            title="Click me for pets! ✨"
            className="relative cursor-pointer inline-block select-none playful-pop ml-1"
          >
            <PetArtwork petId={petId as any} size={28} mood="happy" />
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
          Aplx gives you multi-model AI flexibility, interactive companion pets, token saving algorithms, prompt templates, and direct local browser routing.
        </p>
        <div className="hero-actions">
          <button className="primary playful-pop" onClick={launch}>
            Launch Aplx <ArrowUp size={16} />
          </button>
          {onOpenGuide && (
            <button className="secondary playful-pop" onClick={onOpenGuide}>
              <Gamepad2 size={16} className="text-cyan-400" /> Interactive Guide
            </button>
          )}
          <button className="secondary playful-pop" onClick={settings}>
            <KeyRound size={16} /> Connect a provider
          </button>
        </div>
        <div className="trust">
          <span className="playful-pop">
            <ShieldCheck size={17} /> 100% Offline Profile & Key Security
          </span>
          <span className="playful-pop">
            <Zap size={17} /> Token Saver ~22%
          </span>
          <span className="playful-pop">
            <Orbit size={17} /> Browser → Provider Direct
          </span>
          <span className="playful-pop">
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

function PromptDeck({
  choose,
  showGuideBanner,
  onOpenGuide,
  onDismissGuide,
}: {
  choose: (prompt: string) => void;
  showGuideBanner?: boolean;
  onOpenGuide?: () => void;
  onDismissGuide?: () => void;
}) {
  const prompts = [
    ['Plan a project', 'Turn an idea into a clear plan.', Telescope],
    ['Explain a concept', 'Learn something with useful examples.', BookOpen],
    ['Write some code', 'Build, debug, or refactor together.', Code2],
    ['Explore an idea', 'Think through the possibilities.', WandSparkles],
  ] as const;
  return (
    <div className="space-y-4">
      {showGuideBanner && onOpenGuide && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-[#10172b] to-purple-950/60 border border-indigo-500/30 flex items-center justify-between gap-4 relative animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-cyan-300 flex-none">
              <Gamepad2 size={20} />
            </div>
            <div>
              <b className="text-sm text-white block">New to Aplx? Start Interactive Walkthrough</b>
              <span className="text-xs text-[#8ea0c2]">Learn about multi-model switching, token savings, and pets!</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <button
              type="button"
              onClick={onOpenGuide}
              className="playful-pop px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-indigo-100 cursor-pointer"
            >
              Start Guide →
            </button>
            {onDismissGuide && (
              <button
                type="button"
                onClick={onDismissGuide}
                className="playful-pop p-1.5 rounded-lg text-xs text-[#7f94bc] hover:text-white hover:bg-white/10 cursor-pointer"
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="prompt-deck">
        {prompts.map(([title, body, Icon]) => (
          <button onClick={() => choose(`${title}: ${body}`)} key={title} className="playful-pop">
            <Icon size={17} />
            <b>{title}</b>
            <span>{body}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageView({
  message,
  userProfile,
  regenerate,
  isThinking,
  thinkingStyle,
  showThinkingTimer,
  onSpeak,
  isSpeaking,
  onEditPrompt,
}: {
  message: Message;
  userProfile?: UserProfile | null;
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

  const renderAvatar = () => {
    if (message.role === 'user') {
      if (userProfile?.avatarType === 'custom' && userProfile.avatar) {
        return (
          <img
            src={userProfile.avatar}
            alt="You"
            className="w-full h-full object-cover rounded-lg aspect-square"
            referrerPolicy="no-referrer"
          />
        );
      }
      if (userProfile?.avatar) {
        const p = userProfile.avatar;
        return (
          <span className="text-sm select-none">
            {p === 'hacker' ? '👾' : p === 'wizard' ? '🧙‍♂️' : p === 'alchemist' ? '🔮' : p === 'architect' ? '⚡' : p === 'cat' ? '🐱' : p === 'fox' ? '🦊' : p === 'robot' ? '🤖' : '🧑‍🚀'}
          </span>
        );
      }
      return 'Y';
    }
    return 'A';
  };

  return (
    <article className={'message ' + message.role}>
      <div className="avatar">{renderAvatar()}</div>
      <div className="message-body">
        <div className="message-meta flex items-center justify-between">
          <div>
            {message.role === 'user' ? (userProfile?.name || 'You') : 'Aplx'}{' '}
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
              <button
                type="submit"
                className="playful-pop px-3 py-1 bg-[#8ea8ff] text-[#0a1020] rounded-md text-xs font-bold"
              >
                Save & Resend
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="playful-pop px-3 py-1 bg-[#1a233a] text-[#8ea8ff] rounded-md text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <Mark text={message.content} />
        )}

        {/* Message Action Tools */}
        {message.content && !isThinking && (
          <div className="message-tools">
            <button onClick={copy} title="Copy text" className="playful-pop">
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            {message.role === 'model' && (
              <>
                <button onClick={regenerate} title="Regenerate response" className="playful-pop">
                  <RotateCcw size={13} />
                  Retry
                </button>
                <button onClick={onSpeak} title="Read aloud (Text to Speech)" className="playful-pop">
                  {isSpeaking ? <VolumeX size={13} className="text-amber-400" /> : <Volume2 size={13} />}
                  {isSpeaking ? 'Stop' : 'Listen'}
                </button>
              </>
            )}

            {message.role === 'user' && (
              <button onClick={() => setIsEditing(true)} title="Edit prompt" className="playful-pop">
                <Pencil size={13} />
                Edit
              </button>
            )}
          </div>
        )}
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
  onOpenHelp,
  onToggleVoice,
  isRecordingVoice,
  onAttachFile,
  onOpenTokenSaver,
}: {
  value: string;
  change: (x: string) => void;
  send: () => void;
  stop: () => void;
  streaming: boolean;
  sendOnEnter: boolean;
  onOpenPrompts: () => void;
  onOpenHelp: () => void;
  onToggleVoice: () => void;
  isRecordingVoice: boolean;
  onAttachFile: () => void;
  onOpenTokenSaver: () => void;
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
      <div className="composer">
        {/* Helper Action Quick Ribbon */}
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={onOpenHelp}
            className="playful-pop text-[11px] font-medium px-3 py-1 rounded-full bg-[#121827] border border-[#2b395b] hover:border-[#8ea8ff] text-[#9db2dc] hover:text-[#edf3ff] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Interactive Help & Guide"
          >
            <HelpCircle size={12} className="text-cyan-400" />
            <span>Guide & Help</span>
          </button>
          <button
            type="button"
            onClick={onOpenPrompts}
            className="playful-pop text-[11px] font-medium px-3 py-1 rounded-full bg-[#121827] border border-[#222c42] hover:border-[#8ea8ff] text-[#7d92bb] hover:text-[#edf3ff] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Prompt Template Library"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span>Prompt Library (Ctrl+K)</span>
          </button>
          <button
            type="button"
            onClick={onOpenTokenSaver}
            className="playful-pop text-[11px] font-medium px-3 py-1 rounded-full bg-[#0c1616] border border-[#1b3a2e] text-emerald-400 flex items-center gap-1.5 transition-all ml-auto cursor-pointer"
            title="Token Saver Active"
          >
            <Zap size={11} />
            <span>Token Saver Active</span>
          </button>
        </div>

        <div className="flex items-end gap-2">
          {/* Quick Tools */}
          <div className="flex items-center gap-1 pb-1">
            <button
              type="button"
              onClick={onAttachFile}
              title="Attach file (text/code/json)"
              className="playful-pop p-1.5 text-[#7385a8] hover:text-[#dce5fb] hover:bg-[#192238] rounded-lg transition-colors cursor-pointer"
            >
              <Paperclip size={16} />
            </button>
            <button
              type="button"
              onClick={onOpenPrompts}
              title="Open Prompt Library (Ctrl+K)"
              className="playful-pop p-1.5 text-[#7385a8] hover:text-[#8ea8ff] hover:bg-[#192238] rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles size={16} />
            </button>
            <button
              type="button"
              onClick={onToggleVoice}
              title={isRecordingVoice ? 'Stop voice recording' : 'Dictate with voice'}
              className={`playful-pop p-1.5 rounded-lg transition-colors cursor-pointer ${
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
            <button className="send stop playful-pop" onClick={stop} aria-label="Stop generating">
              <span />
            </button>
          ) : (
            <button className="send playful-pop" disabled={!value.trim()} onClick={send} aria-label="Send message">
              <ArrowUp size={18} />
            </button>
          )}
        </div>
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
  const SECTIONS = [
    {
      title: 'AI Engines & Efficiency',
      items: [
        { id: 'provider' as const, label: 'AI Provider & Models', icon: Sparkles, badge: '8 APIs', color: 'text-indigo-400' },
        { id: 'tokensaver' as const, label: 'Token Saver Engine', icon: Zap, badge: '⚡ ~22%', color: 'text-emerald-400' },
      ],
    },
    {
      title: 'Look & Companions',
      items: [
        { id: 'appearance' as const, label: 'Themes & Customizer', icon: Palette, badge: '8 Themes', color: 'text-purple-400' },
        { id: 'pets' as const, label: 'Companion Pets', icon: Cat, badge: 'Interactive', color: 'text-amber-400' },
        { id: 'thinking' as const, label: 'Thinking Deliberation', icon: BrainCircuit, badge: '5 Styles', color: 'text-cyan-400' },
        { id: 'persona' as const, label: 'AI Persona & Creativity', icon: Sliders, badge: '7 Modes', color: 'text-pink-400' },
      ],
    },
    {
      title: 'Security & Platform',
      items: [
        { id: 'privacy' as const, label: 'Data & Privacy Hub', icon: ShieldCheck, badge: '100% Client', color: 'text-emerald-400' },
        { id: 'about' as const, label: 'About & Ecosystem', icon: Orbit, badge: 'v0.2.0', color: 'text-blue-400' },
      ],
    },
  ];

  return (
    <main className="settings-page animate-fade-in">
      <header className="settings-header">
        <button className="back playful-pop" onClick={back}>
          <ChevronLeft size={18} />
          <span>Back to Workspace</span>
        </button>
        <div className="wordmark flex items-center gap-2">
          <span>A</span> APLX <span className="text-xs font-mono font-normal text-[#8ea8ff] bg-[#14203d] border border-[#233560] px-2 py-0.5 rounded-full">SETTINGS HUB</span>
        </div>
        <div className="web-pill flex items-center gap-2">
          <span>SECURE & OFFLINE</span> <i />
        </div>
      </header>
      <div className="settings-layout">
        <aside className="settings-nav">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1b2848]">
            <div className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#8ea8ff] shadow-sm shadow-[#8ea8ff]" />
              <span>PREFERENCES</span>
            </div>
            <span className="text-[10px] font-mono text-[#7d93be] bg-[#11192e] px-2 py-0.5 rounded border border-[#203055]">
              Local Storage
            </span>
          </div>

          <div className="space-y-4">
            {SECTIONS.map((sec, idx) => (
              <div key={idx}>
                <div className="settings-nav-section-title">{sec.title}</div>
                <div className="space-y-1">
                  {sec.items.map(t => {
                    const Icon = t.icon;
                    const isSelected = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        className={`settings-tab-btn playful-pop ${isSelected ? 'selected' : ''}`}
                        onClick={() => setTab(t.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon size={16} className={`${t.color} flex-none`} />
                          <span className="truncate">{t.label}</span>
                        </div>
                        {t.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium flex-none ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#121a30] text-[#7f94be] border border-[#202e4f]'
                            }`}
                          >
                            {t.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Luxury System Status Micro-Panel */}
          <div className="mt-6 pt-4 border-t border-[#182544] space-y-2 text-[11px] text-[#798eb4]">
            <div className="flex items-center justify-between">
              <span>Client Routing</span>
              <span className="text-emerald-400 font-mono font-semibold">● Direct API</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Retention</span>
              <span className="text-[#a4b8df] font-mono">Browser-Only</span>
            </div>
          </div>
        </aside>

        <section className="settings-content">
          <div className="rounded-3xl bg-[#090e1b]/80 border border-[#1d2c4b] p-6 sm:p-9 shadow-2xl shadow-black/60 backdrop-blur-md">
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
              <div className="space-y-6">
                <div>
                  <div className="section-kicker">ABOUT</div>
                  <h2>Aplx Web</h2>
                  <p className="lead">The browser-based, private member of the Aplx ecosystem.</p>
                </div>
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
                <button className="about-story-link playful-pop" onClick={onAbout}>
                  Read the full story <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <div className="credits">
                  <div className="section-kicker">CREDITS</div>
                  <h3>Built with the help of</h3>
                  <p>
                    R3nz (developer) , Github copilot, Claude Sonnet and Haiku and Opus models, CodeX (GPT-5.6), Kimi K3, GPT-4, minimax-m3, Grok, Le chat Mistral, Gemini, and many more AIs!
                  </p>
                  <a href="https://github.com/Korentic/Aplx" target="_blank" rel="noreferrer" className="playful-pop">
                    Explore & install Aplx on GitHub ↗
                  </a>
                </div>
                <p className="fine">
                  Aplx Desktop supports offline + online workflows. Aplx Web runs purely in your browser and connects only to the provider credentials you configure.
                </p>
              </div>
            )}
          </div>
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
          <button onClick={about} className="playful-pop">About</button>
          <button className="nav-launch playful-pop" onClick={back}>
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
        <button className="primary playful-pop" onClick={settings}>
          Connect a provider <ArrowUp size={16} />
        </button>
      </div>
    </main>
  );
}
