import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp, Check, ChevronLeft, Copy, Eye, EyeOff, KeyRound, Menu, MessageSquarePlus, Orbit, RotateCcw, Settings, ShieldCheck, Sparkles, Trash2, X, WandSparkles, Telescope, BookOpen, Code2 } from 'lucide-react';
import { GeminiProvider } from './providers/gemini';
import type { ChatTurn } from './providers/types';
import { clearLocalData, getRemember, loadKey, removeKey, saveKey } from './lib/credential';
import { AboutPage } from './pages/AboutPage';

type View = 'landing' | 'chat' | 'settings' | 'privacy' | 'about';
type Message = ChatTurn & { id: string; time: string };
type Preferences = { theme: 'black' | 'midnight'; compact: boolean; sendOnEnter: boolean; motion: boolean };

const preferenceKey = 'aplx:preferences';
const defaultPreferences: Preferences = { theme: 'black', compact: false, sendOnEnter: true, motion: false };
const MODELS = [
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
] as const;
const starter: Message[] = [{
  id: 'welcome',
  role: 'model',
  time: 'now',
  content: "Welcome to **Aplx Web**.\n\nI'm ready when you are. Add your own Gemini API key in Settings to start a private, direct connection.",
}];
const now = () => new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(new Date());

function Mark({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ children, className, ...props }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) return <pre><code className={className} {...props}>{children}</code></pre>;
          return <code className={className} {...props}>{children}</code>;
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function ModelSelect({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <select className={className} value={value} onChange={e => onChange(e.target.value)} aria-label="Gemini model">
      {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
    </select>
  );
}

function Preference({ label, description, enabled, toggle }: { label: string; description: string; enabled: boolean; toggle: () => void }) {
  return (
    <div className="preference">
      <div><b>{label}</b><p>{description}</p></div>
      <button type="button" className={'toggle' + (enabled ? ' on' : '')} onClick={toggle} aria-pressed={enabled} aria-label={label}>
        <i />
      </button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [key, setKey] = useState(loadKey);
  const [messages, setMessages] = useState<Message[]>(starter);
  const [model, setModel] = useState<string>('gemini-3.5-flash');
  const [sidebar, setSidebar] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'provider' | 'privacy' | 'general' | 'about'>('provider');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(preferenceKey) || '{}') }; }
    catch { return defaultPreferences; }
  });
  const stop = useRef(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const updatePreferences = (next: Preferences) => {
    setPreferences(next);
    localStorage.setItem(preferenceKey, JSON.stringify(next));
  };
  const goSettings = () => { setSettingsTab('provider'); setView('settings'); };

  const send = async (text = input, replaceId?: string) => {
    const prompt = text.trim();
    if (!prompt || streaming) return;
    if (!key) { goSettings(); return; }

    const user: Message = { id: crypto.randomUUID(), role: 'user', content: prompt, time: now() };
    const assistant: Message = { id: crypto.randomUUID(), role: 'model', content: '', time: 'now' };
    let history: ChatTurn[] = [];

    setMessages(prev => {
      const base = replaceId ? prev.filter(m => m.id !== replaceId) : prev;
      history = base.filter(m => m.content).map(({ role, content }) => ({ role, content }));
      return [...base, user, assistant];
    });
    setInput('');
    setStreaming(true);
    stop.current = false;

    try {
      await new GeminiProvider(key, model).stream(prompt, history, chunk => {
        if (!stop.current) setMessages(m => m.map(x => x.id === assistant.id ? { ...x, content: x.content + chunk } : x));
      });
    } catch {
      setMessages(m => m.map(x => x.id === assistant.id ? {
        ...x,
        content: "I couldn't reach Gemini. Confirm your API key, connection, and available quota in Settings.",
      } : x));
    } finally {
      setStreaming(false);
      setMessages(m => m.map(x => x.id === assistant.id ? { ...x, time: now() } : x));
    }
  };

  const regenerate = (messageId: string) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx < 0) return;
    const userMsg = [...messages.slice(0, idx)].reverse().find(m => m.role === 'user');
    if (userMsg) void send(userMsg.content, messageId);
  };

  const newChat = () => { setMessages(starter); setView('chat'); setSidebar(false); };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: preferences.motion ? 'smooth' : 'instant' });
  }, [messages, preferences.motion]);

  return (
    <div className={'app theme-' + preferences.theme + (preferences.compact ? ' compact' : '') + (preferences.motion ? ' motion-on' : '') + (view === 'about' ? ' about-open' : '')}>
      <SpaceBackground motion={preferences.motion} />
      {view === 'landing' && <Landing launch={() => setView('chat')} settings={goSettings} privacy={() => setView('privacy')} about={() => setView('about')} />}
      {view === 'chat' && (
        <>
          <aside className={'sidebar ' + (sidebar ? 'open' : '')}>
            <div className="brand">
              <span className="brand-mark">A</span><span>APLX</span>
              <button className="close mobile" onClick={() => setSidebar(false)}><X size={18} /></button>
            </div>
            <button className="new-chat" onClick={newChat}><MessageSquarePlus size={17} /> New conversation</button>
            <div className="nav-label">TODAY</div>
            <button className="history active">A new beginning <span>•••</span></button>
            <div className="side-bottom">
              <button onClick={goSettings}><Settings size={17} /> Settings</button>
              <button onClick={() => setView('privacy')}><ShieldCheck size={17} /> Privacy & security</button>
              <button onClick={() => setView('about')}><Orbit size={17} /> About Aplx</button>
              <a className="github-side" href="https://github.com/Korentic/Aplx" target="_blank" rel="noreferrer">Install Aplx ↗</a>
              <div className="web-status"><span /> Aplx Web <small>Online</small></div>
            </div>
          </aside>
          <main className="chat">
            <header>
              <button className="icon mobile" onClick={() => setSidebar(true)}><Menu /></button>
              <label className="model"><span /><ModelSelect value={model} onChange={setModel} /></label>
              <div className="header-actions">
                <button className="icon" title="Clear conversation" onClick={newChat}><Trash2 size={18} /></button>
                <button className="icon" onClick={goSettings}><Settings size={18} /></button>
              </div>
            </header>
            <section className="messages">
              {messages.map(m => <MessageView key={m.id} message={m} regenerate={() => regenerate(m.id)} />)}
              {messages.length === 1 && <PromptDeck choose={send} />}
              <div ref={messagesEnd} />
            </section>
            <Composer
              value={input}
              change={setInput}
              send={() => send()}
              stop={() => { stop.current = true; setStreaming(false); }}
              streaming={streaming}
              sendOnEnter={preferences.sendOnEnter}
            />
          </main>
        </>
      )}
      {view === 'settings' && (
        <SettingsPage
          tab={settingsTab}
          setTab={setSettingsTab}
          keyValue={key}
          setKeyValue={setKey}
          model={model}
          setModel={setModel}
          preferences={preferences}
          setPreferences={updatePreferences}
          back={() => setView('chat')}
          onAbout={() => setView('about')}
        />
      )}
      {view === 'privacy' && <Privacy back={() => setView('landing')} settings={goSettings} about={() => setView('about')} />}
      {view === 'about' && (
        <AboutPage
          launch={() => setView('chat')}
          home={() => setView('landing')}
          settings={goSettings}
          motion={preferences.motion}
        />
      )}
    </div>
  );
}

