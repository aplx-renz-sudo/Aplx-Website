import { useState, useRef } from 'react';
import type { UserProfile } from '../types';
import { User, Sparkles, Upload, ShieldCheck, Loader2, X, Trash2, AlertTriangle } from 'lucide-react';
import { sounds } from '../lib/audio';
import { processImageToCompactSquare } from '../lib/userProfile';

interface OfflineAccountModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile, startTour: boolean) => void;
  onClose?: () => void;
  onRemoveAccount?: () => void;
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
  onRemoveAccount,
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
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
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

  const confirmDeleteAccount = () => {
    setShowDeleteWarning(false);
    if (onRemoveAccount) {
      onRemoveAccount();
    }
  };

  const selectedPreset = AVATAR_PRESETS.find(p => p.id === avatar);

  return (
    <>
      <div
        className="modal-overlay"
        onClick={e => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
      >
        <div className="modal-dialog" style={{ maxWidth: '480px' }}>
          {/* Header */}
          <div className="modal-header">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={13} /> 100% PRIVATE & OFFLINE
              </span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="modal-close-btn"
                title="Close"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div className="text-center mb-5">
              <h2 id="account-modal-title" className="text-xl font-bold tracking-tight text-[#f5f5f7]">
                {existingProfile?.isSetupComplete ? 'Edit Profile & Account' : 'Create Offline Account'}
              </h2>
              <p className="text-xs text-[#86868b] mt-1 max-w-xs mx-auto">
                Your profile is saved locally in your browser and never leaves your machine.
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
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: '6px' }}>
                    {AVATAR_PRESETS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setAvatar(p.id);
                          setAvatarType('preset');
                        }}
                        className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          avatarType === 'preset' && avatar === p.id
                            ? 'border-[#2997ff] bg-blue-500/20 shadow-sm'
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
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex, Sage, Traveler"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-10 px-3 pl-9 rounded-lg bg-black/40 border border-white/10 focus:border-[#2997ff] text-[#f5f5f7] placeholder-[#636366] text-xs outline-none transition-all"
                  />
                  <User size={14} className="absolute left-3 top-3 text-[#636366] pointer-events-none" />
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
                  className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 focus:border-[#2997ff] text-[#f5f5f7] placeholder-[#636366] text-xs outline-none transition-all"
                />
              </div>

              {/* Guided Tour Checkbox */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <input
                  type="checkbox"
                  id="tour-toggle"
                  checked={startTour}
                  onChange={e => setStartTour(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 accent-blue-500 cursor-pointer"
                />
                <label htmlFor="tour-toggle" className="text-xs text-[#86868b] cursor-pointer select-none">
                  Start interactive walkthrough tutorial on workspace launch
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-white/[0.08]">
                {existingProfile?.isSetupComplete && onRemoveAccount ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteWarning(true)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 size={13} />
                    <span>REMOVE ACCOUNT</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-[#86868b] hover:text-[#f5f5f7] bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isProcessingImage}
                    className="primary playful-pop"
                    style={{ padding: '9px 18px', fontSize: '13px' }}
                  >
                    <Sparkles size={14} className="text-blue-600" />
                    <span>Save Profile & Launch</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Red Warning Popup for Account Deletion */}
      {showDeleteWarning && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100 }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="warning-title"
        >
          <div
            className="modal-dialog animate-scale-in"
            style={{
              maxWidth: '460px',
              background: 'linear-gradient(180deg, #2a0808 0%, #160404 100%)',
              border: '2px solid #ef4444',
              boxShadow: '0 20px 50px rgba(239, 68, 68, 0.35), 0 0 0 1px rgba(239, 68, 68, 0.5)',
            }}
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-950/60 animate-bounce">
                <AlertTriangle size={30} />
              </div>

              <div className="space-y-2">
                <h3
                  id="warning-title"
                  className="text-base sm:text-lg font-black tracking-wide text-rose-100 uppercase leading-snug"
                >
                  WARNING! YOU ARE DELETING YOUR ACCOUNT FOREVER AND THE CHAT HISTORY WILL BE GONE AND CANNOT BE RESTORED, ARE YOU SURE ABOUT THIS?
                </h3>
                <p className="text-xs text-rose-300/80 leading-relaxed">
                  This permanently wipes your offline identity, saved settings, preferences, and all conversation archives from this browser.
                </p>
              </div>

              <div className="pt-3 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/70 border border-red-400/40 cursor-pointer active:scale-98 transition-all"
                >
                  Yes, i want to delete my account (CANNOT BE UNDONE)
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteWarning(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-rose-100 text-xs font-semibold border border-white/[0.1] cursor-pointer transition-all"
                >
                  Cancel & Keep Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
