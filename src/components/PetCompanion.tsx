import { useState, useEffect, useRef } from 'react';
import type { PetId, PetPosition } from '../types';
import { sounds } from '../lib/audio';

export type PetMood = 'idle' | 'typing' | 'thinking' | 'happy' | 'sleeping';

type PetProps = {
  petId: PetId;
  position: PetPosition;
  size: 'small' | 'medium' | 'large';
  mood: PetMood;
  soundEnabled: boolean;
  interactive?: boolean;
};

export const PET_DATABASE: Record<PetId, { name: string; avatar: string; desc: string; dialogue: { idle: string; happy: string; typing: string; thinking: string } }> = {
  fox: {
    name: 'Cyber Fox',
    avatar: '🦊',
    desc: 'Quick-witted, agile companion with a glowing neon tail.',
    dialogue: {
      idle: 'Scanning starways... Ready for your next idea! 🦊',
      happy: 'Tail wagging at 100%! Yay! ✨',
      typing: 'Ooh, what are we creating next?',
      thinking: 'Synthesizing neural pathways...',
    },
  },
  cat: {
    name: 'Celestial Cat',
    avatar: '🐱',
    desc: 'Purring, cosmic feline who floats gracefully across space.',
    dialogue: {
      idle: 'Watching cosmic dust float by 🐾',
      happy: 'Purrrrrrr! Best prompt ever! 💖',
      typing: 'Watching your keystrokes intently...',
      thinking: 'Chasing thoughts in the void...',
    },
  },
  bunny: {
    name: 'Pixel Bunny',
    avatar: '🐰',
    desc: 'Bouncy, hyper-speed rabbit that munches on compressed tokens.',
    dialogue: {
      idle: 'Hop into tomorrow! 🐰',
      happy: 'Wheeeeee! Rocket fueled! 🎉',
      typing: 'Fast fingers! What are we writing?',
      thinking: 'Calculating quantum hops...',
    },
  },
  dragon: {
    name: 'Cosmic Dragon',
    avatar: '🐉',
    desc: 'Ancient mystical guardian guarding your private keys.',
    dialogue: {
      idle: 'Guarding your private keys 🐉',
      happy: 'Sparkling flame burst! 🔥✨',
      typing: 'Dragon eyes watching...',
      thinking: 'Breathing cosmic knowledge...',
    },
  },
  slime: {
    name: 'Slime Bob',
    avatar: '💧',
    desc: 'Playful gelatinous blob that jiggles happily with every prompt.',
    dialogue: {
      idle: '*Squish squish* Bouncing along 💧',
      happy: 'Jiggle jiggle! Splish splash! ✨',
      typing: 'Blob mode on!',
      thinking: '*Goo ripple effect*...',
    },
  },
  robo: {
    name: 'Robo Orb',
    avatar: '🤖',
    desc: 'Precision AI bot computing token conservation algorithms.',
    dialogue: {
      idle: 'Status: Optimal. Awaiting instructions. 🤖',
      happy: 'EFFICIENCY RATING: 100%! 🌟',
      typing: 'BUFFERING KEYSTROKES...',
      thinking: 'QUERYING NEURAL MESH...',
    },
  },
  shiba: {
    name: 'Shiba Sparky',
    avatar: '🐕',
    desc: 'Astronaut doge on an exploratory interstellar journey.',
    dialogue: {
      idle: 'Much space, very AI! 🐕',
      happy: 'SUCH WOW! MUCH LOVE! 💖',
      typing: 'Very excite! Ready to launch!',
      thinking: 'Much think, such concentration...',
    },
  },
  none: {
    name: 'No Companion',
    avatar: '🚫',
    desc: 'Minimalist mode without companion avatars.',
    dialogue: {
      idle: '',
      happy: '',
      typing: '',
      thinking: '',
    },
  },
};

