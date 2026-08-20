import { useState, useRef } from 'react';
import type { UserProfile } from '../types';
import { User, Sparkles, Upload, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { sounds } from '../lib/audio';
import { processImageToCompactSquare } from '../lib/userProfile';

interface OfflineAccountModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile, startTour: boolean) => void;
  onClose?: () => void;
  existingProfile?: UserProfile | null;
  soundEnabled?: boolean;
}

export const AVATAR_PRESETS = [
  { id: 'astronaut', name: 'Astronaut', emoji: '🧑‍🚀', bg: 'from-blue-600 to-indigo-700' },
  { id: 'hacker', name: 'Cyber Hacker', emoji: '👾', bg: 'from-emerald-500 to-teal-700' },
  { id: 'wizard', name: 'Prompt Wizard', emoji: '🧙‍♂️', bg: 'from-purple-600 to-pink-600' },
  { id: 'alchemist', name: 'AI Alchemist', emoji: '🔮', bg: 'from-violet-600 to-fuchsia-700' },
  { id: 'architect', name: 'Code Architect', emoji: '⚡', bg: 'from-amber-500 to-orange-600' },
  { id: 'cat', name: 'Stardust Feline', emoji: '🐱', bg: 'from-pink-500 to-rose-600' },
  { id: 'fox', name: 'Cyber Fox', emoji: '🦊', bg: 'from-orange-500 to-red-600' },
  { id: 'robot', name: 'Robo Pilot', emoji: '🤖', bg: 'from-cyan-500 to-blue-600' },
];

export function OfflineAccountModal({
  isOpen,
  onComplete,
  onClose,
  existingProfile,
  soundEnabled = true,
}: OfflineAccountModalProps) {
  const [name, setName] = useState(existingProfile?.name || '');
  const [avatar, setAvatar] = useState(existingProfile?.avatar || 'astronaut');
  const [avatarType, setAvatarType] = useState<'preset' | 'custom'>(
    existingProfile?.avatarType || 'preset'
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    existingProfile?.avatarType === 'custom' ? existingProfile.avatar : ''
  );
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [startTour, setStartTour] = useState(!existingProfile?.isSetupComplete);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        // Automatically center-crop and compress any size image to a compact 256x256 square
        const compactSquareBase64 = await processImageToCompactSquare(file, 256, 0.85);
        setCustomAvatarUrl(compactSquareBase64);
        setAvatar(compactSquareBase64);
        setAvatarType('custom');
      } catch (err) {
        console.error('Image compression failed', err);
        alert('Could not process this image. Please try a standard JPG/PNG image.');
      } finally {
        setIsProcessingImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Cosmic Traveler';
    const profile: UserProfile = {
      id: existingProfile?.id || `user_${Date.now()}`,
      name: finalName,
      avatar: avatarType === 'custom' ? customAvatarUrl || 'astronaut' : avatar,
      avatarType: avatarType === 'custom' && customAvatarUrl ? 'custom' : 'preset',
      bio: bio.trim(),
      joinedAt: existingProfile?.joinedAt || Date.now(),
      isSetupComplete: true,
    };

    if (soundEnabled) sounds.playComplete();
    onComplete(profile, startTour);
  };

  const selectedPreset = AVATAR_PRESETS.find(p => p.id === avatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b0e18] border border-[#2b354f] shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Glowing atmospheric halo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-mono mb-3">
              <ShieldCheck size={14} className="text-emerald-400" />
              100% OFFLINE & PRIVATE
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#f1f5f9]">
              {existingProfile?.isSetupComplete ? 'Edit Your Profile' : 'Create Offline Account'}
            </h2>
            <p className="text-sm text-[#8fa0c2] mt-1.5 max-w-sm mx-auto">
              Welcome to Aplx! Set up your local persona. All details are stored strictly in your browser.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Selection Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/20 ring-2 ring-[#8ea8ff]/30 aspect-square flex-none">
                  <div className="w-full h-full rounded-2xl bg-[#0f1422] flex items-center justify-center overflow-hidden aspect-square">
                    {isProcessingImage ? (
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    ) : avatarType === 'custom' && customAvatarUrl ? (
                      <img
                        src={customAvatarUrl}
                        alt="Profile avatar"
                        className="w-full h-full object-cover aspect-square rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-4xl select-none">
                        {selectedPreset ? selectedPreset.emoji : '🧑‍🚀'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="playful-pop absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-[#1a233a] hover:bg-[#253252] border border-[#3b4b72] text-[#8ea8ff] shadow-md cursor-pointer"
                  title="Upload and auto-crop custom image"
                  disabled={isProcessingImage}
                >
                  <Upload size={14} />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Avatar Preset Grid */}
              <div className="w-full">
                <label className="text-[11px] font-mono tracking-wider text-[#798eb4] block mb-2 text-center">
                  SELECT AVATAR PRESET OR UPLOAD CUSTOM
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAvatar(p.id);
                        setAvatarType('preset');
                      }}
                      className={`playful-pop p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        avatarType === 'preset' && avatar === p.id
                          ? 'border-[#8ea8ff] bg-[#162138] ring-2 ring-[#8ea8ff]/50 scale-105'
                          : 'border-[#20293d] bg-[#0c101c] hover:border-[#38486d]'
                      }`}
                      title={p.name}
                    >
                      <span className="text-xl">{p.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Name Input */}
            <div>
              <label className="text-[11px] font-mono tracking-wider text-[#798eb4] block mb-1.5">
                YOUR DISPLAY NAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. R3nz, Alex, Cyber Sage"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-11 px-3.5 pl-10 rounded-xl bg-[#090d16] border border-[#232e46] focus:border-[#8ea8ff] text-[#e2e8f0] placeholder-[#506180] text-sm outline-none transition-all focus:ring-2 focus:ring-[#8ea8ff]/20"
                />
                <User size={16} className="absolute left-3.5 top-3 text-[#506180]" />
              </div>
            </div>

            {/* Optional Bio / Tagline */}
            <div>
              <label className="text-[11px] font-mono tracking-wider text-[#798eb4] block mb-1.5">
                ROLE / TITLE (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. Lead AI Architect, Space Explorer"
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-[#090d16] border border-[#232e46] focus:border-[#8ea8ff] text-[#e2e8f0] placeholder-[#506180] text-sm outline-none transition-all focus:ring-2 focus:ring-[#8ea8ff]/20"
              />
            </div>

            {/* Guided Tour Checkbox */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0e1322] border border-[#222d46]">
              <input
                type="checkbox"
                id="tour-toggle"
                checked={startTour}
                onChange={e => setStartTour(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="tour-toggle" className="text-xs text-[#a0b2d6] cursor-pointer">
                <b>Start interactive guide</b> — Show me what Aplx is and how to explore features!
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {onClose && existingProfile?.isSetupComplete && (
                <button
                  type="button"
                  onClick={onClose}
                  className="playful-pop px-4 py-2.5 rounded-xl text-xs font-medium text-[#8fa0c2] hover:text-[#e2e8f0] bg-[#121727] hover:bg-[#1a2238] border border-[#222e48] transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isProcessingImage}
                className="playful-pop w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-[#e2e8f0] via-[#ffffff] to-[#c7d2fe] hover:from-white hover:to-indigo-200 border border-white/20 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={16} className="text-indigo-600" />
                Launch Aplx →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

