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
    title: 'Welcome to Aplx',
    badge: 'STAGE 01 · ARCHITECTURE',
    icon: Gamepad2,
    desc: 'Aplx is a private, client-first AI workspace. All conversations, credentials, and settings remain strictly stored in your browser.',
    tips: [
      'Direct browser-to-provider routing with zero proxy intermediary.',
      'Instant local persistence across browser reloads.',
      'Companion pets, token savings, custom themes, and reasoning indicators.',
    ],
  },
  {
    id: 'models',
    title: 'Universal AI Engine Support',
    badge: 'STAGE 02 · PROVIDERS',
    icon: Cpu,
    desc: 'Switch between leading AI engines using the model selector in the header or in Settings:',
    tips: [
      'Gemini 3.6, Gemini 3.5 & 2.5 Flash / Pro',
      'OpenAI GPT-4o, o1, o3-mini & CodeX',
      'Claude 3.7 Sonnet, Haiku & Opus',
      'xAI Grok, Mistral Le Chat, Kimi K3, MiniMax, Groq LPUs, and local Ollama',
    ],
  },
  {
    id: 'tokensaver',
    title: 'Context & Token Optimizer',
    badge: 'STAGE 03 · EFFICIENCY',
    icon: Zap,
    desc: 'Intelligently formats and optimizes conversation context before sending to LLMs, reducing token costs and accelerating inference speed.',
    tips: [
      'Cleans redundant whitespace, boilerplate formatting, and repetitive prompts.',
      'Smart sliding context pruning tailored to model limits.',
      'Real-time badge in the top bar tracking total tokens saved.',
    ],
  },
  {
    id: 'pets',
    title: 'Interactive Companion Pets',
    badge: 'STAGE 04 · COMPANIONS',
    icon: Smile,
    desc: 'Interactive virtual pets that react to your prompt workflow and thinking state.',
    tips: [
      'Fox, Cat, Bunny, Dragon, Slime, Robo Orb, and Shiba Sparky.',
      'Interact with your pet for gentle reactions and audio chirps.',
      'Pets observe generation states and celebrate completed tasks.',
    ],
  },
  {
    id: 'customizer',
    title: 'Themes & Personalization',
    badge: 'STAGE 05 · AESTHETICS',
    icon: Palette,
    desc: 'Customize typography, color accents, message styles, and thinking deliberation indicators.',
    tips: [
      'Subtle cosmic space depth with smooth pointer parallax.',
      'Tailored dark themes, clean font pairing, and sleek code blocks.',
      'Distinct thinking animation styles for complex AI deliberations.',
    ],
  },
  {
    id: 'security',
    title: 'Client-Side Security',
    badge: 'STAGE 06 · SECURITY',
    icon: Shield,
    desc: 'Configure your API keys in Settings. Keys are never transmitted to any central Aplx server.',
    tips: [
      'Independent per-provider key vault in your browser.',
      'Press ⌘K or Ctrl+K for Prompt Library and ⌘/ for Shortcuts.',
      'Use the Guide button in the toolbar anytime to reopen this walkthrough.',
    ],
  },
];

export function InteractiveTourGuide({
  isOpen,
  onClose,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0c101a]/95 border border-white/[0.1] shadow-2xl overflow-hidden text-[#f5f5f7]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium tracking-wide text-[#86868b]">
              APLX OVERVIEW
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-[#636366]">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.08] transition-colors"
              title="Close Guide"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Progress line */}
        <div className="w-full h-0.5 bg-white/[0.06]">
          <div
            className="h-full bg-[#2997ff] transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="flex-none w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[#2997ff]">
              <Icon size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono text-[#86868b] bg-white/[0.05] mb-1">
                {step.badge}
              </span>
              <h3 className="text-lg font-semibold text-[#f5f5f7] tracking-tight">
                {step.title}
              </h3>
            </div>

            {/* Pet reaction */}
            {petId !== 'none' && (
              <div className="hidden sm:block flex-none">
                <PetArtwork petId={petId} mood="happy" size={44} />
              </div>
            )}
          </div>

          <p className="text-xs text-[#86868b] leading-relaxed">{step.desc}</p>

          {/* Key Tips List */}
          <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {step.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#e5e5ea]">
                <CheckCircle2 size={13} className="text-[#2997ff] flex-none mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          {/* Steps Dots */}
          <div className="flex justify-center gap-1.5 pt-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (soundEnabled) sounds.playClick();
                  setCurrentStep(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? 'w-5 bg-white'
                    : 'w-1.5 bg-white/[0.15] hover:bg-white/[0.3]'
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              isFirst
                ? 'opacity-30 cursor-not-allowed text-[#636366]'
                : 'text-[#86868b] hover:text-[#f5f5f7] bg-white/[0.04] hover:bg-white/[0.08]'
            }`}
          >
            <ChevronLeft size={13} /> Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#86868b] hover:text-[#f5f5f7] px-2 py-1"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-black bg-[#f5f5f7] hover:bg-white border border-white/20 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isLast ? (
                <>
                  <Sparkles size={13} className="text-blue-600" /> Start Workspace
                </>
              ) : (
                <>
                  Continue <ChevronRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
