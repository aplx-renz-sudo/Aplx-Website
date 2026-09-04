import { Download, ExternalLink, Terminal, Globe, X, Sparkles } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallModal({ isOpen, onClose }: InstallModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
    >
      <div className="modal-dialog" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: '#8ea8ff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                letterSpacing: '0.04em',
              }}
            >
              <Download size={13} /> INSTALL APLX
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3
              id="install-modal-title"
              style={{ fontSize: '16px', fontWeight: 600, color: '#f5f5f7', margin: '0 0 6px 0' }}
            >
              Choose your Aplx installation
            </h3>
            <p style={{ fontSize: '13px', color: '#86868b', margin: 0, lineHeight: 1.5 }}>
              Run Aplx natively on your terminal or get the open-source web workstation.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {/* Option 1: CLI */}
            <a
              href="https://github.com/Korentic/Aplx"
              target="_blank"
              rel="noreferrer"
              id="install-aplx-cli-option"
              className="playful-pop"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                textDecoration: 'none',
                color: '#f5f5f7',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(41, 151, 255, 0.15)',
                    border: '1px solid rgba(41, 151, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2997ff',
                    flexShrink: 0,
                  }}
                >
                  <Terminal size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
                    1. Install Aplx CLI
                  </div>
                  <div style={{ fontSize: '12px', color: '#8ea8ff' }}>
                    github.com/Korentic/Aplx
                  </div>
                </div>
              </div>
              <ExternalLink size={16} style={{ color: '#86868b', flexShrink: 0 }} />
            </a>

            {/* Option 2: Web App */}
            <a
              href="https://github.com/aplx-renz-sudo/Aplx-Website"
              target="_blank"
              rel="noreferrer"
              id="install-aplx-web-option"
              className="playful-pop"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                textDecoration: 'none',
                color: '#f5f5f7',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
                    2. Install Aplx Web (Webapp version dropping soon!)
                  </div>
                  <div style={{ fontSize: '12px', color: '#c084fc' }}>
                    github.com/aplx-renz-sudo/Aplx-Website
                  </div>
                </div>
              </div>
              <ExternalLink size={16} style={{ color: '#86868b', flexShrink: 0 }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
