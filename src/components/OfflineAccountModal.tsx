import { useState, useRef } from 'react';
import type { UserProfile } from '../types';
import { User, Sparkles, Upload, ShieldCheck, Loader2 } from 'lucide-react';
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
  { id: 'astronaut', name: 'Astronaut', emoji: '🧑‍🚀' },
  { id: 'hacker', name: 'Cyber Hacker', emoji: '👾' },
  { id: 'wizard', name: 'Prompt Wizard', emoji: '🧙‍♂️' },
  { id: 'alchemist', name: 'AI Alchemist', emoji: '🔮' },
  { id: 'architect', name: 'Code Architect', emoji: '⚡' },
  { id: 'cat', name: 'Stardust Feline', emoji: '🐱' },
  { id: 'fox', name: 'Cyber Fox', emoji: '🦊' },
  { id: 'robot', name: 'Robo Pilot', emoji: '🤖' },
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
        const compactSquareBase64 = await processImageToCompactSquare(file, 256, 0.85);
        setCustomAvatarUrl(compactSquareBase64);
        setAvatar(compactSquareBase64);
        setAvatarType('custom');
      } catch (err) {
        console.error('Image compression failed', err);
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
    const finalName = name.trim() || 'Explorer';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0d111a]/95 border border-white/[0.1] shadow-2xl overflow-hidden p-6 sm:p-7">
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#86868b] text-[11px] font-mono mb-2.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>OFFLINE & PRIVATE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f5f5f7]">
              {existingProfile?.isSetupComplete ? 'Profile Settings' : 'Create Offline Account'}
            </h2>
            <p className="text-xs text-[#86868b] mt-1 max-w-xs mx-auto">
              Your profile is stored locally in your browser and never leaves your device.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Selection Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.12] p-0.5 shadow-lg aspect-square flex-none">
                  <div className="w-full h-full rounded-2xl bg-[#090c14] flex items-center justify-center overflow-hidden aspect-square">
                    {isProcessingImage ? (
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : avatarType === 'custom' && customAvatarUrl ? (
                      <img
                        src={customAvatarUrl}
                        alt="Profile avatar"
                        className="w-full h-full object-cover aspect-square rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-3xl select-none">
                        {selectedPreset ? selectedPreset.emoji : '🧑‍🚀'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-[#1a2336] hover:bg-[#25324e] border border-white/[0.12] text-[#f5f5f7] shadow-md cursor-pointer transition-colors"
                  title="Upload custom image"
                  disabled={isProcessingImage}
                >
                  <Upload size={12} />
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
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {AVATAR_PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAvatar(p.id);
                        setAvatarType('preset');
                      }}
                      className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        avatarType === 'preset' && avatar === p.id
                          ? 'border-[#2997ff] bg-blue-500/15'
                          : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.15]'
                      }`}
                      title={p.name}
                    >
                      <span className="text-lg">{p.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Name Input */}
            <div>
              <label className="text-[10.5px] font-mono tracking-wider text-[#86868b] block mb-1">
                DISPLAY NAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex, Sage, Traveler"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-9 px-3 pl-9 rounded-lg bg-white/[0.04] border border-white/[0.08] focus:border-[#2997ff] text-[#f5f5f7] placeholder-[#636366] text-xs outline-none transition-all"
                />
                <User size={14} className="absolute left-3 top-2.5 text-[#636366]" />
              </div>
            </div>

            {/* Optional Bio / Tagline */}
            <div>
              <label className="text-[10.5px] font-mono tracking-wider text-[#86868b] block mb-1">
                TITLE OR ROLE (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Designer, Engineer, Researcher"
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] focus:border-[#2997ff] text-[#f5f5f7] placeholder-[#636366] text-xs outline-none transition-all"
              />
            </div>

            {/* Guided Tour Checkbox */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <input
                type="checkbox"
                id="tour-toggle"
                checked={startTour}
                onChange={e => setStartTour(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-500 accent-blue-500 cursor-pointer"
              />
              <label htmlFor="tour-toggle" className="text-xs text-[#86868b] cursor-pointer select-none">
                Start interactive walkthrough on workspace launch
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {onClose && existingProfile?.isSetupComplete && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#86868b] hover:text-[#f5f5f7] bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isProcessingImage}
                className="w-full sm:w-auto px-5 py-2 rounded-lg text-xs font-semibold text-black bg-[#f5f5f7] hover:bg-white border border-white/20 shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} className="text-blue-600" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
