import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import type { ProviderConfig } from '../lib/credential';
import { getProvider, PROVIDER_LIST, type ProviderId } from '../providers/registry';
import { createProvider, isProviderReady } from '../providers';

function ModelSelect({ models, value, onChange, className }: {
  models: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select className={className} value={value} onChange={e => onChange(e.target.value)} aria-label="Model">
      {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
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
  const [status, setStatus] = useState(() => (isProviderReady(config) ? 'Saved in browser' : 'Not connected'));

  useEffect(() => { setDraft(config); }, [config]);

  const active = getProvider(draft.provider);

  const pickProvider = (id: ProviderId) => {
    const def = getProvider(id);
    setDraft(prev => ({
      ...prev,
      provider: id,
      model: def.models.some(m => m.id === prev.model) ? prev.model : def.defaultModel,
      baseUrl: def.baseUrl || prev.baseUrl,
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
    } catch {
      setStatus('Connection failed — check settings or quota');
    }
  };

  const remove = () => {
    const cleared = { ...draft, apiKey: '' };
    setDraft(cleared);
    onChange(cleared);
    setStatus('Credentials removed from this browser');
  };

  return (
    <>
      <div className="section-kicker">AI PROVIDER</div>
      <h2>Power Aplx your way.</h2>
      <p className="lead">
        <b>Aplx is your AI assistant.</b> It does not ship with a built-in model — you choose the provider and credentials.
        Messages go from your browser straight to that provider. Aplx never proxies or stores your API keys on a server.
      </p>

      <div className="aplx-instructions glass-panel">
        <b>How Aplx works</b>
        <ol>
          <li>Pick a provider below (Gemini, ChatGPT, Groq, OpenRouter, or local Ollama).</li>
          <li>Add your API key or local URL — only stored in this browser.</li>
          <li>Chat with <b>Aplx</b>. The model you selected answers behind the scenes.</li>
        </ol>
      </div>

      <label className="field-label">CHOOSE PROVIDER</label>
      <div className="provider-picker" role="list">
        {PROVIDER_LIST.map(p => (
          <button
            key={p.id}
            type="button"
            role="listitem"
            className={'provider-pick' + (draft.provider === p.id ? ' active' : '')}
            onClick={() => pickProvider(p.id)}
            aria-pressed={draft.provider === p.id}
          >
            <span className="provider-logo">{p.logo}</span>
            <span><b>{p.name}</b><small>{p.description}</small></span>
          </button>
        ))}
      </div>

      <div className="provider-card">
        <div className="provider-logo">{active.logo}</div>
        <div><b>{active.name}</b><p>{active.description}</p></div>
        <span className="active-tag">SELECTED</span>
      </div>

      <p className="model-note provider-hint">{active.instructions}</p>

      <label className="field-label">MODEL</label>
      <ModelSelect className="model-select" models={active.models} value={draft.model} onChange={m => setDraft({ ...draft, model: m })} />

      {active.baseUrlLabel && (
        <>
          <label className="field-label">{active.baseUrlLabel.toUpperCase()}</label>
          <div className="key-input">
            <input
              type="url"
              value={draft.baseUrl}
              onChange={e => setDraft({ ...draft, baseUrl: e.target.value })}
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
              onChange={e => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder={active.keyPlaceholder}
              autoComplete="off"
            />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide key' : 'Show key'}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </>
      )}

      <label className="remember">
        <input type="checkbox" checked={draft.remember} onChange={e => setDraft({ ...draft, remember: e.target.checked })} />
        <span><b>Remember settings on this device</b><small>Off by default. Otherwise, config stays only for this browser session.</small></span>
      </label>

      <div className="connection">
        <span className={status.includes('Connected') ? 'success' : ''} />
        <div><b>{status}</b><small>Request route: {active.route}</small></div>
      </div>

      <div className="settings-actions">
        <button className="primary" onClick={test} disabled={!isProviderReady(draft)}>Test connection</button>
        <button className="secondary" onClick={save} disabled={!isProviderReady(draft)}>Save settings</button>
        <button className="text-danger" onClick={remove}>Remove credentials</button>
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
        <dt>Assistant</dt><dd>Aplx (your interface)</dd>
        <dt>Model provider</dt><dd>{name}</dd>
        <dt>Credential</dt><dd>User-provided</dd>
        <dt>Request route</dt><dd>{route}</dd>
        <dt>Aplx server access</dt><dd>None</dd>
        <dt>API key stored by Aplx server</dt><dd>No</dd>
      </dl>
    </div>
  );
}

export function ChatModelSelect({ config, onModelChange }: { config: ProviderConfig; onModelChange: (m: string) => void }) {
  const models = getProvider(config.provider).models;
  return <ModelSelect models={models} value={config.model} onChange={onModelChange} />;
}
