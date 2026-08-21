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
    isProviderReady(config) ? 'Saved locally in browser' : 'Not connected'
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
        setStatus('No local server found on port 11434 or 1234');
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
    setStatus(`Switched to ${modelId} (Offline · No Key)`);
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
    setStatus('Saved in ' + (draft.remember ? 'local storage' : 'current session'));
  };

  const test = async () => {
    if (!isProviderReady(draft)) return;
    setStatus('Testing direct connection…');
    try {
      await createProvider({
        provider: draft.provider,
        apiKey: draft.apiKey,
        model: draft.model,
        baseUrl: draft.baseUrl,
      }).testConnection();
      setStatus('Connected successfully to ' + active.name);
    } catch (err) {
      setStatus(`Connection failed: ${err instanceof Error ? err.message : 'check credentials'}`);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#f5f5f7] tracking-tight">AI Engines & Providers</h2>
        <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
          Aplx routes prompts directly from your browser to each respective provider API. Your keys and messages remain private and are never stored on external proxy servers.
        </p>
      </div>

      {/* Provider API Key Guideline */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-medium text-xs">
          <AlertTriangle size={15} />
          <span>Provider Credentials</span>
        </div>
        <p className="text-xs text-[#86868b] leading-relaxed">
          Each provider requires its own API key configured on this device. Local models run entirely on your hardware with no keys needed.
        </p>
      </div>

      {/* Local Model Auto-Detection */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[#2997ff] flex-none">
              <Cpu size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#f5f5f7] flex items-center gap-2">
                <span>Offline Model Server Detection</span>
                {localDetection?.isAvailable && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-mono">
                    Connected ({localDetection.provider})
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#86868b] mt-0.5">
                {localDetection?.isAvailable
                  ? `Found ${localDetection.models.length} model(s) installed locally`
                  : 'Scan localhost:11434 (Ollama) or localhost:1234 (LM Studio)'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleScanLocalModels}
            disabled={isScanningLocal}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs text-[#f5f5f7] flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-colors"
          >
            <RefreshCw size={12} className={isScanningLocal ? 'animate-spin' : ''} />
            <span>{isScanningLocal ? 'Scanning…' : 'Scan Machine'}</span>
          </button>
        </div>

        {/* List of Detected Local Models */}
        {localDetection?.isAvailable && localDetection.models.length > 0 && (
          <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
            <div className="text-xs text-[#2997ff] font-medium flex items-center gap-1">
              <Sparkles size={12} /> Detected Local Models:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {localDetection.models.map(m => {
                const isCurrent = draft.provider === 'ollama' && draft.model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleApplyDetectedLocalModel(m.id)}
                    className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-blue-500/15 border-[#2997ff] text-[#f5f5f7]'
                        : 'bg-white/[0.02] border-white/[0.06] text-[#86868b] hover:text-[#f5f5f7] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-medium truncate flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {isCurrent && <CheckCircle2 size={12} className="text-[#2997ff] flex-none" />}
                      </div>
                      <div className="text-[10.5px] text-[#636366] font-mono truncate mt-0.5">
                        {m.id} {m.size ? `• ${m.size}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-[#f5f5f7] flex-none border border-white/[0.08]">
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
        <label className="text-[10.5px] font-mono tracking-wider text-[#86868b] block mb-2">
          SELECT PROVIDER ({PROVIDER_LIST.length} AVAILABLE)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="list">
          {PROVIDER_LIST.map(p => {
            const hasKey = !!draft.apiKeys?.[p.id] || (draft.provider === p.id && !!draft.apiKey);
            const isLocal = !p.requiresKey;
            return (
              <button
                key={p.id}
                type="button"
                role="listitem"
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  draft.provider === p.id
                    ? 'bg-white/[0.08] border-[#2997ff] text-[#f5f5f7]'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#86868b] hover:text-[#f5f5f7] hover:border-white/[0.14]'
                }`}
                onClick={() => pickProvider(p.id)}
                aria-pressed={draft.provider === p.id}
              >
                <span className="text-lg w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.08] flex-none">
                  {p.logo}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#f5f5f7] truncate">{p.name}</span>
                    {isLocal ? (
                      <span className="text-[10px] text-cyan-400 font-mono">Offline</span>
                    ) : hasKey ? (
                      <span className="text-[10px] text-emerald-400 font-mono">Configured</span>
                    ) : (
                      <span className="text-[10px] text-[#636366] font-mono">Key required</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#86868b] truncate mt-0.5">{p.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{active.logo}</span>
            <div>
              <span className="text-xs font-semibold text-[#f5f5f7] block">{active.name}</span>
              <p className="text-[11px] text-[#86868b]">{active.description}</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b] font-mono">
            SELECTED
          </span>
        </div>

        <p className="text-xs text-[#86868b] leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
          {active.instructions}
        </p>

        <div>
          <label className="text-[10.5px] font-mono tracking-wider text-[#86868b] block mb-1.5">
            DEFAULT MODEL FOR {active.name.toUpperCase()}
          </label>
          <ModelSelect
            className="w-full p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#f5f5f7] outline-none focus:border-[#2997ff]"
            models={active.models}
            value={draft.model}
            onChange={m => setDraft({ ...draft, model: m })}
          />
        </div>

        {active.baseUrlLabel && (
          <div>
            <label className="text-[10.5px] font-mono tracking-wider text-[#86868b] block mb-1.5">
              {active.baseUrlLabel.toUpperCase()}
            </label>
            <input
              type="url"
              value={draft.baseUrl}
              onChange={e => handleBaseUrlChange(e.target.value)}
              placeholder={active.baseUrl}
              autoComplete="off"
              className="w-full p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#f5f5f7] outline-none focus:border-[#2997ff] font-mono"
            />
          </div>
        )}

        {active.requiresKey && (
          <div>
            <label className="text-[10.5px] font-mono tracking-wider text-[#86868b] block mb-1.5">
              {active.keyLabel.toUpperCase()}
            </label>
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 focus-within:border-[#2997ff]">
              <KeyRound size={14} className="text-[#636366] flex-none mr-2" />
              <input
                type={show ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={e => handleKeyChange(e.target.value)}
                placeholder={active.keyPlaceholder}
                autoComplete="off"
                className="w-full py-2.5 bg-transparent text-xs text-[#f5f5f7] outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Hide key' : 'Show key'}
                className="text-[#636366] hover:text-[#f5f5f7] p-1 cursor-pointer"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-[#636366] mt-1">
              Keys are stored locally in your browser and used only for direct calls to {active.name}.
            </p>
          </div>
        )}

        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={draft.remember}
            onChange={e => setDraft({ ...draft, remember: e.target.checked })}
            className="mt-0.5 rounded text-blue-500 accent-blue-500"
          />
          <span className="text-xs text-[#86868b]">
            <span className="text-[#f5f5f7] block font-medium">Persist credentials across browser sessions</span>
            <span className="text-[11px] text-[#636366]">Saved in localStorage on this device.</span>
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.includes('Connected') || status.includes('Saved') || status.includes('Detected') ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-[#86868b]">{status}</span>
        </div>
        <span className="text-[10px] text-[#636366] font-mono">{active.route}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-[#f5f5f7] hover:bg-white text-black text-xs font-semibold cursor-pointer transition-colors"
          onClick={save}
          disabled={!isProviderReady(draft)}
        >
          Save Settings
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-xs text-[#f5f5f7] cursor-pointer transition-colors"
          onClick={test}
          disabled={!isProviderReady(draft)}
        >
          Test Connection
        </button>
        <button
          type="button"
          className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 ml-auto cursor-pointer"
          onClick={remove}
        >
          Remove Key
        </button>
      </div>

      <ConnectionDetails provider={draft.provider} route={active.route} />
    </div>
  );
}

function ConnectionDetails({ provider, route }: { provider: ProviderId; route: string }) {
  const name = getProvider(provider).name;
  return (
    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-xs">
      <div className="text-[10.5px] font-mono text-[#86868b] uppercase tracking-wider">Security & Routing Architecture</div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-1">
        <dt className="text-[#636366]">Client Interface</dt>
        <dd className="text-[#f5f5f7] font-mono">Aplx Web Workstation</dd>
        <dt className="text-[#636366]">Engine</dt>
        <dd className="text-[#f5f5f7] font-mono">{name}</dd>
        <dt className="text-[#636366]">Endpoint</dt>
        <dd className="text-[#f5f5f7] font-mono">{route}</dd>
        <dt className="text-[#636366]">Server Ingestion</dt>
        <dd className="text-emerald-400 font-mono">0% (Pure Client-Side)</dd>
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
      className="model-select-header cursor-pointer bg-transparent text-[#f5f5f7] outline-none text-xs font-medium pr-2 max-w-[200px] sm:max-w-[320px] truncate"
      value={config.model}
      onChange={e => handleChange(e.target.value)}
      aria-label="Model Selection"
    >
      {/* If local offline models are detected, display them at the very top */}
      {detectedLocalModels?.isAvailable && detectedLocalModels.models.length > 0 && (
        <optgroup
          label="⚡ LOCAL OFFLINE MODELS"
          className="bg-[#0c101a] text-cyan-400 font-bold"
        >
          {detectedLocalModels.models.map(m => (
            <option
              key={`local-${m.id}`}
              value={m.id}
              className="bg-[#0c101a] text-[#f5f5f7] font-medium"
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
            className={`font-semibold ${hasKey || isOffline ? 'bg-[#0c101a] text-[#f5f5f7]' : 'bg-[#0c101a] text-[#636366]'}`}
          >
            {provider.models.map(m => (
              <option
                key={m.id}
                value={m.id}
                className="bg-[#0c101a] text-[#f5f5f7] font-normal"
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
