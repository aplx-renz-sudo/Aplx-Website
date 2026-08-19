import type { ChatTurn } from '../providers/types';
import type { TokenSaverMode, TokenStats } from '../types';

const STATS_KEY = 'aplx:token_stats';

export function loadTokenStats(): TokenStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    totalTokensProcessed: 0,
    totalTokensSaved: 0,
    totalMessagesSent: 0,
  };
}

export function saveTokenStats(stats: TokenStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function resetTokenStats(): TokenStats {
  const fresh: TokenStats = {
    totalTokensProcessed: 0,
    totalTokensSaved: 0,
    totalMessagesSent: 0,
  };
  saveTokenStats(fresh);
  return fresh;
}

/**
 * Fast character-based token estimator (~4 chars per token average).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Account for words and punctuation
  return Math.ceil(text.length / 3.8);
}

const FILLER_PATTERNS = [
  /^Sure! /i,
  /^Certainly! /i,
  /^Of course! /i,
  /^Here is the /i,
  /^I'd be happy to help with that\.? /i,
  /^As an AI language model, /i,
  /^As an AI, /i,
  /\n\nLet me know if you need anything else!$/i,
  /\n\nHope this helps!$/i,
  /\n\nFeel free to ask if you have more questions!$/i,
];

function cleanAssistantFillers(text: string): string {
  let cleaned = text;
  for (const pattern of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned;
}

function compressWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Optimizes prompt and history turns according to the chosen Token Saver level.
 */
export function optimizeTokens(
  prompt: string,
  history: ChatTurn[],
  mode: TokenSaverMode,
  maxTurns = 12
): {
  optimizedPrompt: string;
  optimizedHistory: ChatTurn[];
  originalTokens: number;
  optimizedTokens: number;
  tokensSaved: number;
  percentageSaved: number;
} {
  const originalRawText = prompt + ' ' + history.map(h => h.content).join(' ');
  const originalTokens = estimateTokens(originalRawText);

  if (mode === 'off') {
    return {
      optimizedPrompt: prompt,
      optimizedHistory: history.slice(-maxTurns),
      originalTokens,
      optimizedTokens: originalTokens,
      tokensSaved: 0,
      percentageSaved: 0,
    };
  }

  // 1. Sliding window on history
  let boundedHistory = history;
  if (mode === 'aggressive') {
    boundedHistory = history.slice(-Math.min(maxTurns, 6));
  } else if (mode === 'balanced') {
    boundedHistory = history.slice(-Math.min(maxTurns, 10));
  } else {
    boundedHistory = history.slice(-maxTurns);
  }

  // 2. Compress turns
  const optimizedHistory = boundedHistory.map((turn, index) => {
    let content = turn.content;
    
    // Light compression
    content = compressWhitespace(content);

    // Balanced & Aggressive: strip conversational filler fluff
    if (mode === 'balanced' || mode === 'aggressive') {
      if (turn.role === 'model') {
        content = cleanAssistantFillers(content);
      }
    }

    // Aggressive: truncate long code outputs in older history turns
    if (mode === 'aggressive' && index < boundedHistory.length - 2) {
      if (content.length > 800) {
        content = content.slice(0, 750) + '\n... [Context truncated to conserve tokens]';
      }
    }

    return {
      role: turn.role,
      content,
    };
  });

  // 3. Optimize current prompt
  let optimizedPrompt = compressWhitespace(prompt);

  const optimizedRawText = optimizedPrompt + ' ' + optimizedHistory.map(h => h.content).join(' ');
  const optimizedTokens = estimateTokens(optimizedRawText);
  const rawSaved = Math.max(0, originalTokens - optimizedTokens);
  
  // Calculate percentage
  const percentageSaved = originalTokens > 0 ? Math.round((rawSaved / originalTokens) * 100) : 0;

  return {
    optimizedPrompt,
    optimizedHistory,
    originalTokens,
    optimizedTokens,
    tokensSaved: rawSaved,
    percentageSaved,
  };
}
