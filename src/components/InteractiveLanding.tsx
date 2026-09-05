import React, { useState } from 'react';
import {
  ArrowUp,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Orbit,
  Zap,
  Gamepad2,
  AlertTriangle,
  Cpu,
  Volume2,
  VolumeX,
  ExternalLink,
  Check,
} from 'lucide-react';
import type { PetId, ThemePreset, UserProfile } from '../types';
import { PROVIDERS, type ProviderId } from '../providers/registry';
import { sounds } from '../lib/audio';
import type { LocalDetectionResult } from '../lib/localModelDetector';

interface InteractiveLandingProps {
  launch: () => void;
  settings: () => void;
  privacy: () => void;
  about: () => void;
  petId?: PetId;
  onSelectPet?: (pet: PetId) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  currentTheme?: ThemePreset;
  onSelectTheme?: (theme: ThemePreset) => void;
  currentProvider?: ProviderId;
  onSelectProvider?: (providerId: ProviderId) => void;
  onOpenGuide?: () => void;
  onOpenAccountModal?: () => void;
  userProfile?: UserProfile | null;
  detectedLocalModels?: LocalDetectionResult | null;
  launchWithPrompt?: (prompt: string, providerId?: ProviderId) => void;
}

const THEME_OPTIONS: { id: ThemePreset; name: string; color: string }[] = [
  { id: 'black', name: 'OLED Black', color: '#030303' },
  { id: 'midnight', name: 'Midnight', color: '#0c1836' },
  { id: 'cyberpunk', name: 'Neon Cyber', color: '#ff007f' },
  { id: 'emerald', name: 'Emerald', color: '#00f59b' },
  { id: 'nebula', name: 'Nebula', color: '#b388ff' },
  { id: 'solar', name: 'Solar Flare', color: '#ff9f43' },
  { id: 'polar', name: 'Polar Frost', color: '#70a1ff' },
];

const FEATURED_PROVIDERS: ProviderId[] = [
  'offline',
  'gemini',
  'claude',
  'openai',
  'groq',
  'ollama',
];

