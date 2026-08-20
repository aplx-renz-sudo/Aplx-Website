import { useState } from 'react';
import {
  Palette,
  Sparkles,
  Zap,
  Cat,
  Cpu,
  UserCheck,
  ShieldCheck,
  Orbit,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  Check,
  Download,
  Upload,
  Copy,
  Layers,
  Flame,
  Terminal,
  BrainCircuit,
  MessageSquare,
} from 'lucide-react';
import type {
  Preferences,
  ThemePreset,
  FontPreset,
  BubbleStyle,
  PetId,
  PetPosition,
  ThinkingStyle,
  TokenSaverMode,
  PersonaId,
  TokenStats,
} from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';
import { PetCompanion } from './PetCompanion';
import { PetArtwork } from './PetArtwork';
import { sounds } from '../lib/audio';

type CustomizerProps = {
  preferences: Preferences;
  setPreferences: (next: Preferences) => void;
  tokenStats: TokenStats;
  onResetTokenStats: () => void;
  onExportChat: (format: 'json' | 'markdown' | 'text') => void;
  onImportChat: (jsonStr: string) => void;
};

export const THEME_PRESETS: { id: ThemePreset; name: string; desc: string; colors: string[] }[] = [
  { id: 'black', name: 'Pure Black (OLED)', desc: 'Ultra-deep pure darkness', colors: ['#030303', '#121212', '#9eb8ff'] },
  { id: 'midnight', name: 'Midnight Navy', desc: 'Cosmic deep oceanic blue', colors: ['#050915', '#0c162d', '#7ba4ff'] },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Futuristic neon magenta & cyan', colors: ['#08040d', '#200e31', '#ff007f'] },
  { id: 'emerald', name: 'Matrix Emerald', desc: 'Deep bioluminescent emerald', colors: ['#020b06', '#062013', '#00f59b'] },
  { id: 'nebula', name: 'Nebula Purple', desc: 'Amethyst cosmic stardust', colors: ['#0a0514', '#1f1035', '#b388ff'] },
  { id: 'solar', name: 'Solar Flare', desc: 'Warm celestial amber & gold', colors: ['#0d0803', '#261505', '#ff9f43'] },
  { id: 'crimson', name: 'Crimson Velvet', desc: 'Deep ruby and rose nebula', colors: ['#0d0406', '#260c13', '#ff4757'] },
  { id: 'polar', name: 'Polar Frost', desc: 'Clean high-contrast titanium dark', colors: ['#090b0e', '#131922', '#70a1ff'] },
];

export const PET_LIST: { id: PetId; name: string; desc: string; emoji: string }[] = [
  { id: 'fox', name: 'Cyber Fox', desc: 'Clever navigator of the neural web', emoji: '🦊' },
  { id: 'cat', name: 'Celestial Cat', desc: 'Cosmic feline purring in the void', emoji: '🐾' },
  { id: 'bunny', name: 'Pixel Bunny', desc: 'Bouncing token harvester with rockets', emoji: '🐰' },
  { id: 'dragon', name: 'Cosmic Dragon', desc: 'Guardian of private model credentials', emoji: '🐉' },
  { id: 'slime', name: 'Slime Bob', desc: 'Squishy, happy blob of compressed memory', emoji: '💧' },
  { id: 'robo', name: 'Robo Orb', desc: 'Autonomous drone with telemetry analytics', emoji: '🤖' },
  { id: 'shiba', name: 'Shiba Sparky', desc: 'Astronaut doge on a space mission', emoji: '🐕' },
  { id: 'none', name: 'No Companion', desc: 'Clean, minimalist workspace', emoji: '🚫' },
];

export const THINKING_STYLES: { id: ThinkingStyle; name: string; desc: string }[] = [
  { id: 'orbital', name: 'Orbital Rings', desc: 'Concentric spinning pulsar rings with orbital nodes' },
  { id: 'synaptic', name: 'Synaptic Waveform', desc: 'Rhythmic pulsing neural frequency bars' },
  { id: 'matrix', name: 'Matrix Terminal', desc: 'Cyber cascade terminal tokens' },
  { id: 'shimmer', name: 'Holo Shimmer', desc: 'Radiant continuous light shimmer gradient' },
  { id: 'minimal', name: 'Minimal Cadence', desc: 'Clean, unobtrusive three-dot pulse' },
];