export const PET_DIALOGUES: Record<PetId, { idle: string[]; happy: string[]; thinking: string[]; typing: string[] }> = {
  fox: {
    idle: ['Scanning starways...', 'All systems ready!', 'Hunting for bugs 🦊', 'Foxy insights online!'],
    happy: ['Yay! Great conversation! 💖', 'High five, human!', 'Tail wagging at 100%! ✨'],
    thinking: ['Synthesizing neural paths...', 'Decrypting cosmic data...', 'Fox ears locked in!'],
    typing: ['Ooh, what are we asking?!', 'Listening closely...', 'Ready!'],
  },
  cat: {
    idle: ['Purrrrr...', 'Watching cosmic dust float by 🐾', 'Nap time soon?', 'Meow-gical computing!'],
    happy: ['Purrrrrrr! Best prompt ever! 💖', 'Paw-some answer!', 'You give good pets ✨'],
    thinking: ['Chasing thoughts in the void...', 'Contemplating the universe...', 'Paws on keyboard...'],
    typing: ['Type type type!', 'Ooh exciting input...', 'Watching your keys!'],
  },
  bunny: {
    idle: ['Boing! 🐰', 'Nibbling on compressed data', 'Hop into tomorrow!', 'Ears perked up!'],
    happy: ['Wheeeeee! 🎉', 'Super speedy response!', 'Carrot rocket fueled! 🚀'],
    thinking: ['Calculating quantum hops...', 'Processing at warp speed...', 'Brain spinning!'],
    typing: ['Fast fingers!', 'What are we writing?', 'Hop hop!'],
  },
  dragon: {
    idle: ['Guarding your private keys 🐉', 'Warm flame idling...', 'Cosmic embers glowing', 'Roar of intelligence!'],
    happy: ['Sparkling flame burst! 🔥✨', 'Wisdom ignited!', 'Proud dragon nod!'],
    thinking: ['Breathing cosmic knowledge...', 'Gathering ancient fire...', 'Forging response...'],
    typing: ['Incinerating typos...', 'Dragon eyes watching...', 'Speak, traveler!'],
  },
  slime: {
    idle: ['*Squish squish*', 'Bouncing along 💧', 'Gooey and happy!', 'Gelatinous joy!'],
    happy: ['*Bouncing happily!* 💖', 'Jiggle jiggle! ✨', 'Splish splash!'],
    thinking: ['Absorbing inputs...', '*Goo ripple effect*...', 'Expanding brain...'],
    typing: ['*Watching intently*', 'Wiggle wiggle!', 'Blob mode on!'],
  },
  robo: {
    idle: ['BEEP BOOP 🤖', 'Status: Optimal', 'Awaiting instruction', 'Telemetry clear.'],
    happy: ['EFFICIENCY RATING: 100%! 🌟', 'DOPAMINE PROTOCOL ACTIVATED', 'EXCELLENT INTERACTION'],
    thinking: ['QUERYING NEURAL MESH...', 'SYNTHESIS IN PROGRESS...', 'COMPUTING TOKENS...'],
    typing: ['BUFFERING KEYSTROKES...', 'INPUT DETECTED', 'PROCESSING...'],
  },
  shiba: {
    idle: ['Much space, very AI! 🐕', 'Astronaut doge on duty', 'Sniffing tokens...', 'Good vibes only!'],
    happy: ['SUCH WOW! 🌟', 'VERY SMART! MUCH LOVE! 💖', 'TAIL HELICOPTER GO BRRR!'],
    thinking: ['Much think...', 'Very ponder...', 'Such concentration!'],
    typing: ['Watching you type!', 'Very excite!', 'Ready to launch!'],
  },
  none: {
    idle: [],
    happy: [],
    thinking: [],
    typing: [],
  },
};