export function InteractiveLanding({
  launch,
  settings,
  privacy,
  about,
  soundEnabled = true,
  onToggleSound,
  currentTheme = 'black',
  onSelectTheme,
  currentProvider = 'gemini',
  onSelectProvider,
  onOpenGuide,
  onOpenAccountModal,
  userProfile,
  detectedLocalModels,
}: InteractiveLandingProps) {
  // Provider visualizer selection
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(currentProvider);

  const selectedDef = PROVIDERS[selectedProvider] || PROVIDERS.gemini;

  return (
    <main
      className="landing animate-fade-in-up w-full min-h-screen flex flex-col justify-between"
      id="interactive-landing-root"
      style={{ padding: '24px 20px 48px 20px' }}
    >
      {/* Top Floating Navigation Header */}
      <nav
        className="landing-top-nav w-full max-w-5xl mx-auto flex items-center justify-between"
        style={{
          marginBottom: '56px',
          padding: '14px 24px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="wordmark flex items-center gap-3">
          <span className="brand-badge-a">A</span>
          <span className="brand-title text-base font-bold tracking-wider">APLX</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131d33] border border-[#27385e] text-[#8ea8ff] hidden sm:inline-block">
            DOCK v1.7.1
          </span>
        </div>

        <div className="landing-nav-links flex items-center gap-3 sm:gap-4">
          {/* Audio Feedback Toggle */}
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className="landing-nav-btn playful-pop flex items-center gap-2"
              title={soundEnabled ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Unmute)'}
              aria-label="Toggle Sound Effects"
              style={{
                fontSize: '13px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: soundEnabled ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                border: soundEnabled ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {soundEnabled ? (
                <Volume2 size={15} className="text-cyan-400" />
              ) : (
                <VolumeX size={15} className="text-[#64748b]" />
              )}
              <span className="hidden sm:inline text-xs font-medium">
                {soundEnabled ? 'Audio On' : 'Muted'}
              </span>
            </button>
          )}

          {/* Color Theme Changer */}
          {onSelectTheme && (
            <div
              className="flex items-center gap-1.5 p-1.5 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              title="Change Workspace Color Theme"
            >
              {THEME_OPTIONS.map(th => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(th.id);
                    if (soundEnabled) sounds.playClick();
                  }}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    currentTheme === th.id
                      ? 'ring-2 ring-white scale-125 shadow-md'
                      : 'opacity-60 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: th.color }}
                  title={`Theme: ${th.name}`}
                  aria-label={`Switch theme to ${th.name}`}
                />
              ))}
            </div>
          )}

          <a
            href="https://aplx.freebuff.app"
            id="back-to-landing-btn"
            className="landing-nav-btn playful-pop hidden md:inline-flex items-center gap-1.5"
            style={{
              fontSize: '13px',
              padding: '8px 14px',
              borderRadius: '10px',
              color: '#d6e4ff',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <span>Original Site</span>
            <ExternalLink size={12} />
          </a>

          <button
            onClick={about}
            className="landing-nav-btn playful-pop"
            style={{
              fontSize: '13px',
              padding: '8px 14px',
              borderRadius: '10px',
              color: '#a0b0d0',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            About
          </button>

          <button
            onClick={privacy}
            className="landing-nav-btn playful-pop"
            style={{
              fontSize: '13px',
              padding: '8px 14px',
              borderRadius: '10px',
              color: '#a0b0d0',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            Privacy
          </button>

          {/* User profile badge */}
          {onOpenAccountModal && (
            <button
              type="button"
              onClick={onOpenAccountModal}
              className="landing-nav-btn playful-pop hidden lg:flex items-center gap-1.5 text-xs text-[#a0b0d0]"
              style={{
                fontSize: '12px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              title="Account & Profile"
            >
              <span>{userProfile ? `🧑‍🚀 ${userProfile.name}` : 'Offline Profile'}</span>
            </button>
          )}

          <button
            onClick={launch}
            className="nav-launch playful-pop font-semibold"
            style={{
              fontSize: '13px',
              padding: '8px 18px',
              borderRadius: '10px',
            }}
          >
            Launch Aplx <ArrowUp size={14} />
          </button>
        </div>
      </nav>

      {/* Spacious Hero Section */}
      <div className="hero w-full max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Sleek Eyebrow */}
        <div
          className="eyebrow flex items-center justify-center gap-2 mb-6 px-4 py-1.5 rounded-full"
          style={{
            background: 'rgba(142, 168, 255, 0.08)',
            border: '1px solid rgba(142, 168, 255, 0.2)',
            fontSize: '12px',
            letterSpacing: '0.08em',
          }}
        >
          <Sparkles size={14} className="text-[#8ea8ff] animate-twinkle" />
          <span className="font-semibold text-[#c3d5ff]">YOUR PRIVATE MULTI-MODEL DOCK</span>
        </div>

        {/* Hero Title */}
        <h1
          className="font-bold tracking-tight text-white mb-6"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            lineHeight: 1.15,
            maxWidth: '820px',
          }}
        >
          The private dock for <i className="lively-shimmer-text">all your AI APIs.</i>
        </h1>

        {/* Hero Description */}
        <p
          className="mx-auto text-[#9cb0d4] mb-8"
          style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
            lineHeight: 1.65,
            maxWidth: '680px',
          }}
        >
          Connect directly to Google Gemini, Anthropic Claude, OpenAI, Groq, and local Ollama models.
          Zero middleman servers — your credentials and conversations stay 100% inside your browser.
        </p>

        {/* Under Development Notice (Preserved as requested) */}
        <div className="flex justify-center mb-10 w-full">
          <div
            className="under-dev-banner"
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1.5px solid rgba(251, 191, 36, 0.85)',
              boxShadow:
                '0 0 24px rgba(251, 191, 36, 0.25), inset 0 0 12px rgba(251, 191, 36, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '640px',
              width: '100%',
              backdropFilter: 'blur(10px)',
            }}
          >
            <AlertTriangle
              size={18}
              className="under-dev-icon flex-none"
              style={{
                color: '#fde047',
                filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.8))',
              }}
            />
            <span
              className="under-dev-text text-left"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#fef08a',
                lineHeight: 1.45,
              }}
            >
              FIX 1.7.1 :- SETTINGS HAS BEEN FIXED! A few more bugs to be fixed for mobile, and its good to go.
            </span>
          </div>
        </div>

        {/* Spacious Action Buttons */}
        <div
          className="hero-actions flex flex-wrap items-center justify-center gap-4 w-full"
          style={{ marginBottom: '64px' }}
        >
          <button
            className="primary playful-pop font-semibold flex items-center justify-center gap-2"
            onClick={launch}
            style={{
              fontSize: '15px',
              padding: '14px 28px',
              borderRadius: '12px',
            }}
          >
            Launch Workspace <ArrowUp size={16} />
          </button>
          {onOpenGuide && (
            <button
              className="secondary playful-pop flex items-center justify-center gap-2"
              onClick={onOpenGuide}
              style={{
                fontSize: '15px',
                padding: '14px 24px',
                borderRadius: '12px',
              }}
            >
              <Gamepad2 size={16} className="text-cyan-400" /> Easy API Setup Guide
            </button>
          )}
          <button
            className="secondary playful-pop flex items-center justify-center gap-2"
            onClick={settings}
            style={{
              fontSize: '15px',
              padding: '14px 24px',
              borderRadius: '12px',
            }}
          >
            <KeyRound size={16} /> Plug in an API Key
          </button>
        </div>

        {/* THE SOLE INTERACTIVE FEATURE: Spacious Interactive Provider Dock */}
        <div
          className="provider-dock-section w-full max-w-4xl text-left"
          style={{
            marginBottom: '64px',
            padding: '36px 32px',
            borderRadius: '24px',
            background: 'rgba(11, 16, 28, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Orbit size={20} className="text-cyan-400" />
                  <span>Interactive Provider Dock</span>
                </h2>
              </div>
              <p className="text-sm text-[#889cc4]">
                Click any provider to inspect its connection topology, key requirements, and direct browser routing.
              </p>
            </div>

            {detectedLocalModels?.isAvailable && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold self-start sm:self-auto">
                <Cpu size={14} />
                <span>Local Offline Models Detected!</span>
              </div>
            )}
          </div>

          {/* Provider Selector Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {FEATURED_PROVIDERS.map(pId => {
              const def = PROVIDERS[pId];
              const isSelected = selectedProvider === pId;
              return (
                <button
                  key={pId}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(pId);
                    if (onSelectProvider) onSelectProvider(pId);
                    if (soundEnabled) sounds.playClick();
                  }}
                  className={`playful-pop text-left rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'shadow-lg shadow-indigo-950/60 ring-2 ring-indigo-500/80'
                      : 'hover:border-white/20'
                  }`}
                  style={{
                    padding: '14px 12px',
                    background: isSelected ? 'rgba(30, 42, 74, 0.85)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '1px solid rgba(142, 168, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{def.logo}</span>
                    {!def.requiresKey ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold">
                        NO KEY
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#131b2e] border border-[#233352] text-[#8ea8ff]">
                        BYOK
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-white truncate">
                    {def.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-[#7185aa] truncate mt-0.5">
                    {def.models[0]?.label || 'Default'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Selected Provider Inspection Area */}
          <div
            className="rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{
              padding: '24px 28px',
              background: 'rgba(6, 10, 20, 0.95)',
              border: '1px solid rgba(35, 52, 90, 0.6)',
            }}
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-2xl">{selectedDef.logo}</span>
                <b className="text-base sm:text-lg text-white font-bold">{selectedDef.name}</b>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-mono text-cyan-300"
                  style={{
                    background: 'rgba(8, 47, 73, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  {selectedDef.route}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#8fa3c7] leading-relaxed max-w-xl">
                {selectedDef.instructions || selectedDef.description}
              </p>

              {/* Direct Route Diagram */}
              <div
                className="flex items-center gap-2 text-[11px] font-mono py-1.5 px-3 rounded-lg text-[#7dd3fc] mt-2 inline-flex"
                style={{
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                }}
              >
                <span>Local Browser</span>
                <span className="text-[#38bdf8]">──────── (Direct SSL · Zero Intermediaries) ────────&gt;</span>
                <span className="text-white font-semibold">{selectedDef.name.split(' ')[0]} API</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-none w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (onSelectProvider) onSelectProvider(selectedProvider);
                  launch();
                }}
                className="playful-pop font-semibold text-xs text-black bg-white hover:bg-indigo-50 flex items-center justify-center gap-2"
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                }}
              >
                <span>Launch with {selectedDef.name.split(' ')[0]}</span>
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Spacious Trust Badges */}
        <div
          className="trust flex flex-wrap items-center justify-center gap-4 text-xs text-[#869abf] w-full max-w-4xl"
          style={{ marginBottom: '32px' }}
        >
          <span
            className="playful-pop flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <ShieldCheck size={16} className="text-emerald-400" /> 100% Private (Keys Stored in Browser)
          </span>
          <span
            className="playful-pop flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <KeyRound size={16} className="text-[#8ea8ff]" /> Direct BYOK (8+ Top Providers)
          </span>
          <span
            className="playful-pop flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <Orbit size={16} className="text-cyan-400" /> Direct Browser → API Routing
          </span>
          <span
            className="playful-pop flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <Zap size={16} className="text-amber-400" /> Token Saver Optimization
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="w-full text-center text-xs text-[#63728f] border-t border-white/5"
        style={{ paddingTop: '32px' }}
      >
        APLX WEB <span className="mx-2">•</span> A project by KORENTIC <span className="mx-2">•</span>{' '}
        <a
          href="https://github.com/Korentic/Aplx"
          target="_blank"
          rel="noreferrer"
          className="text-[#8e9ebc] hover:text-white transition-colors"
        >
          GITHUB · INSTALL APLX ↗
        </a>
      </footer>
    </main>
  );
}