export const PERSONAS: { id: PersonaId; name: string; desc: string; prompt: string }[] = [
  {
    id: 'helpful',
    name: 'Helpful Assistant (Default)',
    desc: 'Balanced, insightful, empathetic, and comprehensive',
    prompt: 'You are Aplx, a brilliant, private, and precise AI assistant.',
  },
  {
    id: 'architect',
    name: 'Senior Software Architect',
    desc: 'Laser-focused on high-performance code, clean abstractions, and patterns',
    prompt: 'You are an elite Staff Software Architect. Provide production-grade, bug-free, and idiomatic code with concise technical explanations.',
  },
  {
    id: 'concise',
    name: 'Concise & Direct',
    desc: 'Zero fluff, straight-to-the-point executive bullet summaries',
    prompt: 'Be concise, direct, and factual. Omit conversational filler. Prioritize bullet points and precise facts.',
  },
  {
    id: 'creative',
    name: 'Creative Storyteller',
    desc: 'Vivid imagery, rich narrative vocabulary, and inventive metaphors',
    prompt: 'You are a master creative writer and worldbuilder. Write with vivid, evocative language and compelling narrative arcs.',
  },
  {
    id: 'academic',
    name: 'Academic Researcher',
    desc: 'Rigorous explanations, step-by-step logic, and deep analytical depth',
    prompt: 'You are a rigorous research scholar. Provide deep mathematical or conceptual justifications with clear deductive reasoning.',
  },
  {
    id: 'hacker',
    name: 'Cyberpunk Hacker',
    desc: 'Terminal-flavored, low-level technical insight and systems mastery',
    prompt: 'You are a cyberpunk systems engineer. Speak with high technical depth, systems-level awareness, and crisp efficiency.',
  },
  {
    id: 'custom',
    name: 'Custom System Instructions',
    desc: 'Fully define your own system persona prompt below',
    prompt: '',
  },
];

