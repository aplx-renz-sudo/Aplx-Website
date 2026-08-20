import React from 'react';
import { KeyRound, ShieldAlert, X, Cpu, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { getProvider, PROVIDER_LIST, type ProviderId } from '../providers/registry';
import type { ProviderConfig } from '../lib/credential';
import type { LocalDetectionResult } from '../lib/localModelDetector';

type ApiKeyRequiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
  providerId: ProviderId;
  providerConfig: ProviderConfig;
  onGoToSettings: (providerId: ProviderId) => void;
  onSwitchToLocal: (modelId?: string) => void;
  localDetection?: LocalDetectionResult | null;
};

export function ApiKeyRequiredModal({
  isOpen,
  onClose,
  providerId,
  providerConfig,
  onGoToSettings,
  onSwitchToLocal,
  localDetection,
}: ApiKeyRequiredModalProps) {
  if (!isOpen) return null;

  const provider = getProvider(providerId);

  // Find any configured providers with keys
  const configuredProviders = PROVIDER_LIST.filter(
    p => p.requiresKey && (!!providerConfig.apiKeys?.[p.id] || (providerConfig.provider === p.id && !!providerConfig.apiKey))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-2xl bg-[#090d18] border border-[#263553] shadow-2xl shadow-black/90 space-y-5 text-[#dbe5ff]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#657697] hover:text-white hover:bg-[#141d30]"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-none shadow-inner">
            <KeyRound size={22} />
          </div>
          <div>
            <div className="text-[11px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={13} /> Missing Provider API Key
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              {provider.name} Requires an API Key
            </h3>
          </div>
        </div>

        {/* Body Description */}
        <div className="p-3.5 rounded-xl bg-[#060912] border border-[#1b263e] text-xs text-[#9eb0d6] space-y-2 leading-relaxed">
          <p>
            You selected a model on <b>{provider.name}</b>, but no {provider.name} API key is currently saved on this device.
          </p>
          <p className="text-[#7d91b8]">
            ⚠️ <b>Rule:</b> Aplx communicates directly from your browser to each provider. You can only use models whose specific provider API key is stored, or switch to 100% free offline models.
          </p>
        </div>

        {/* Action Choices */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToSettings(providerId);
            }}
            className="playful-pop w-full p-3 rounded-xl bg-[#8ea8ff] hover:bg-[#a5bdff] text-[#060c19] font-bold text-xs flex items-center justify-between shadow-lg shadow-[#8ea8ff]/15"
          >
            <span className="flex items-center gap-2">
              <KeyRound size={15} /> Add {provider.name} API Key in Settings
            </span>
            <ArrowRight size={15} />
          </button>

          {/* Local offline alternative */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToLocal(localDetection?.recommendedModel?.id || 'llama3.3');
            }}
            className="playful-pop w-full p-3 rounded-xl bg-[#0e172a] hover:bg-[#14213d] border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Cpu size={15} className="text-cyan-400" />
              <span>Use Offline Model (Ollama / Local — 0 Keys Needed)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/40">
              Free & Private
            </span>
          </button>

          {/* If there are already configured providers */}
          {configuredProviders.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] text-[#6d80a6] mb-1.5 font-medium">Or switch to a model you already configured:</div>
              <div className="flex flex-wrap gap-1.5">
                {configuredProviders.map(cp => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToSettings(cp.id);
                    }}
                    className="playful-pop text-xs px-2.5 py-1 rounded-lg bg-[#10172b] border border-[#253456] text-[#b3c7f0] hover:text-white hover:border-[#8ea8ff] flex items-center gap-1.5"
                  >
                    <span>{cp.logo}</span>
                    <span>{cp.name}</span>
                    <span className="text-emerald-400 text-[10px]">✓</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
