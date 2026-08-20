import { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Cpu,
  Zap,
  Smile,
  Palette,
  Shield,
  Gamepad2,
  CheckCircle2,
} from 'lucide-react';
import { sounds } from '../lib/audio';
import { PetArtwork } from './PetArtwork';
import type { PetId } from '../types';

interface InteractiveTourGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  petId?: PetId;
  soundEnabled?: boolean;
}

export const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Aplx AI™',
    badge: 'MISSION 01 · ORIENTATION',
    icon: Gamepad2,
    color: 'from-blue-500 to-indigo-600',
    desc: 'Aplx is a high-speed, private-first AI workstation engineered entirely in your browser. All conversations, credentials, and settings remain 100% on your device.',
    tips: [
      '⚡ Zero intermediate proxy servers — direct client-side routing.',
      '💾 Instant offline local-first persistence.',
      '🎮 Interactive companions, custom gradient themes, and deliberation visualizers.',
    ],
  },
  {
    id: 'models',
    title: 'Universal AI Model Hub',
    badge: 'MISSION 02 · PROVIDERS',
    icon: Cpu,
    color: 'from-purple-500 to-pink-600',
    desc: 'Switch effortlessly between flagship AI engines using the model dropdown in the header or in Settings:',
    tips: [
      '✨ Gemini 3.6, Gemini 3.5 & 2.5 Flash / Pro',
      '🧠 OpenAI GPT-4o, o1, o3-mini & CodeX (GPT-5.6)',
      '⚡ Claude 3.7 Sonnet, Haiku & Opus',
      '🚀 xAI Grok, Mistral Le Chat, Kimi K3, MiniMax, Groq LPUs, and local Ollama',
    ],
  },
  {
    id: 'tokensaver',
    title: 'Active Token Saver Engine',
    badge: 'MISSION 03 · EFFICIENCY',
    icon: Zap,
    color: 'from-emerald-500 to-teal-600',
    desc: 'The Token Saver intelligently compresses conversational context turns before sending them to LLMs, dramatically conserving quota and accelerating response times.',
    tips: [
      '🛡️ Normalizes redundant spacing, whitespace, and repetitive system fluff.',
      '📊 Model-adaptive savings tailored to reasoning vs speed models (~12% to ~45%).',
      '📈 Live tracking badge in the header shows exact tokens conserved.',
    ],
  },
  {
    id: 'pets',
    title: 'Interactive Companion Pets',
    badge: 'MISSION 04 · COMPANIONS',
    icon: Smile,
    color: 'from-amber-500 to-orange-600',
    desc: 'Meet your virtual workstation companions! Each pet features custom artwork and reacts dynamically to your workflow.',
    tips: [
      '🐾 Fox, Cat, Bunny, Dragon, Slime, Robo Orb, and Shiba Sparky.',
      '💓 Click your pet anytime to give them pets and hear cheerful sound effects!',
      '👀 Pets watch your typing, think during generation, and celebrate finished prompts.',
    ],
  },
  {
    id: 'customizer',
    title: 'Aesthetics & Deep Theming',
    badge: 'MISSION 05 · CUSTOMIZATION',
    icon: Palette,
    color: 'from-fuchsia-500 to-rose-600',
    desc: 'Tailor Aplx to your vibe with hand-crafted atmospheres, custom dual-color gradients, typography pairings, and bubble styles.',
    tips: [
      '🌌 Celestial space parallax moving gently with your cursor.',
      '🎨 Cyberpunk, Emerald, Midnight, Nebula, Solar, Crimson, and Polar themes.',
      '🔮 5 unique AI Thinking animations (Orbital, Synaptic, Matrix, Holo Shimmer, Minimal).',
    ],
  },
  {
    id: 'security',
    title: 'Ready for Liftoff!',
    badge: 'MISSION 06 · SECURITY & KEYS',
    icon: Shield,
    color: 'from-cyan-500 to-blue-600',
    desc: 'Configure your provider API keys under Settings (Gear Icon) whenever you are ready. Your keys are encrypted locally and never sent to any third party.',
    tips: [
      '🔑 Independent per-provider key vault in your browser.',
      '⌨️ Press Ctrl/Cmd + K anytime for prompt templates or Ctrl/Cmd + / for shortcuts.',
      '🎮 Click the Help button in the header anytime to reopen this guide!',
    ],
  },
];

export function InteractiveTourGuide({
  isOpen,
  onClose,
  onNavigateToTab,
  petId = 'fox',
  soundEnabled = true,
}: InteractiveTourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (soundEnabled) sounds.playClick();
    if (isLast) {
      if (soundEnabled) sounds.playComplete();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (soundEnabled) sounds.playClick();
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0b0e18] border border-[#2b354f] shadow-2xl overflow-hidden">
        {/* Top Video Game HUD Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#0e1322] border-b border-[#20293d]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#a0b3d8]">
              APLX INTERACTIVE FIELD GUIDE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#627499]">
              STEP {currentStep + 1}/{TOUR_STEPS.length}
            </span>
            <button
              onClick={onClose}
              className="playful-pop p-1 rounded-lg text-[#627499] hover:text-[#e2e8f0] hover:bg-[#1a233a] transition-all"
              title="Close Guide"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress meter */}
        <div className="w-full h-1 bg-[#141a2a]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-pink-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex-none w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 shadow-lg shadow-indigo-500/20`}
            >
              <div className="w-full h-full rounded-2xl bg-[#0b0e18]/80 flex items-center justify-center text-white">
                <Icon size={26} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider bg-[#151c2f] text-cyan-300 border border-cyan-500/30 mb-1.5">
                {step.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-medium text-[#f8fafc] tracking-tight">
                {step.title}
              </h3>
            </div>

            {/* Pet reaction */}
            {petId !== 'none' && (
              <div className="hidden sm:block flex-none">
                <PetArtwork petId={petId} mood="happy" size={54} />
              </div>
            )}
          </div>

          <p className="text-sm text-[#cbd5e1] leading-relaxed">{step.desc}</p>

          {/* Key Tips List */}
          <div className="space-y-2.5 p-4 rounded-xl bg-[#080b13] border border-[#1c2438]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">
              KEY HIGHLIGHTS & PROTOCOLS
            </div>
            {step.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-[#94a3b8]">
                <CheckCircle2 size={14} className="text-indigo-400 flex-none mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          {/* Quest Steps Dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (soundEnabled) sounds.playClick();
                  setCurrentStep(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? 'w-6 bg-gradient-to-r from-indigo-400 to-cyan-400'
                    : 'w-2 bg-[#20293d] hover:bg-[#344262]'
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0d17] border-t border-[#20293d]">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className={`playful-pop px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              isFirst
                ? 'opacity-30 cursor-not-allowed text-[#64748b]'
                : 'text-[#94a3b8] hover:text-[#f8fafc] bg-[#121827] hover:bg-[#1a2238] border border-[#222e48]'
            }`}
          >
            <ChevronLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#64748b] hover:text-[#94a3b8] px-2 py-1"
            >
              Skip Tour
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="playful-pop px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-white via-indigo-100 to-indigo-300 hover:from-white hover:to-indigo-200 border border-white/30 shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isLast ? (
                <>
                  <Sparkles size={14} className="text-indigo-600" /> Start Using Aplx
                </>
              ) : (
                <>
                  Next Mission <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
