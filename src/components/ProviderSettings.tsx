import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import type { ProviderConfig } from '../lib/credential';
import { findProviderByModel, getProvider, PROVIDER_LIST, type ProviderId } from '../providers/registry';
import { createProvider, isProviderReady } from '../providers';

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

  useEffect(() => {
    setDraft(config);
  }, [config]);

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
    <>
      <div className="section-kicker">AI PROVIDERS & MODELS</div>
      <h2>Power Aplx your way.</h2>
      <p className="lead">
        <b>Aplx is your AI assistant.</b> Switch between top models from Gemini, OpenAI, Claude, Grok, Mistral, Moonshot Kimi, MiniMax, Groq, OpenRouter, or local Ollama.
        Direct client-side routing means your keys never pass through any Aplx server.
      </p>

      <div className="aplx-instructions glass-panel">
        <b>How Aplx works</b>
        <ol>
          <li>Pick any provider below or select any model in the header.</li>
          <li>Add your API key or local URL — saved only in your browser.</li>
          <li>Chat with <b>Aplx</b>. The chosen model answers behind the scenes.</li>
        </ol>
      </div>

      <label className="field-label">CHOOSE PROVIDER ({PROVIDER_LIST.length} AVAILABLE)</label>
      <div className="provider-picker" role="list">
        {PROVIDER_LIST.map(p => {
          const hasKey = !!draft.apiKeys?.[p.id] || (draft.provider === p.id && !!draft.apiKey);
          return (
            <button
              key={p.id}
              type="button"
              role="listitem"
              className={'provider-pick playful-pill' + (draft.provider === p.id ? ' active' : '')}
              onClick={() => pickProvider(p.id)}
              aria-pressed={draft.provider === p.id}
            >
              <span className="provider-logo">{p.logo}</span>
              <span className="flex-1">
                <span className="flex items-center justify-between">
                  <b>{p.name}</b>
                  {hasKey && <span className="text-[10px] text-emerald-400">● Configured</span>}
                </span>
                <small>{p.description}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="provider-card">
        <div className="provider-logo">{active.logo}</div>
        <div>
          <b>{active.name}</b>
          <p>{active.description}</p>
        </div>
        <span className="active-tag">SELECTED</span>
      </div>

      <p className="model-note provider-hint">{active.instructions}</p>

      <label className="field-label">MODEL ({active.models.length} FOR {active.name.toUpperCase()})</label>
      <ModelSelect
        className="model-select"
        models={active.models}
        value={draft.model}
        onChange={m => setDraft({ ...draft, model: m })}
      />

      {active.baseUrlLabel && (
        <>
          <label className="field-label">{active.baseUrlLabel.toUpperCase()}</label>
          <div className="key-input">
            <input
              type="url"
              value={draft.baseUrl}
              onChange={e => handleBaseUrlChange(e.target.value)}
              placeholder={active.baseUrl}
              autoComplete="off"
            />
          </div>
        </>
      )}

      {active.requiresKey && (
        <>
          <label className="field-label">{active.keyLabel.toUpperCase()}</label>
          <div className="key-input">
            <KeyRound size={18} />
            <input
              type={show ? 'text' : 'password'}
              value={draft.apiKey}
              onChange={e => handleKeyChange(e.target.value)}
              placeholder={active.keyPlaceholder}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? 'Hide key' : 'Show key'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </>
      )}

      <label className="remember">
        <input
          type="checkbox"
          checked={draft.remember}
          onChange={e => setDraft({ ...draft, remember: e.target.checked })}
        />
        <span>
          <b>Remember settings on this device</b>
          <small>Persist API keys securely in local browser storage across sessions.</small>
        </span>
      </label>

      <div className="connection">
        <span className={status.includes('Connected') || status.includes('Saved') ? 'success' : ''} />
        <div>
          <b>{status}</b>
          <small>Request route: {active.route}</small>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="primary playful-btn"
          onClick={test}
          disabled={!isProviderReady(draft)}
        >
          Test connection
        </button>
        <button
          className="secondary playful-btn"
          onClick={save}
          disabled={!isProviderReady(draft)}
        >
          Save settings
        </button>
        <button className="text-danger" onClick={remove}>
          Remove credentials
        </button>
      </div>

      <ConnectionDetails provider={draft.provider} route={active.route} />
    </>
  );
}

function ConnectionDetails({ provider, route }: { provider: ProviderId; route: string }) {
  const name = getProvider(provider).name;
  return (
    <div className="details">
      <h3>Connection details</h3>
      <dl>
        <dt>Assistant</dt>
        <dd>Aplx (your interface)</dd>
        <dt>Active model provider</dt>
        <dd>{name}</dd>
        <dt>Credential</dt>
        <dd>User-provided (Local)</dd>
        <dt>Request route</dt>
        <dd>{route}</dd>
        <dt>Aplx server access</dt>
        <dd>None</dd>
        <dt>API key stored on server</dt>
        <dd>No (Client-side only)</dd>
      </dl>
    </div>
  );
}

export function ChatModelSelect({
  config,
  onModelChange,
}: {
  config: ProviderConfig;
  onModelChange: (modelId: string, providerId: ProviderId) => void;
}) {
  const handleChange = (selectedModelId: string) => {
    const foundProvider = findProviderByModel(selectedModelId);
    const providerId = foundProvider ? foundProvider.id : config.provider;
    onModelChange(selectedModelId, providerId);
  };

  return (
    <select
      className="model-select-header cursor-pointer bg-transparent text-[#d6def5] outline-none text-xs"
      value={config.model}
      onChange={e => handleChange(e.target.value)}
      aria-label="Model Selection"
    >
      {PROVIDER_LIST.map(provider => (
        <optgroup
          key={provider.id}
          label={`${provider.logo} ${provider.name}`}
          className="bg-[#0b0e17] text-[#8ea8ff] font-bold"
        >
          {provider.models.map(m => (
            <option
              key={m.id}
              value={m.id}
              className="bg-[#0b0e17] text-[#d6def5] font-normal"
            >
              {m.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