export function PetCompanion({ petId, position, size, mood, soundEnabled, interactive = true }: PetProps) {
  const [speech, setSpeech] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [currentMood, setCurrentMood] = useState<PetMood>(mood);
  const speechTimer = useRef<number | null>(null);

  useEffect(() => {
    setCurrentMood(mood);
    if (petId === 'none') return;

    // Pick dialogue when mood changes
    const pool = PET_DIALOGUES[petId]?.[mood === 'sleeping' ? 'idle' : mood] || [];
    if (pool.length > 0 && Math.random() > 0.4) {
      setSpeech(pool[Math.floor(Math.random() * pool.length)]);
      if (speechTimer.current) clearTimeout(speechTimer.current);
      speechTimer.current = window.setTimeout(() => setSpeech(null), 3800);
    }
  }, [mood, petId]);

  if (petId === 'none') return null;

  const handlePetClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    if (soundEnabled) sounds.playPetChirp();
    setCurrentMood('happy');

    // Add heart particle
    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left - 10,
      y: e.clientY - rect.top - 20,
    };
    setHearts(prev => [...prev.slice(-4), newHeart]);

    const happyQuotes = PET_DIALOGUES[petId]?.happy || ['*Happy noises* 💖'];
    setSpeech(happyQuotes[Math.floor(Math.random() * happyQuotes.length)]);

    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = window.setTimeout(() => {
      setSpeech(null);
      setCurrentMood('idle');
    }, 3200);
  };

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-18 h-18',
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-20 right-6 z-40',
    composer: 'absolute -top-14 right-4 z-30',
    header: 'inline-flex items-center ml-2 z-20',
    floating: 'fixed top-24 right-8 z-40',
  };

  return (
    <div className={`pet-container group select-none ${positionClasses[position]}`}>
      {/* Speech bubble */}
      {speech && (
        <div className="pet-bubble absolute bottom-full mb-2 right-0 max-w-[200px] px-3 py-1.5 rounded-xl bg-[#141824] border border-[#8ea8ff44] text-[#dce6ff] text-xs shadow-xl backdrop-blur-md animate-fade-in pointer-events-none">
          {speech}
          <div className="absolute -bottom-1 right-5 w-2 h-2 bg-[#141824] border-r border-b border-[#8ea8ff44] rotate-45" />
        </div>
      )}

      {/* Floating Hearts */}
      {hearts.map(h => (
        <span
          key={h.id}
          className="absolute pointer-events-none text-rose-400 text-sm animate-float-heart"
          style={{ left: `${h.x}px`, top: `${h.y}px` }}
        >
          💖
        </span>
      ))}

      {/* Pet Avatar Graphic */}
      <button
        type="button"
        onClick={handlePetClick}
        title="Click to pet your companion!"
        className={`pet-avatar relative flex items-center justify-center p-1.5 rounded-2xl bg-[#0e121e]/80 border border-[#2b354f] hover:border-[#8ea8ff] shadow-lg hover:shadow-[#6d8fff33] transition-all transform hover:scale-110 cursor-pointer active:scale-95 ${sizeClasses[size]}`}
      >
        <PetGraphic petId={petId} mood={currentMood} />

        {/* Ambient status indicator */}
        {currentMood === 'thinking' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping opacity-75" />
        )}
        {currentMood === 'happy' && (
          <span className="absolute -top-1 -left-1 text-[10px]">✨</span>
        )}
      </button>
    </div>
  );
}

