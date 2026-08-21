import { KeyRound, ShieldAlert, X, Cpu, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0c101a]/95 border border-white/[0.1] shadow-2xl space-y-4 text-[#f5f5f7]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.08] transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 flex-none">
            <KeyRound size={18} />
          </div>
          <div>
            <div className="text-[10.5px] text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={12} /> Authentication Required
            </div>
            <h3 className="text-base font-semibold text-[#f5f5f7] tracking-tight mt-0.5">
              {provider.name} Requires an API Key
            </h3>
          </div>
        </div>

        {/* Body Description */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-[#86868b] space-y-1.5 leading-relaxed">
          <p>
            You selected a model on <b className="text-[#f5f5f7]">{provider.name}</b>, but no credentials are saved locally in your browser.
          </p>
          <p className="text-[#636366]">
            Aplx connects directly from your browser to the provider without intermediate proxy servers.
          </p>
        </div>

        {/* Action Choices */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToSettings(providerId);
            }}
            className="w-full p-2.5 rounded-xl bg-[#f5f5f7] hover:bg-white text-black font-semibold text-xs flex items-center justify-between transition-colors shadow-md cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <KeyRound size={14} /> Add {provider.name} Key in Settings
            </span>
            <ArrowRight size={14} />
          </button>

          {/* Local offline alternative */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToLocal(localDetection?.recommendedModel?.id || 'llama3.3');
            }}
            className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#f5f5f7] text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Cpu size={14} className="text-[#2997ff]" />
              <span>Use Offline Model (Ollama / LM Studio)</span>
            </span>
            <span className="text-[10px] text-[#86868b] font-mono">No Key</span>
          </button>

          {/* Other configured providers if available */}
          {configuredProviders.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="text-[10.5px] font-mono text-[#86868b] uppercase tracking-wider mb-1.5">
                Configured Providers with Saved Keys
              </div>
              <div className="flex flex-wrap gap-1">
                {configuredProviders.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToSettings(p.id);
                    }}
                    className="px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-[11px] text-[#f5f5f7] flex items-center gap-1 transition-colors"
                  >
                    <Sparkles size={11} className="text-[#2997ff]" />
                    <span>{p.name}</span>
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