function SpaceBackground({ motion }: { motion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!motion) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      el.style.setProperty('--star-x', `${x}px`);
      el.style.setProperty('--star-y', `${y}px`);
      el.classList.add('near');
    };
    const onLeave = () => el.classList.remove('near');
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [motion]);
  return <div ref={ref} className="space" aria-hidden="true"><i /><b /></div>;
}

function Landing({ launch, settings, privacy, about }: { launch: () => void; settings: () => void; privacy: () => void; about: () => void }) {
  return (
    <main className="landing">
      <nav>
        <div className="wordmark"><span>A</span> APLX</div>
        <div>
          <button onClick={about}>About</button>
          <button onClick={privacy}>Privacy</button>
          <button onClick={launch} className="nav-launch">Launch Aplx <ArrowUp size={14} /></button>
        </div>
      </nav>
      <div className="hero">
        <div className="eyebrow"><Sparkles size={14} /> PRIVATE AI SOFTWARE</div>
        <h1>AI, on <i>your</i> terms.</h1>
        <p>Aplx Web is a calm, direct way to work with your own AI provider. Your Gemini key stays in your browser—always under your control.</p>
        <div className="hero-actions">
          <button className="primary" onClick={launch}>Launch Aplx <ArrowUp size={16} /></button>
          <button className="secondary" onClick={settings}><KeyRound size={16} /> Configure Gemini</button>
        </div>
        <div className="trust">
          <span><ShieldCheck size={17} /> Your key, your browser</span>
          <span><Orbit size={17} /> Browser → Gemini</span>
          <span><Sparkles size={17} /> No Aplx telemetry</span>
        </div>
      </div>
      <footer>
        APLX WEB <span>•</span> A project by KORENTIC <span>•</span>
        <a href="https://github.com/Korentic/Aplx" target="_blank" rel="noreferrer">GITHUB · INSTALL APLX ↗</a>
      </footer>
    </main>
  );
}