function PetGraphic({ petId, mood }: { petId: PetId; mood: PetMood }) {
  const isBouncing = mood === 'happy';
  const isThinking = mood === 'thinking';
  const isTyping = mood === 'typing';

  switch (petId) {
    case 'fox':
      return (
        <svg viewBox="0 0 48 48" className={`w-full h-full ${isBouncing ? 'animate-bounce' : ''}`}>
          <defs>
            <linearGradient id="foxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7b39" />
              <stop offset="100%" stopColor="#e64a19" />
            </linearGradient>
          </defs>
          {/* Fox Ears */}
          <polygon points="10,6 20,20 8,24" fill="url(#foxGrad)" />
          <polygon points="10,9 17,19 9,21" fill="#ffe0b2" />
          <polygon points="38,6 28,20 40,24" fill="url(#foxGrad)" />
          <polygon points="38,9 31,19 39,21" fill="#ffe0b2" />
          {/* Head */}
          <polygon points="6,20 42,20 24,42" fill="url(#foxGrad)" />
          {/* Cheeks */}
          <polygon points="6,20 18,28 14,34" fill="#ffffff" />
          <polygon points="42,20 30,28 34,34" fill="#ffffff" />
          <polygon points="18,28 30,28 24,42" fill="#ffffff" />
          {/* Eyes */}
          {mood === 'sleeping' ? (
            <>
              <path d="M14 24 Q18 28 22 24" stroke="#1a1a24" strokeWidth="2.5" fill="none" />
              <path d="M26 24 Q30 28 34 24" stroke="#1a1a24" strokeWidth="2.5" fill="none" />
            </>
          ) : isThinking ? (
            <>
              <circle cx="17" cy="23" r="2.5" fill="#80d8ff" className="animate-pulse" />
              <circle cx="31" cy="23" r="2.5" fill="#80d8ff" className="animate-pulse" />
            </>
          ) : isTyping ? (
            <>
              <circle cx="17" cy="22" r="3.5" fill="#1a1a24" />
              <circle cx="18" cy="21" r="1.2" fill="#ffffff" />
              <circle cx="31" cy="22" r="3.5" fill="#1a1a24" />
              <circle cx="32" cy="21" r="1.2" fill="#ffffff" />
            </>
          ) : (
            <>
              <ellipse cx="17" cy="23" rx="2.5" ry="3" fill="#1a1a24" />
              <circle cx="18" cy="22" r="1" fill="#ffffff" />
              <ellipse cx="31" cy="23" rx="2.5" ry="3" fill="#1a1a24" />
              <circle cx="32" cy="22" r="1" fill="#ffffff" />
            </>
          )}
          {/* Nose */}
          <circle cx="24" cy="38" r="2" fill="#1a1a24" />
        </svg>
      );

    case 'cat':
      return (
        <svg viewBox="0 0 48 48" className={`w-full h-full ${isBouncing ? 'animate-bounce' : ''}`}>
          <defs>
            <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9c88ff" />
              <stop offset="100%" stopColor="#575fcf" />
            </linearGradient>
          </defs>
          {/* Ears */}
          <polygon points="10,8 19,22 8,24" fill="url(#catGrad)" />
          <polygon points="12,12 17,20 10,21" fill="#ffb8b8" />
          <polygon points="38,8 29,22 40,24" fill="url(#catGrad)" />
          <polygon points="36,12 31,20 38,21" fill="#ffb8b8" />
          {/* Cat Head */}
          <circle cx="24" cy="27" r="16" fill="url(#catGrad)" />
          {/* Whiskers */}
          <line x1="8" y1="28" x2="2" y2="26" stroke="#ffffff88" strokeWidth="1.5" />
          <line x1="8" y1="31" x2="2" y2="33" stroke="#ffffff88" strokeWidth="1.5" />
          <line x1="40" y1="28" x2="46" y2="26" stroke="#ffffff88" strokeWidth="1.5" />
          <line x1="40" y1="31" x2="46" y2="33" stroke="#ffffff88" strokeWidth="1.5" />
          {/* Eyes */}
          {mood === 'sleeping' ? (
            <>
              <path d="M14 26 Q18 30 21 26" stroke="#ffffff" strokeWidth="2" fill="none" />
              <path d="M27 26 Q30 30 34 26" stroke="#ffffff" strokeWidth="2" fill="none" />
            </>
          ) : isThinking ? (
            <>
              <circle cx="18" cy="26" r="3" fill="#ffeaa7" />
              <circle cx="30" cy="26" r="3" fill="#ffeaa7" />
            </>
          ) : (
            <>
              <ellipse cx="18" cy="26" rx="3" ry="4" fill="#00d2d3" />
              <ellipse cx="18" cy="26" rx="1" ry="3" fill="#1a1a24" />
              <ellipse cx="30" cy="26" rx="3" ry="4" fill="#00d2d3" />
              <ellipse cx="30" cy="26" rx="1" ry="3" fill="#1a1a24" />
            </>
          )}
          {/* Nose & Mouth */}
          <polygon points="23,32 25,32 24,34" fill="#ffb8b8" />
          <path d="M22 35 Q24 37 26 35" stroke="#ffffff88" strokeWidth="1.2" fill="none" />
        </svg>
      );

    case 'bunny':
      return (
        <svg viewBox="0 0 48 48" className={`w-full h-full ${isBouncing ? 'animate-bounce' : ''}`}>
          <defs>
            <linearGradient id="bunnyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f6fa" />
              <stop offset="100%" stopColor="#dcdde1" />
            </linearGradient>
          </defs>
          {/* Long Ears */}
          <ellipse cx="16" cy="14" rx="4" ry="12" fill="url(#bunnyGrad)" transform="rotate(-8 16 14)" />
          <ellipse cx="16" cy="14" rx="2" ry="9" fill="#ffb8b8" transform="rotate(-8 16 14)" />
          <ellipse cx="32" cy="14" rx="4" ry="12" fill="url(#bunnyGrad)" transform="rotate(8 32 14)" />
          <ellipse cx="32" cy="14" rx="2" ry="9" fill="#ffb8b8" transform="rotate(8 32 14)" />
          {/* Head */}
          <circle cx="24" cy="30" r="14" fill="url(#bunnyGrad)" />
          {/* Cheeks */}
          <circle cx="16" cy="33" r="2.5" fill="#ff9ff355" />
          <circle cx="32" cy="33" r="2.5" fill="#ff9ff355" />
          {/* Eyes */}
          {mood === 'sleeping' ? (
            <>
              <path d="M16 29 Q19 32 21 29" stroke="#2f3640" strokeWidth="2" fill="none" />
              <path d="M27 29 Q29 32 32 29" stroke="#2f3640" strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              <circle cx="18" cy="28" r="2.5" fill="#2f3640" />
              <circle cx="19" cy="27" r="1" fill="#ffffff" />
              <circle cx="30" cy="28" r="2.5" fill="#2f3640" />
              <circle cx="31" cy="27" r="1" fill="#ffffff" />
            </>
          )}
          {/* Nose */}
          <circle cx="24" cy="32" r="1.5" fill="#ff7675" />
        </svg>
      );

    case 'dragon':
      return (
        <svg viewBox="0 0 48 48" className={`w-full h-full ${isBouncing ? 'animate-bounce' : ''}`}>
          <defs>
            <linearGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00cec9" />
              <stop offset="100%" stopColor="#0984e3" />
            </linearGradient>
          </defs>
          {/* Horns */}
          <polygon points="12,12 18,22 10,22" fill="#fdcb6e" />
          <polygon points="36,12 30,22 38,22" fill="#fdcb6e" />
          {/* Dragon Head */}
          <path d="M12 20 Q24 16 36 20 Q40 32 24 40 Q8 32 12 20" fill="url(#dragonGrad)" />
          {/* Spikes */}
          <polygon points="24,14 22,19 26,19" fill="#fdcb6e" />
          {/* Glowing Eyes */}
          <ellipse cx="18" cy="26" rx="3" ry="3.5" fill="#ffeaa7" />
          <ellipse cx="18" cy="26" rx="1.2" ry="3" fill="#2d3436" />
          <ellipse cx="30" cy="26" rx="3" ry="3.5" fill="#ffeaa7" />
          <ellipse cx="30" cy="26" rx="1.2" ry="3" fill="#2d3436" />
          {/* Little Flame */}
          {mood === 'happy' && (
            <path d="M24 37 Q26 44 24 46 Q22 44 24 37" fill="#ff7675" className="animate-pulse" />
          )}
        </svg>
      );

    case 'slime':
      return (
        <svg viewBox="0 0 48 48" className={`w-full h-full ${isBouncing ? 'animate-bounce' : ''}`}>
          <defs>
            <linearGradient id="slimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#55efc4" />
              <stop offset="100%" stopColor="#00b894" />
            </linearGradient>
          </defs>
          {/* Slime body */}
          <path
            d="M24 10 C36 10 42 22 42 32 C42 40 34 42 24 42 C14 42 6 40 6 32 C6 22 12 10 24 10 Z"
            fill="url(#slimeGrad)"
          />
          {/* Highlight */}
          <ellipse cx="18" cy="18" rx="4" ry="2.5" fill="#ffffff66" transform="rotate(-20 18 18)" />
          {/* Eyes */}
          {mood === 'sleeping' ? (
            <>
              <path d="M16 28 Q19 31 22 28" stroke="#1e272e" strokeWidth="2" fill="none" />
              <path d="M26 28 Q29 31 32 28" stroke="#1e272e" strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              <circle cx="18" cy="28" r="3" fill="#1e272e" />
              <circle cx="19" cy="27" r="1.2" fill="#ffffff" />
              <circle cx="30" cy="28" r="3" fill="#1e272e" />
              <circle cx="31" cy="27" r="1.2" fill="#ffffff" />
            </>
          )}
          {/* Cheeks */}
          <circle cx="14" cy="32" r="2" fill="#ff767566" />
          <circle cx="34" cy="32" r="2" fill="#ff767566" />
          {/* Smile */}
          <path d="M22 32 Q24 35 26 32" stroke="#1e272e" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case 'robo':
      return (
        <svg viewBox="0 0 48 48" className={`w-full h-full ${isBouncing ? 'animate-bounce' : ''}`}>
          <defs>
            <linearGradient id="roboGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#74b9ff" />
              <stop offset="100%" stopColor="#0984e3" />
            </linearGradient>
          </defs>
          {/* Antenna */}
          <line x1="24" y1="12" x2="24" y2="4" stroke="#dfe6e9" strokeWidth="2" />
          <circle cx="24" cy="4" r="3" fill="#ff7675" className="animate-pulse" />
          {/* Robot Sphere */}
          <circle cx="24" cy="26" r="15" fill="#2d3436" stroke="#74b9ff" strokeWidth="2" />
          {/* Visor Screen */}
          <rect x="13" y="20" width="22" height="12" rx="4" fill="#0984e3" opacity="0.85" />
          {/* Digital Eyes */}
          {mood === 'sleeping' ? (
            <line x1="16" y1="26" x2="32" y2="26" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 2" />
          ) : isThinking ? (
            <>
              <circle cx="19" cy="26" r="2" fill="#ffeaa7" className="animate-ping" />
              <circle cx="29" cy="26" r="2" fill="#ffeaa7" className="animate-ping" />
            </>
          ) : (
            <>
              <circle cx="19" cy="26" r="2" fill="#ffffff" />
              <circle cx="29" cy="26" r="2" fill="#ffffff" />
            </>
          )}
        </svg>
      );

    case 'shiba':
      return (
        <svg viewBox="0 0 48 48" className={`w-full h-full ${isBouncing ? 'animate-bounce' : ''}`}>
          <defs>
            <linearGradient id="shibaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdcb6e" />
              <stop offset="100%" stopColor="#e17055" />
            </linearGradient>
          </defs>
          {/* Doge Ears */}
          <polygon points="10,12 18,22 8,24" fill="url(#shibaGrad)" />
          <polygon points="38,12 30,22 40,24" fill="url(#shibaGrad)" />
          {/* Head */}
          <circle cx="24" cy="27" r="15" fill="url(#shibaGrad)" />
          {/* White cheeks */}
          <ellipse cx="16" cy="31" rx="6" ry="5" fill="#ffffff" />
          <ellipse cx="32" cy="31" rx="6" ry="5" fill="#ffffff" />
          <ellipse cx="24" cy="33" rx="7" ry="5" fill="#ffffff" />
          {/* Eyebrows */}
          <circle cx="17" cy="20" r="1.8" fill="#ffffff" />
          <circle cx="31" cy="20" r="1.8" fill="#ffffff" />
          {/* Eyes */}
          <circle cx="18" cy="25" r="2.5" fill="#2d3436" />
          <circle cx="19" cy="24" r="1" fill="#ffffff" />
          <circle cx="30" cy="25" r="2.5" fill="#2d3436" />
          <circle cx="31" cy="24" r="1" fill="#ffffff" />
          {/* Muzzle */}
          <circle cx="24" cy="32" r="2" fill="#2d3436" />
          {/* Tongue for happy */}
          {mood === 'happy' && (
            <path d="M22 34 C22 38 26 38 26 34" fill="#ff7675" />
          )}
        </svg>
      );

    default:
      return null;
  }
}
