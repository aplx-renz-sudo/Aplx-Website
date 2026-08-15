export type ProviderId = 'gemini' | 'openai' | 'ollama' | 'groq' | 'openrouter';

export type ProviderModel = { id: string; label: string };

export type ProviderDef = {
  id: ProviderId;
  name: string;
  logo: string;
  description: string;
  keyLabel: string;
  keyPlaceholder: string;
  requiresKey: boolean;
  route: string;
  models: ProviderModel[];
  defaultModel: string;
  baseUrl?: string;
  baseUrlLabel?: string;
  instructions: string;
};

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    logo: 'G',
    description: 'Direct browser connection to Google Gemini',
    keyLabel: 'Gemini API key',
    keyPlaceholder: 'Paste your Gemini API key',
    requiresKey: true,
    route: 'Browser → Google Gemini',
    models: [
      { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
      { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
    ],
    defaultModel: 'gemini-3.5-flash',
    instructions: 'Get a key from Google AI Studio. Aplx sends requests directly from your browser — your key never touches an Aplx server.',
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT (OpenAI)',
    logo: 'O',
    description: 'OpenAI models via your own API key',
    keyLabel: 'OpenAI API key',
    keyPlaceholder: 'sk-…',
    requiresKey: true,
    route: 'Browser → OpenAI',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    ],
    defaultModel: 'gpt-4o-mini',
    instructions: 'Use an API key from platform.openai.com. Aplx is the interface — OpenAI powers the model behind it.',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    logo: 'Q',
    description: 'Fast inference via Groq Cloud',
    keyLabel: 'Groq API key',
    keyPlaceholder: 'gsk_…',
    requiresKey: true,
    route: 'Browser → Groq',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    instructions: 'Get a key from console.groq.com. Groq runs the model; Aplx is your chat layer on top.',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: 'R',
    description: 'One key, many models from OpenRouter',
    keyLabel: 'OpenRouter API key',
    keyPlaceholder: 'sk-or-…',
    requiresKey: true,
    route: 'Browser → OpenRouter',
    models: [
      { id: 'openrouter/auto', label: 'OpenRouter Auto' },
      { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (via OpenRouter)' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    ],
    defaultModel: 'openrouter/auto',
    instructions: 'Get a key from openrouter.ai. Pick any model OpenRouter supports — Aplx routes your messages there directly.',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    logo: 'L',
    description: 'Local models on your machine',
    keyLabel: 'API key (optional)',
    keyPlaceholder: 'Not required for local Ollama',
    requiresKey: false,
    route: 'Browser → Ollama (local)',
    baseUrl: 'http://localhost:11434',
    baseUrlLabel: 'Ollama base URL',
    models: [
      { id: 'llama3.2', label: 'Llama 3.2' },
      { id: 'mistral', label: 'Mistral' },
      { id: 'gemma2', label: 'Gemma 2' },
      { id: 'phi3', label: 'Phi-3' },
    ],
    defaultModel: 'llama3.2',
    instructions: 'Run Ollama locally (ollama serve). Aplx talks to your machine — no cloud key needed. CORS may require OLLAMA_ORIGINS=*.',
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);

export function getProvider(id: ProviderId): ProviderDef {
  return PROVIDERS[id];
}