function PromptDeck({ choose }: { choose: (prompt: string) => void }) {
  const prompts = [
    ['Plan a project', 'Turn an idea into a clear plan.', Telescope],
    ['Explain a concept', 'Learn something with useful examples.', BookOpen],
    ['Write some code', 'Build, debug, or refactor together.', Code2],
    ['Explore an idea', 'Think through the possibilities.', WandSparkles],
  ] as const;
  return (
    <div className="prompt-deck">
      {prompts.map(([title, body, Icon]) => (
        <button onClick={() => choose(`${title}: ${body}`)} key={title}>
          <Icon size={17} /><b>{title}</b><span>{body}</span>
        </button>
      ))}
    </div>
  );
}

function MessageView({ message, regenerate }: { message: Message; regenerate: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };
  return (
    <article className={'message ' + message.role}>
      <div className="avatar">{message.role === 'user' ? 'Y' : 'A'}</div>
      <div className="message-body">
        <div className="message-meta">{message.role === 'user' ? 'You' : 'Aplx'} <time>{message.time}</time></div>
        <Mark text={message.content || 'Thinking…'} />
        <div className="message-tools">
          <button onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button>
          {message.role === 'model' && message.content && (
            <button onClick={regenerate}><RotateCcw size={14} /> Regenerate</button>
          )}
        </div>
      </div>
    </article>
  );
}

function Composer({ value, change, send, stop, streaming, sendOnEnter }: {
  value: string; change: (x: string) => void; send: () => void; stop: () => void; streaming: boolean; sendOnEnter: boolean;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }, [value]);
  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={area}
          value={value}
          onChange={e => change(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && sendOnEnter) { e.preventDefault(); send(); } }}
          placeholder="Message Aplx…"
          rows={1}
        />
        {streaming ? (
          <button className="send stop" onClick={stop} aria-label="Stop generating"><span /></button>
        ) : (
          <button className="send" disabled={!value.trim()} onClick={send} aria-label="Send message"><ArrowUp size={18} /></button>
        )}
      </div>
      <p>{sendOnEnter ? 'Enter sends · Shift + Enter adds a line' : 'Enter adds a line · Use ↑ to send'}</p>
    </div>
  );
}

