import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, Cpu, ShieldCheck } from 'lucide-react';
import type { ProviderConfig } from '../lib/credential';
import { findProviderByModel, getProvider, PROVIDER_LIST, type ProviderId } from '../providers/registry';
import { createProvider, isProviderReady } from '../providers';
import { detectLocalOfflineModels, getCachedLocalModels, type LocalDetectionResult } from '../lib/localModelDetector';

function ModelSelect({
  models,
  value,
  onChange,
  className,
}: {
  models: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      className={className}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Model"
    >
      {models.map(m => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}

type ProviderSettingsProps = {
  config: ProviderConfig;
  onChange: (config: ProviderConfig) => void;
  onSave: () => void;
};

export function ProviderSettings({ config, onChange, onSave }: ProviderSettingsProps) {
  const [draft, setDraft] = useState(config);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState(() =>
    isProviderReady(config) ? 'Saved in browser' : 'Not connected'
  );
  const [isScanningLocal, setIsScanningLocal] = useState(false);
  const [localDetection, setLocalDetection] = useState<LocalDetectionResult | null>(getCachedLocalModels);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  // Initial silent probe for local models on mount
  useEffect(() => {
    let isMounted = true;
    detectLocalOfflineModels(config.baseUrls?.ollama || config.baseUrl).then(res => {
      if (isMounted) {
        setLocalDetection(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleScanLocalModels = async () => {
    setIsScanningLocal(true);
    try {
      const res = await detectLocalOfflineModels(draft.baseUrls?.ollama || draft.baseUrl);
      setLocalDetection(res);
      if (res.isAvailable && res.models.length > 0) {
        setStatus(`Detected ${res.models.length} local models via ${res.provider === 'ollama' ? 'Ollama' : 'LM Studio'}`);
      } else {
        setStatus('No local model server found on localhost:11434 or localhost:1234');
      }
    } finally {
      setIsScanningLocal(false);
    }
  };

  const active = getProvider(draft.provider);

  const pickProvider = (id: ProviderId) => {
    const def = getProvider(id);
    const existingKey = draft.apiKeys?.[id] || (id === draft.provider ? draft.apiKey : '');
    const existingBaseUrl = draft.baseUrls?.[id] || def.baseUrl || 'http://localhost:11434';

    setDraft(prev => ({
      ...prev,
      provider: id,
      apiKey: existingKey,
      baseUrl: existingBaseUrl,
      model: def.models.some(m => m.id === prev.model) ? prev.model : def.defaultModel,
    }));
  };

  const handleApplyDetectedLocalModel = (modelId: string) => {
    pickProvider('ollama');
    setDraft(prev => ({
      ...prev,
      provider: 'ollama',
      model: modelId,
      baseUrl: localDetection?.baseUrl || 'http://localhost:11434',
    }));
    onChange({
      ...draft,
      provider: 'ollama',
      model: modelId,
      baseUrl: localDetection?.baseUrl || 'http://localhost:11434',
    });
    setStatus(`Switched to local model: ${modelId} (100% Offline, 0 keys needed)`);
  };

  const handleKeyChange = (newKey: string) => {
    setDraft(prev => ({
      ...prev,
      apiKey: newKey,
      apiKeys: {
        ...(prev.apiKeys || {}),
        [prev.provider]: newKey,
      },
    }));
  };

  const handleBaseUrlChange = (newUrl: string) => {
    setDraft(prev => ({
      ...prev,
      baseUrl: newUrl,
      baseUrls: {
        ...(prev.baseUrls || {}),
        [prev.provider]: newUrl,
      },
    }));
  };

  const save = () => {
    onChange(draft);
    onSave();
    setStatus('Saved in ' + (draft.remember ? 'local browser storage' : 'this browser session'));
  };

  const test = async () => {
    if (!isProviderReady(draft)) return;
    setStatus('Checking a direct connection…');
    try {
      await createProvider({
        provider: draft.provider,
        apiKey: draft.apiKey,
        model: draft.model,
        baseUrl: draft.baseUrl,
      }).testConnection();
      setStatus('Connected directly to ' + active.name);
    } catch (err) {
      setStatus(`Connection failed: ${err instanceof Error ? err.message : 'check key or quota'}`);
    }
  };

  const remove = () => {
    const clearedKeys = { ...(draft.apiKeys || {}) };
    delete clearedKeys[draft.provider];
    const cleared = { ...draft, apiKey: '', apiKeys: clearedKeys };
    setDraft(cleared);
    onChange(cleared);
    setStatus('Credentials removed for ' + active.name);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="section-kicker">AI PROVIDERS & ENGINE CONFIGURATION</div>
        <h2 className="text-2xl font-bold text-[#eef3ff] tracking-tight mt-1">Direct Client AI Routing</h2>
        <p className="text-sm text-[#8fa2ca] mt-2 leading-relaxed">
          <b>Aplx</b> routes prompt requests directly from your browser to each respective AI provider API. Your keys and prompts are 100% private and never touch an intermediary server.
        </p>
      </div>

      {/* CRITICAL NOTE: Provider Key Rule Guidance */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0e1526]/90 border border-[#26375a] shadow-xl space-y-2.5">
        <div className="flex items-center gap-2.5 text-[#8ea8ff] font-semibold text-xs uppercase tracking-wider">
          <AlertTriangle size={17} className="text-amber-400" />
          <span>Important: Provider API Key Requirement</span>
        </div>
        <p className="text-xs text-[#9eb0d6] leading-relaxed">
          You can only run models whose <b>specific provider API key</b> has been configured and saved on this browser. For instance, selecting an OpenAI model requires an OpenAI API key; selecting Claude requires an Anthropic API key.
        </p>
        <div className="pt-2 text-xs text-[#788eb8] flex items-center gap-2 border-t border-[#1d2a45]">
          <ShieldCheck size={15} className="text-emerald-400 flex-none" />
          <span><b>Offline Exception:</b> Local models (Ollama / LM Studio) run directly on your hardware with <b>0 API keys required</b>.</span>
        </div>
      </div>

      {/* Local Model Auto-Detection & Recommendation Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0b1426] via-[#0f1d38] to-[#121633] border border-cyan-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-none shadow-lg shadow-cyan-950/40">
              <Cpu size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Local Offline Model Auto-Detection</span>
                {localDetection?.isAvailable && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-full font-mono">
                    ● Connected ({localDetection.provider})
                  </span>
                )}
              </div>
              <div className="text-xs text-[#8ea0c2] mt-0.5">
                {localDetection?.isAvailable
                  ? `Found ${localDetection.models.length} model(s) installed on your machine`
                  : 'Scan localhost:11434 (Ollama) or localhost:1234 (LM Studio)'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleScanLocalModels}
            disabled={isScanningLocal}
            className="playful-pop px-4 py-2 rounded-xl bg-[#142340] hover:bg-[#1c3058] border border-[#2b477a] text-xs text-cyan-200 flex items-center justify-center gap-2 font-semibold cursor-pointer shadow-lg transition-all"
          >
            <RefreshCw size={13} className={isScanningLocal ? 'animate-spin' : ''} />
            <span>{isScanningLocal ? 'Scanning Hardware…' : 'Scan Machine'}</span>
          </button>
        </div>

        {/* List of Detected Local Models if available */}
        {localDetection?.isAvailable && localDetection.models.length > 0 && (
          <div className="pt-3 border-t border-cyan-500/20 space-y-2.5">
            <div className="text-xs text-cyan-300 font-semibold flex items-center gap-1.5">
              <Sparkles size={13} /> Detected Installed Models (1-Click Switch):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {localDetection.models.map(m => {
                const isCurrent = draft.provider === 'ollama' && draft.model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleApplyDetectedLocalModel(m.id)}
                    className={`playful-pop p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/70 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-lg shadow-cyan-950/50'
                        : 'bg-[#080d1a] border-[#1e3052] text-[#a4b8df] hover:border-cyan-400/60 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {isCurrent && <CheckCircle2 size={13} className="text-cyan-400 flex-none" />}
                      </div>
                      <div className="text-[11px] text-[#6e86b2] font-mono truncate mt-0.5">
                        {m.id} {m.size ? `• ${m.size}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-900/50 text-cyan-300 flex-none border border-cyan-700/40 font-semibold">
                      Use
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="field-label">CHOOSE PROVIDER ({PROVIDER_LIST.length} AVAILABLE)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5" role="list">
          {PROVIDER_LIST.map(p => {
            const hasKey = !!draft.apiKeys?.[p.id] || (draft.provider === p.id && !!draft.apiKey);
            const isLocal = !p.requiresKey;
            return (
              <button
                key={p.id}
                type="button"
                role="listitem"
                className={`playful-pop p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  draft.provider === p.id
                    ? 'bg-[#152038] border-[#8ea8ff] shadow-xl shadow-[#8ea8ff]/10 ring-1 ring-[#8ea8ff]'
                    : 'bg-[#090d18] border-[#1c263c] hover:border-[#35456b]'
                }`}
                onClick={() => pickProvider(p.id)}
                aria-pressed={draft.provider === p.id}
              >
                <span className="text-xl w-9 h-9 rounded-xl bg-[#141b2c] flex items-center justify-center border border-[#232f48] flex-none">
                  {p.logo}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <b className="text-xs font-semibold text-[#eef3ff] truncate">{p.name}</b>
                    {isLocal ? (
                      <span className="text-[10px] text-cyan-400 font-mono font-medium">⚡ Offline Ready</span>
                    ) : hasKey ? (
                      <span className="text-[10px] text-emerald-400 font-mono font-medium">✓ Configured</span>
                    ) : (
                      <span className="text-[10px] text-[#6b7b99] font-mono">🔒 Key needed</span>
                    )}
                  </div>
                  <p className="text-xs text-[#7d90b5] truncate mt-1">{p.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[#0a0f1d]/90 border border-[#1f2d4a] shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#1b253b]">
          <div className="flex items-center gap-3.5">
            <span className="text-2xl">{active.logo}</span>
            <div>
              <b className="text-sm font-semibold text-white block">{active.name}</b>
              <p className="text-xs text-[#7e91b5]">{active.description}</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-[#8ea8ff]/20 text-[#8ea8ff] border border-[#8ea8ff]/40 font-mono font-semibold">
            ACTIVE PROVIDER
          </span>
        </div>

        <p className="text-xs text-[#8ea0c2] leading-relaxed bg-[#060912] p-3.5 rounded-xl border border-[#162138]">
          {active.instructions}
        </p>

        <div>
          <label className="field-label">SELECT MODEL FOR {active.name.toUpperCase()}</label>
          <ModelSelect
            className="w-full mt-2 p-3 rounded-xl bg-[#060912] border border-[#23314d] text-sm text-[#eef3ff] outline-none focus:border-[#8ea8ff]"
            models={active.models}
            value={draft.model}
            onChange={m => setDraft({ ...draft, model: m })}
          />
        </div>

        {active.baseUrlLabel && (
          <div>
            <label className="field-label">{active.baseUrlLabel.toUpperCase()}</label>
            <div className="mt-2">
              <input
                type="url"
                value={draft.baseUrl}
                onChange={e => handleBaseUrlChange(e.target.value)}
                placeholder={active.baseUrl}
                autoComplete="off"
                className="w-full p-3 rounded-xl bg-[#060912] border border-[#23314d] text-xs text-[#eef3ff] outline-none focus:border-[#8ea8ff] font-mono"
              />
            </div>
          </div>
        )}

        {active.requiresKey && (
          <div>
            <label className="field-label">{active.keyLabel.toUpperCase()}</label>
            <div className="mt-2 flex items-center bg-[#060912] border border-[#23314d] rounded-xl px-3.5 focus-within:border-[#8ea8ff]">
              <KeyRound size={16} className="text-[#64748b] flex-none mr-2.5" />
              <input
                type={show ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={e => handleKeyChange(e.target.value)}
                placeholder={active.keyPlaceholder}
                autoComplete="off"
                className="w-full py-3 bg-transparent text-xs text-[#eef3ff] outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Hide key' : 'Show key'}
                className="text-[#64748b] hover:text-white p-1 cursor-pointer"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-[#6d81a4] mt-1.5">
              Keys are stored strictly in your browser and used only for direct calls to {active.name}.
            </p>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={draft.remember}
            onChange={e => setDraft({ ...draft, remember: e.target.checked })}
            className="mt-1 rounded border-[#263350] accent-[#8ea8ff]"
          />
          <span className="text-xs text-[#9eb0d6]">
            <b className="text-white block font-medium">Remember settings and keys on this device</b>
            <span className="text-xs text-[#7184a8]">Saved in localStorage so you don't need to re-enter them.</span>
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-[#070a12] border border-[#1b2438] text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.includes('Connected') || status.includes('Saved') || status.includes('Detected') ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-[#c5d4f3] font-medium">{status}</span>
        </div>
        <span className="text-[11px] text-[#6d7f9f] font-mono">{active.route}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          className="playful-pop px-4 py-2 rounded-lg bg-[#8ea8ff] hover:bg-[#a6bdff] text-[#060c19] text-xs font-bold flex-1 sm:flex-none cursor-pointer"
          onClick={save}
          disabled={!isProviderReady(draft)}
        >
          Save settings
        </button>
        <button
          type="button"
          className="playful-pop px-4 py-2 rounded-lg bg-[#141d30] hover:bg-[#1e2a44] border border-[#2d3e64] text-xs text-white flex-1 sm:flex-none cursor-pointer"
          onClick={test}
          disabled={!isProviderReady(draft)}
        >
          Test connection
        </button>
        <button
          type="button"
          className="playful-pop px-3 py-2 text-xs text-rose-400 hover:text-rose-300 ml-auto cursor-pointer"
          onClick={remove}
        >
          Remove credentials
        </button>
      </div>

      <ConnectionDetails provider={draft.provider} route={active.route} />
    </div>
  );
}

function ConnectionDetails({ provider, route }: { provider: ProviderId; route: string }) {
  const name = getProvider(provider).name;
  return (
    <div className="p-4 rounded-xl bg-[#060912] border border-[#161e30] space-y-2 text-xs">
      <h3 className="text-xs font-bold text-[#8ea8ff] uppercase tracking-wider">Security & Routing Architecture</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] pt-1">
        <dt className="text-[#64748b]">Client Interface</dt>
        <dd className="text-[#c5d4f3] font-mono">Aplx Web Workstation</dd>
        <dt className="text-[#64748b]">Active Model Engine</dt>
        <dd className="text-[#c5d4f3] font-mono">{name}</dd>
        <dt className="text-[#64748b]">Request Destination</dt>
        <dd className="text-[#c5d4f3] font-mono">{route}</dd>
        <dt className="text-[#64748b]">Backend Server Ingestion</dt>
        <dd className="text-emerald-400 font-mono">0% (Pure Browser Client-Side)</dd>
      </dl>
    </div>
  );
}

export function ChatModelSelect({
  config,
  onModelChange,
  onRequireKeyPrompt,
  detectedLocalModels,
}: {
  config: ProviderConfig;
  onModelChange: (modelId: string, providerId: ProviderId) => void;
  onRequireKeyPrompt?: (providerName: string, providerId: ProviderId) => void;
  detectedLocalModels?: LocalDetectionResult | null;
}) {
  const handleChange = (selectedModelId: string) => {
    // Check if it's a detected local model
    if (detectedLocalModels?.isAvailable && detectedLocalModels.models.some(m => m.id === selectedModelId)) {
      onModelChange(selectedModelId, 'ollama');
      return;
    }

    const foundProvider = findProviderByModel(selectedModelId);
    const providerId = foundProvider ? foundProvider.id : config.provider;

    // Check if key is required and missing
    if (foundProvider && foundProvider.requiresKey) {
      const hasKey = !!config.apiKeys?.[providerId] || (providerId === config.provider && !!config.apiKey);
      if (!hasKey) {
        onRequireKeyPrompt?.(foundProvider.name, providerId);
      }
    }

    onModelChange(selectedModelId, providerId);
  };

  return (
    <select
      className="model-select-header cursor-pointer bg-transparent text-[#d6def5] outline-none text-xs font-medium pr-2 max-w-[200px] sm:max-w-[320px] truncate"
      value={config.model}
      onChange={e => handleChange(e.target.value)}
      aria-label="Model Selection"
    >
      {/* If local offline models are detected, display them at the very top */}
      {detectedLocalModels?.isAvailable && detectedLocalModels.models.length > 0 && (
        <optgroup
          label="⚡ LOCAL OFFLINE MODELS (0 KEYS REQUIRED)"
          className="bg-[#050e18] text-cyan-300 font-bold"
        >
          {detectedLocalModels.models.map(m => (
            <option
              key={`local-${m.id}`}
              value={m.id}
              className="bg-[#0b1322] text-cyan-100 font-medium"
            >
              ⚡ {m.name} {m.size ? `(${m.size})` : ''} — Offline
            </option>
          ))}
        </optgroup>
      )}

      {PROVIDER_LIST.map(provider => {
        const hasKey = !!config.apiKeys?.[provider.id] || (provider.id === config.provider && !!config.apiKey);
        const isOffline = !provider.requiresKey;
        const statusPrefix = isOffline ? '⚡' : hasKey ? '✓' : '🔒';
        const statusLabel = isOffline ? '[Offline]' : hasKey ? '[Ready]' : '[Key Needed]';

        return (
          <optgroup
            key={provider.id}
            label={`${statusPrefix} ${provider.name} ${statusLabel}`}
            className={`font-bold ${hasKey || isOffline ? 'bg-[#0a0e19] text-[#8ea8ff]' : 'bg-[#090a10] text-[#6d7994]'}`}
          >
            {provider.models.map(m => (
              <option
                key={m.id}
                value={m.id}
                className="bg-[#0b0e17] text-[#d6def5] font-normal"
              >
                {statusPrefix} {m.label} {!hasKey && !isOffline ? '(Key Req.)' : ''}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