export function AppearanceSettings({ preferences, setPreferences }: { preferences: Preferences; setPreferences: (p: Preferences) => void }) {
  const custom = preferences.customTheme;

  const updateCustom = (patch: Partial<typeof custom>) => {
    setPreferences({
      ...preferences,
      customTheme: { ...custom, ...patch, enabled: true },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="section-kicker">THEME & COLOR SCHEME</div>
        <h2>Aesthetic Presets</h2>
        <p className="lead">Select a crafted color atmosphere or build your own custom gradient palette.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-5">
          {THEME_PRESETS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setPreferences({
                  ...preferences,
                  theme: t.id,
                  customTheme: { ...preferences.customTheme, enabled: false },
                });
              }}
              className={`p-3.5 rounded-2xl text-left border transition-all ${
                preferences.theme === t.id && !preferences.customTheme.enabled
                  ? 'border-[#8ea8ff] bg-[#121c32] ring-1 ring-[#8ea8ff] shadow-lg shadow-[#8ea8ff]/10'
                  : 'border-[#1b253b] bg-[#090d18] hover:border-[#32456e]'
              }`}
            >
              <div
                className="h-9 w-full rounded-xl mb-2.5 flex items-center justify-end px-2.5 shadow-inner"
                style={{ background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 50%, ${t.colors[2]} 100%)` }}
              >
                <div className="w-3 h-3 rounded-full shadow-md" style={{ background: t.colors[2] }} />
              </div>
              <b className="text-xs font-semibold text-[#eef3ff] block truncate">{t.name}</b>
              <span className="text-[11px] text-[#788bb0] block line-clamp-1 mt-0.5">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Gradient & Color Builder */}
      <div className="p-6 rounded-2xl bg-[#0b101e]/90 border border-[#1f2d4a] shadow-xl shadow-black/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8ea8ff]/15 border border-[#8ea8ff]/30 flex items-center justify-center text-[#8ea8ff]">
              <Palette size={18} />
            </div>
            <div>
              <b className="text-sm text-[#eef3ff]">Custom Gradient & Accent Studio</b>
              <p className="text-xs text-[#8092b6]">Design your personal gradient aura and custom accents</p>
            </div>
          </div>
          <button
            type="button"
            className={`toggle ${custom.enabled ? 'on' : ''}`}
            onClick={() => updateCustom({ enabled: !custom.enabled })}
            aria-pressed={custom.enabled}
          >
            <i />
          </button>
        </div>

        {custom.enabled && (
          <div className="space-y-4 pt-4 border-t border-[#1d273e]">
            {/* Live Gradient Preview Box */}
            <div
              className="h-20 w-full rounded-xl flex items-center justify-between px-5 border border-white/15 shadow-2xl transition-all"
              style={{
                background: `linear-gradient(${custom.gradientAngle}deg, ${custom.gradientStart} 0%, ${custom.gradientEnd} 100%)`,
              }}
            >
              <span className="text-xs font-mono font-bold text-white drop-shadow-md tracking-wider">
                LIVE PALETTE PREVIEW
              </span>
              <span
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white shadow-lg backdrop-blur-md"
                style={{ background: custom.accentColor }}
              >
                Custom Accent
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="field-label">GRADIENT START</label>
                <div className="flex items-center gap-2 bg-[#070b14] p-2.5 rounded-xl border border-[#23314d]">
                  <input
                    type="color"
                    value={custom.gradientStart}
                    onChange={e => updateCustom({ gradientStart: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={custom.gradientStart}
                    onChange={e => updateCustom({ gradientStart: e.target.value })}
                    className="bg-transparent text-xs font-mono text-white outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">GRADIENT END</label>
                <div className="flex items-center gap-2 bg-[#070b14] p-2.5 rounded-xl border border-[#23314d]">
                  <input
                    type="color"
                    value={custom.gradientEnd}
                    onChange={e => updateCustom({ gradientEnd: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={custom.gradientEnd}
                    onChange={e => updateCustom({ gradientEnd: e.target.value })}
                    className="bg-transparent text-xs font-mono text-white outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">ACCENT COLOR</label>
                <div className="flex items-center gap-2 bg-[#070b14] p-2.5 rounded-xl border border-[#23314d]">
                  <input
                    type="color"
                    value={custom.accentColor}
                    onChange={e => updateCustom({ accentColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={custom.accentColor}
                    onChange={e => updateCustom({ accentColor: e.target.value })}
                    className="bg-transparent text-xs font-mono text-white outline-none w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-[#8da0c4] mb-1">
                  <span>Gradient Angle</span>
                  <span className="font-mono">{custom.gradientAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={custom.gradientAngle}
                  onChange={e => updateCustom({ gradientAngle: Number(e.target.value) })}
                  className="w-full accent-[#8ea8ff]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#8da0c4] mb-1">
                  <span>Glow Aura Intensity</span>
                  <span className="font-mono">{custom.glowIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={custom.glowIntensity}
                  onChange={e => updateCustom({ glowIntensity: Number(e.target.value) })}
                  className="w-full accent-[#8ea8ff]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Typography & Chat Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-[#0b101e]/80 border border-[#1d2b48]">
          <label className="field-label">TYPOGRAPHY PAIRING</label>
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {[
              { id: 'dm-sans', name: 'DM Sans (Modern)', fontClass: 'font-sans' },
              { id: 'mono', name: 'DM Mono (Code)', fontClass: 'font-mono' },
              { id: 'editorial', name: 'Editorial Serif', fontClass: 'font-serif' },
              { id: 'system', name: 'System Native', fontClass: 'font-system' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPreferences({ ...preferences, font: f.id as FontPreset })}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  preferences.font === f.id
                    ? 'border-[#8ea8ff] bg-[#141f38] text-[#edf3ff] font-semibold'
                    : 'border-[#1e2a44] bg-[#070b14] text-[#8e9ebc] hover:border-[#33466d]'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b101e]/80 border border-[#1d2b48]">
          <label className="field-label">MESSAGE BUBBLE STYLE</label>
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {[
              { id: 'glass', name: 'Glassmorphic Aura' },
              { id: 'minimal', name: 'Minimal Flush' },
              { id: 'cyber', name: 'Cyber Bordered' },
              { id: 'capsule', name: 'Capsule Soft' },
            ].map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setPreferences({ ...preferences, bubbleStyle: b.id as BubbleStyle })}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  preferences.bubbleStyle === b.id
                    ? 'border-[#8ea8ff] bg-[#141f38] text-[#edf3ff] font-semibold'
                    : 'border-[#1e2a44] bg-[#070b14] text-[#8e9ebc] hover:border-[#33466d]'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* General Toggles */}
      <div className="p-5 rounded-2xl bg-[#0b101e]/80 border border-[#1d2b48] space-y-4">
        <div className="preference">
          <div>
            <b>Ambient Orbital Parallax</b>
            <p>Gentle celestial background parallax moving on mouse hover.</p>
          </div>
          <button
            type="button"
            className={`toggle ${preferences.motion ? 'on' : ''}`}
            onClick={() => setPreferences({ ...preferences, motion: !preferences.motion })}
            aria-pressed={preferences.motion}
          >
            <i />
          </button>
        </div>

        <div className="preference">
          <div>
            <b>Compact Chat Mode</b>
            <p>Reduces message vertical padding for high information density.</p>
          </div>
          <button
            type="button"
            className={`toggle ${preferences.compact ? 'on' : ''}`}
            onClick={() => setPreferences({ ...preferences, compact: !preferences.compact })}
            aria-pressed={preferences.compact}
          >
            <i />
          </button>
        </div>

        <div className="preference">
          <div>
            <b>Interactive Audio Effects</b>
            <p>Plays subtle synthesized tones on message send, receive, and pet taps.</p>
          </div>
          <button
            type="button"
            className={`toggle ${preferences.soundEffects ? 'on' : ''}`}
            onClick={() => {
              if (!preferences.soundEffects) sounds.playClick();
              setPreferences({ ...preferences, soundEffects: !preferences.soundEffects });
            }}
            aria-pressed={preferences.soundEffects}
          >
            <i />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TokenSaverSettings({
  preferences,
  setPreferences,
  tokenStats,
  onResetTokenStats,
}: {
  preferences: Preferences;
  setPreferences: (p: Preferences) => void;
  tokenStats: TokenStats;
  onResetTokenStats: () => void;
}) {
  const mode = preferences.tokenSaverMode;

  const MODES: { id: TokenSaverMode; name: string; percent: string; desc: string }[] = [
    {
      id: 'balanced',
      name: 'Balanced Saver (Recommended)',
      percent: '~22% saved',
      desc: 'Normalizes whitespace, strips repetitive assistant fluff, optimizes deep turn history without semantic loss.',
    },
    {
      id: 'aggressive',
      name: 'Aggressive Saver',
      percent: '~32% saved',
      desc: 'Truncates older code blocks in history, enforces strict 6-turn context window, condenses prompts.',
    },
    {
      id: 'light',
      name: 'Light Optimization',
      percent: '~12% saved',
      desc: 'Gentle whitespace and duplicate punctuation compression. Preserves 100% of historical text verbatim.',
    },
    {
      id: 'off',
      name: 'Disabled',
      percent: '0% saved',
      desc: 'Raw message history sent directly with no modifications.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="section-kicker">AI EFFICIENCY & CONSERVATION</div>
        <h2>Token Saver Optimization</h2>
        <p className="lead">
          Significantly decrease quota exhaustion, reduce latency, and extend chat lifespan by pruning redundant context tokens before sending to LLM endpoints.
        </p>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0a121e]/90 border border-[#1b3050] shadow-xl shadow-black/30">
          <span className="text-xs font-semibold text-[#7d93be] uppercase tracking-wider block">Total Tokens Saved</span>
          <b className="text-3xl font-mono text-emerald-400 block my-2">
            {tokenStats.totalTokensSaved.toLocaleString()}
          </b>
          <span className="text-xs text-[#5e77a4]">
            ~{tokenStats.totalTokensProcessed > 0 ? Math.round((tokenStats.totalTokensSaved / tokenStats.totalTokensProcessed) * 100) : 22}% average reduction
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a121e]/90 border border-[#1b3050] shadow-xl shadow-black/30">
          <span className="text-xs font-semibold text-[#7d93be] uppercase tracking-wider block">Processed Requests</span>
          <b className="text-3xl font-mono text-[#dce6ff] block my-2">
            {tokenStats.totalMessagesSent.toLocaleString()}
          </b>
          <span className="text-xs text-[#5e77a4]">optimized message turns</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a121e]/90 border border-[#1b3050] shadow-xl shadow-black/30">
          <span className="text-xs font-semibold text-[#7d93be] uppercase tracking-wider block">Estimated Quota Saved</span>
          <b className="text-3xl font-mono text-indigo-300 block my-2">
            ~{((tokenStats.totalTokensSaved / 1000) * 0.0015).toFixed(4)} USD
          </b>
          <span className="text-xs text-[#5e77a4]">standard tier cost equivalent</span>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="space-y-3">
        <label className="field-label">SELECT OPTIMIZATION LEVEL</label>
        <div className="space-y-3">
          {MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPreferences({ ...preferences, tokenSaverMode: m.id })}
              className={`w-full p-4 sm:p-5 rounded-2xl text-left border flex items-start justify-between gap-4 transition-all ${
                mode === m.id
                  ? 'border-emerald-400/80 bg-[#0c1e18] ring-1 ring-emerald-400 shadow-xl shadow-emerald-950/40'
                  : 'border-[#1a253c] bg-[#070b14] hover:border-[#2f426a]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <b className="text-sm font-semibold text-[#eef4ff]">{m.name}</b>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                    {m.percent}
                  </span>
                </div>
                <p className="text-xs text-[#8397be] mt-1.5 leading-relaxed">{m.desc}</p>
              </div>
              {mode === m.id && <Check size={20} className="text-emerald-400 flex-none" />}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced sliding window slider */}
      <div className="p-6 rounded-2xl bg-[#080c16]/90 border border-[#1b263f] shadow-lg space-y-2">
        <div className="flex justify-between text-xs text-[#8da0c4] mb-2">
          <b className="text-sm text-[#dce6ff]">Context Window Sliding History Limit</b>
          <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-600/30 px-2 py-0.5 rounded">
            {preferences.maxHistoryTurns} turns
          </span>
        </div>
        <input
          type="range"
          min="2"
          max="30"
          value={preferences.maxHistoryTurns}
          onChange={e => setPreferences({ ...preferences, maxHistoryTurns: Number(e.target.value) })}
          className="w-full accent-emerald-400"
        />
        <p className="text-xs text-[#7185aa] mt-1 leading-relaxed">
          Higher values maintain longer conversational memory; lower values drastically conserve tokens.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onResetTokenStats}
          className="text-xs text-rose-300 hover:text-rose-200 underline inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw size={13} /> Reset token conservation counters
        </button>
      </div>
    </div>
  );
}

export function PetSettings({ preferences, setPreferences }: { preferences: Preferences; setPreferences: (p: Preferences) => void }) {
  const [testMood, setTestMood] = useState<'idle' | 'typing' | 'thinking' | 'happy' | 'sleeping'>('happy');

  return (
    <div className="space-y-8">
      <div>
        <div className="section-kicker">VIRTUAL COMPANIONS</div>
        <h2>Interactive AI Companions</h2>
        <p className="lead">
          Choose an animated companion pet that reacts to your typing, cheers during thinking states, and provides interactive feedback.
        </p>
      </div>

      {/* Interactive Pet Playground Preview */}
      <div className="p-7 rounded-3xl bg-gradient-to-b from-[#0e162b] via-[#090e1c] to-[#060912] border border-[#23355b] text-center relative overflow-hidden shadow-2xl shadow-black/50">
        <div className="text-xs font-mono font-semibold tracking-wider text-[#8ea8ff] mb-4">
          INTERACTIVE PLAYGROUND — CLICK TO PET!
        </div>

        <div className="flex items-center justify-center my-6">
          <PetCompanion
            petId={preferences.petId}
            position="floating"
            size={preferences.petSize}
            mood={testMood}
            soundEnabled={preferences.soundEffects}
            interactive={true}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {(['idle', 'typing', 'thinking', 'happy', 'sleeping'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setTestMood(m)}
              className={`px-3.5 py-1.5 rounded-xl text-xs capitalize transition-all ${
                testMood === m
                  ? 'bg-[#8ea8ff] text-[#070b16] font-bold shadow-lg shadow-[#8ea8ff]/20'
                  : 'bg-[#131c33] text-[#8ea8ff] hover:bg-[#1a2747] border border-[#23345a]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Pet Selection Grid */}
      <div>
        <label className="field-label">CHOOSE COMPANION</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3.5">
          {PET_LIST.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreferences({ ...preferences, petId: p.id })}
              className={`p-4 rounded-2xl border flex items-center gap-3.5 text-left transition-all ${
                preferences.petId === p.id
                  ? 'border-[#8ea8ff] bg-[#121c32] ring-1 ring-[#8ea8ff] shadow-lg shadow-[#8ea8ff]/10'
                  : 'border-[#1b253b] bg-[#070b14] hover:border-[#32456e]'
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center flex-none">
                {p.id === 'none' ? (
                  <span className="text-2xl">🚫</span>
                ) : (
                  <PetArtwork petId={p.id} size={40} mood="happy" />
                )}
              </div>
              <div>
                <b className="text-sm text-[#eef3ff] block">{p.name}</b>
                <span className="text-xs text-[#8094b8] block line-clamp-1 mt-0.5">{p.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Size & Placement */}
      {preferences.petId !== 'none' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#1d2b48]">
          <div className="p-5 rounded-2xl bg-[#0b101e]/80 border border-[#1d2b48]">
            <label className="field-label">COMPANION SIZE</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['small', 'medium', 'large'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreferences({ ...preferences, petSize: s })}
                  className={`p-2.5 rounded-xl border text-xs capitalize text-center transition-all ${
                    preferences.petSize === s
                      ? 'border-[#8ea8ff] bg-[#141f38] text-[#edf3ff] font-semibold'
                      : 'border-[#1e2a44] bg-[#070b14] text-[#8e9ebc] hover:border-[#33466d]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b101e]/80 border border-[#1d2b48]">
            <label className="field-label">DOCK POSITION</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { id: 'bottom-right', name: 'Corner' },
                { id: 'composer', name: 'Composer' },
                { id: 'header', name: 'Header' },
              ].map(pos => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPreferences({ ...preferences, petPosition: pos.id as PetPosition })}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all ${
                    preferences.petPosition === pos.id
                      ? 'border-[#8ea8ff] bg-[#141f38] text-[#edf3ff] font-semibold'
                      : 'border-[#1e2a44] bg-[#070b14] text-[#8e9ebc] hover:border-[#33466d]'
                  }`}
                >
                  {pos.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ThinkingSettings({ preferences, setPreferences }: { preferences: Preferences; setPreferences: (p: Preferences) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <div className="section-kicker">NEURAL DYNAMICS</div>
        <h2>Thinking Animations & Latency</h2>
        <p className="lead">
          Customize how model deliberation and synthesis are rendered before and during streaming responses.
        </p>
      </div>

      {/* Live Thinking Preview */}
      <div className="p-6 rounded-2xl bg-[#070c17] border border-[#1d2a45] shadow-xl">
        <span className="text-xs font-mono font-semibold text-[#8ea8ff] block mb-3">LIVE THINKING INDICATOR PREVIEW</span>
        <ThinkingIndicator
          style={preferences.thinkingStyle}
          showTimer={preferences.showThinkingTimer}
          modelName="Aplx Neural Engine"
          tokensSaved={preferences.tokenSaverMode !== 'off' ? 42 : undefined}
        />
      </div>

      {/* Select Style */}
      <div>
        <label className="field-label">SELECT THINKING VISUALIZATION</label>
        <div className="space-y-3 my-3.5">
          {THINKING_STYLES.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPreferences({ ...preferences, thinkingStyle: s.id })}
              className={`w-full p-4 sm:p-5 rounded-2xl border flex items-center justify-between text-left transition-all ${
                preferences.thinkingStyle === s.id
                  ? 'border-[#8ea8ff] bg-[#121c32] ring-1 ring-[#8ea8ff] shadow-lg shadow-[#8ea8ff]/10'
                  : 'border-[#1b253b] bg-[#070b14] hover:border-[#32456e]'
              }`}
            >
              <div>
                <b className="text-sm font-semibold text-[#eef3ff] block">{s.name}</b>
                <span className="text-xs text-[#8094b8] block mt-1 leading-relaxed">{s.desc}</span>
              </div>
              {preferences.thinkingStyle === s.id && <Check size={20} className="text-[#8ea8ff] flex-none ml-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Timer display toggle */}
      <div className="p-5 rounded-2xl bg-[#0b101e]/80 border border-[#1d2b48] space-y-3">
        <div className="preference">
          <div>
            <b>Display Deliberation Timer</b>
            <p>Shows exact seconds elapsed while model generates initial token headers (e.g. 1.2s).</p>
          </div>
          <button
            type="button"
            className={`toggle ${preferences.showThinkingTimer ? 'on' : ''}`}
            onClick={() => setPreferences({ ...preferences, showThinkingTimer: !preferences.showThinkingTimer })}
            aria-pressed={preferences.showThinkingTimer}
          >
            <i />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PersonaSettings({ preferences, setPreferences }: { preferences: Preferences; setPreferences: (p: Preferences) => void }) {
  const activePersona = PERSONAS.find(p => p.id === preferences.persona) || PERSONAS[0];

  return (
    <div className="space-y-8">
      <div>
        <div className="section-kicker">AI BEHAVIOR & PERSONA</div>
        <h2>System Instructions & Creativity</h2>
        <p className="lead">
          Shape how the AI assistant reasons, responds, and calibrates its tone across all discussions.
        </p>
      </div>

      {/* Persona Selection */}
      <div>
        <label className="field-label">CHOOSE AI PERSONA</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3.5">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPreferences({
                  ...preferences,
                  persona: p.id,
                  customSystemPrompt: p.id === 'custom' ? preferences.customSystemPrompt : p.prompt,
                });
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                preferences.persona === p.id
                  ? 'border-[#8ea8ff] bg-[#121c32] ring-1 ring-[#8ea8ff] shadow-lg shadow-[#8ea8ff]/10'
                  : 'border-[#1b253b] bg-[#070b14] hover:border-[#32456e]'
              }`}
            >
              <b className="text-sm font-semibold text-[#eef3ff] block">{p.name}</b>
              <span className="text-xs text-[#8094b8] block mt-1 leading-relaxed">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Box */}
      <div className="p-5 rounded-2xl bg-[#0b101e]/80 border border-[#1d2b48] space-y-2">
        <label className="field-label">SYSTEM INSTRUCTION PROMPT</label>
        <textarea
          rows={4}
          value={preferences.customSystemPrompt}
          onChange={e => setPreferences({ ...preferences, customSystemPrompt: e.target.value, persona: 'custom' })}
          placeholder="Enter custom instructions or personality directives..."
          className="w-full p-3.5 rounded-xl bg-[#060a12] border border-[#202e4d] text-sm text-[#dce6ff] focus:border-[#8ea8ff] outline-none font-mono resize-y"
        />
      </div>

      {/* Temperature Creativity Slider */}
      <div className="p-6 rounded-2xl bg-[#080c16]/90 border border-[#1b263f] shadow-lg space-y-3">
        <div className="flex justify-between text-xs text-[#8da0c4]">
          <b className="text-sm text-[#dce6ff]">Model Temperature (Creativity Index)</b>
          <span className="font-mono font-bold text-[#8ea8ff] bg-[#14203d] border border-[#24355e] px-2.5 py-0.5 rounded">
            {preferences.temperature.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1.5"
          step="0.05"
          value={preferences.temperature}
          onChange={e => setPreferences({ ...preferences, temperature: Number(e.target.value) })}
          className="w-full accent-[#8ea8ff]"
        />
        <div className="flex justify-between text-[11px] text-[#6d82aa]">
          <span>0.0 Precise & Deterministic</span>
          <span>0.7 Balanced Creative</span>
          <span>1.5 Highly Inventive</span>
        </div>
      </div>
    </div>
  );
}

export function DataManagementSettings({
  onExportChat,
  onImportChat,
  onClearAllData,
}: {
  onExportChat: (format: 'json' | 'markdown' | 'text') => void;
  onImportChat: (jsonStr: string) => void;
  onClearAllData: () => void;
}) {
  const [importJson, setImportJson] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImport = () => {
    if (!importJson.trim()) return;
    try {
      onImportChat(importJson.trim());
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
      setImportJson('');
    } catch {
      alert('Invalid JSON chat file');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="section-kicker">DATA & PRIVACY</div>
        <h2>Data Portability & Storage</h2>
        <p className="lead">
          Your conversations and configuration never touch a remote Aplx database. Export, backup, or import anytime.
        </p>
      </div>

      {/* Export tools */}
      <div className="p-6 rounded-2xl bg-[#0b101e]/90 border border-[#1f2d4a] shadow-lg space-y-3.5">
        <b className="text-sm font-semibold text-[#eef3ff] block">Export Conversation History</b>
        <p className="text-xs text-[#8498be] leading-relaxed">
          Save your current discussion turns directly to your device in formatted structures.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onExportChat('markdown')}
            className="secondary inline-flex items-center gap-2 text-xs py-2 px-3.5 rounded-xl border border-[#253556] bg-[#11192e] text-[#dce6ff] hover:bg-[#182442] hover:border-[#384f80] transition-all"
          >
            <Download size={14} className="text-[#8ea8ff]" /> Export as Markdown (.md)
          </button>
          <button
            type="button"
            onClick={() => onExportChat('json')}
            className="secondary inline-flex items-center gap-2 text-xs py-2 px-3.5 rounded-xl border border-[#253556] bg-[#11192e] text-[#dce6ff] hover:bg-[#182442] hover:border-[#384f80] transition-all"
          >
            <Download size={14} className="text-emerald-400" /> Export as JSON (.json)
          </button>
          <button
            type="button"
            onClick={() => onExportChat('text')}
            className="secondary inline-flex items-center gap-2 text-xs py-2 px-3.5 rounded-xl border border-[#253556] bg-[#11192e] text-[#dce6ff] hover:bg-[#182442] hover:border-[#384f80] transition-all"
          >
            <Download size={14} className="text-purple-400" /> Export as Plain Text (.txt)
          </button>
        </div>
      </div>

      {/* Import tool */}
      <div className="p-6 rounded-2xl bg-[#0b101e]/90 border border-[#1f2d4a] shadow-lg space-y-3.5">
        <b className="text-sm font-semibold text-[#eef3ff] block">Import Conversation JSON</b>
        <p className="text-xs text-[#8498be] leading-relaxed">
          Paste previously exported JSON history to restore your chat session.
        </p>
        <textarea
          rows={3}
          value={importJson}
          onChange={e => setImportJson(e.target.value)}
          placeholder='[{"role":"user","content":"..."},{"role":"model","content":"..."}]'
          className="w-full p-3 rounded-xl bg-[#060a12] border border-[#202e4d] text-xs font-mono text-[#dce6ff] focus:border-[#8ea8ff] outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={!importJson.trim()}
            className="primary inline-flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl bg-[#8ea8ff] text-[#070b16] font-bold hover:bg-[#a6bdff] transition-all disabled:opacity-50"
          >
            <Upload size={14} /> Import into Current Session
          </button>
          {importSuccess && <span className="text-xs text-emerald-400 font-medium">✓ Chat session restored successfully!</span>}
        </div>
      </div>

      {/* Wipe Data */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-between gap-4">
        <div>
          <b className="text-sm text-rose-200 block">Erase Local Browser Data</b>
          <p className="text-xs text-rose-300/70 mt-0.5">Clears stored API keys, custom themes, and token counters from this browser.</p>
        </div>
        <button
          type="button"
          onClick={onClearAllData}
          className="px-4 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-200 text-xs font-bold transition-all cursor-pointer flex-none"
        >
          Clear all data
        </button>
      </div>
    </div>
  );
}