function SettingsPage({ tab, setTab, keyValue, setKeyValue, model, setModel, preferences, setPreferences, back, onAbout }: {
  tab: 'provider' | 'privacy' | 'general' | 'about';
  setTab: (x: 'provider' | 'privacy' | 'general' | 'about') => void;
  keyValue: string; setKeyValue: (x: string) => void;
  model: string; setModel: (x: string) => void;
  preferences: Preferences; setPreferences: (x: Preferences) => void;
  back: () => void;
  onAbout: () => void;
}) {
  const [draft, setDraft] = useState(keyValue);
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(getRemember);
  const [status, setStatus] = useState(keyValue ? 'Saved in browser' : 'Not connected');

  const save = () => {
    saveKey(draft, remember);
    setKeyValue(draft);
    setStatus('Saved in ' + (remember ? 'local browser storage' : 'this browser session'));
  };
  const test = async () => {
    if (!draft) return;
    setStatus('Checking a direct connection…');
    try {
      await new GeminiProvider(draft, model).testConnection();
      setStatus('Connected directly to Gemini');
    } catch {
      setStatus('Connection failed — check key or quota');
    }
  };

  return (
    <main className="settings-page">
      <header className="settings-header">
        <button className="back" onClick={back}><ChevronLeft size={19} /> Back to Aplx</button>
        <div className="wordmark"><span>A</span> APLX</div>
        <div className="web-pill">WEB <i /></div>
      </header>
      <div className="settings-layout">
        <aside className="settings-nav">
          <p>SETTINGS</p>
          {[['general', 'General'], ['provider', 'AI Provider'], ['privacy', 'Privacy'], ['about', 'About']].map(([id, label]) => (
            <button className={tab === id ? 'selected' : ''} onClick={() => setTab(id as typeof tab)} key={id}>
              {id === 'provider' ? <Sparkles size={17} /> : id === 'privacy' ? <ShieldCheck size={17} /> : id === 'about' ? <Orbit size={17} /> : <Settings size={17} />}
              {label}
            </button>
          ))}
        </aside>
        <section className="settings-content">
          {tab === 'provider' && (
            <>
              <div className="section-kicker">AI PROVIDER</div>
              <h2>Connect your intelligence.</h2>
              <p className="lead">Bring your own Gemini API key. Aplx never receives it—your browser talks directly to Google.</p>
              <div className="provider-card">
                <div className="provider-logo">G</div>
                <div><b>Google Gemini</b><p>Direct browser connection</p></div>
                <span className="active-tag">ACTIVE</span>
              </div>
              <label className="field-label">GEMINI MODEL</label>
              <ModelSelect className="model-select" value={model} onChange={setModel} />
              <p className="model-note">Pick the model available to your Gemini API key. Aplx sends the selected model name directly to Google.</p>
              <label className="field-label">YOUR GEMINI API KEY</label>
              <div className="key-input">
                <KeyRound size={18} />
                <input type={show ? 'text' : 'password'} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Paste your API key" autoComplete="off" />
                <button onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              <label className="remember">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <span><b>Remember this key on this device</b><small>Off by default. Otherwise, the key stays only for this browser session.</small></span>
              </label>
              <div className="connection">
                <span className={status.includes('Connected') ? 'success' : ''} />
                <div><b>{status}</b><small>Request route: Browser → Google Gemini</small></div>
              </div>
              <div className="settings-actions">
                <button className="primary" onClick={test} disabled={!draft}>Test connection</button>
                <button className="secondary" onClick={save} disabled={!draft}>Save key</button>
                <button className="text-danger" onClick={() => { removeKey(); setDraft(''); setKeyValue(''); setStatus('Key removed from this browser'); }}>Remove key</button>
              </div>
              <ConnectionDetails />
            </>
          )}
          {tab === 'privacy' && (
            <PrivacyContent clear={() => { clearLocalData(); setDraft(''); setKeyValue(''); setStatus('Local Aplx data cleared'); }} />
          )}
          {tab === 'general' && (
            <>
              <div className="section-kicker">GENERAL</div>
              <h2>Shape your space.</h2>
              <p className="lead">Preferences apply immediately and are saved only on this browser.</p>
              <label className="field-label">APPEARANCE</label>
              <div className="theme-choice">
                <button className={preferences.theme === 'black' ? 'picked' : ''} onClick={() => setPreferences({ ...preferences, theme: 'black' })}><span />Pure black</button>
                <button className={preferences.theme === 'midnight' ? 'picked' : ''} onClick={() => setPreferences({ ...preferences, theme: 'midnight' })}><span />Midnight</button>
              </div>
              <Preference label="Ambient motion" description="Enable gentle background motion." enabled={preferences.motion} toggle={() => setPreferences({ ...preferences, motion: !preferences.motion })} />
              <Preference label="Compact conversations" description="Reduce vertical space between messages." enabled={preferences.compact} toggle={() => setPreferences({ ...preferences, compact: !preferences.compact })} />
              <Preference label="Press Enter to send" description="When off, Enter adds a new line and the arrow sends." enabled={preferences.sendOnEnter} toggle={() => setPreferences({ ...preferences, sendOnEnter: !preferences.sendOnEnter })} />
              <button className="reset-preferences" onClick={() => setPreferences(defaultPreferences)}>Restore default preferences</button>
            </>
          )}
          {tab === 'about' && (
            <>
              <div className="section-kicker">ABOUT</div>
              <h2>Aplx Web</h2>
              <p className="lead">The browser-based, online member of the Aplx ecosystem.</p>
              <div className="about-grid">
                <div><small>VERSION</small><b>0.1.0</b></div>
                <div><small>BUILT BY</small><b>Korentic</b></div>
                <div><small>MODE</small><b>Online · your provider</b></div>
              </div>
              <button className="about-story-link" onClick={onAbout}>Read the full story <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} /></button>
              <div className="credits">
                <div className="section-kicker">CREDITS</div>
                <h3>Built with the help of</h3>
                <p>CodeX (GPT 5.6 Terra), Minimax-m3, Korentic (R3nz), Claude Opus and Sonnet 4.6, GitHub Copilot, and many more.</p>
                <a href="https://github.com/Korentic/Aplx" target="_blank" rel="noreferrer">Explore & install Aplx on GitHub ↗</a>
              </div>
              <p className="fine">Aplx Desktop supports offline + online workflows. Aplx Web runs online and connects only to the provider you configure.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ConnectionDetails() {
  return (
    <div className="details">
      <h3>Connection details</h3>
      <dl>
        <dt>Provider</dt><dd>Google Gemini</dd>
        <dt>Credential</dt><dd>User-provided API key</dd>
        <dt>Request route</dt><dd>Browser → Google Gemini</dd>
        <dt>Aplx server access</dt><dd>None</dd>
        <dt>API key stored by Aplx server</dt><dd>No</dd>
      </dl>
    </div>
  );
}

function PrivacyContent({ clear }: { clear: () => void }) {
  return (
    <>
      <div className="section-kicker">PRIVACY & SECURITY</div>
      <h2>Private by design.</h2>
      <p className="lead">Aplx Web has no server-side AI proxy and no Aplx-owned API key.</p>
      <div className="privacy-steps">
        <h3>How your Gemini API key works</h3>
        {[
          'You enter your own Gemini API key.',
          'The key stays in your browser session by default.',
          'Aplx does not receive the key.',
          'Gemini requests go directly from your browser to Google.',
          'Aplx does not store the key on its servers.',
          'Removing the key removes it from browser application data.',
        ].map((x, i) => <div key={x}><span>0{i + 1}</span>{x}</div>)}
      </div>
      <ConnectionDetails />
      <div className="clear-data">
        <div><b>Clear local Aplx data</b><p>Remove the stored key and privacy preferences from this browser.</p></div>
        <button className="text-danger" onClick={clear}>Clear local data</button>
      </div>
      <p className="fine">Your conversations and requests are handled by the provider you configure. Your usage, billing, and quota are your responsibility.</p>
    </>
  );
}

function Privacy({ back, settings, about }: { back: () => void; settings: () => void; about: () => void }) {
  return (
    <main className="privacy-page">
      <nav>
        <div className="wordmark"><span>A</span> APLX</div>
        <div className="about-nav-actions">
          <button onClick={about}>About</button>
          <button className="nav-launch" onClick={back}>Home</button>
        </div>
      </nav>
      <div className="privacy-hero">
        <div className="eyebrow"><ShieldCheck size={14} /> PRIVACY & SECURITY</div>
        <h1>Your key is <i>yours.</i></h1>
        <p>Aplx is deliberately built so your Gemini credential does not pass through an Aplx server.</p>
        <ConnectionDetails />
        <button className="primary" onClick={settings}>Configure Gemini <ArrowUp size={16} /></button>
      </div>
    </main>
  );
}
