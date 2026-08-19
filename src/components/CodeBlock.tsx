import { useState } from 'react';
import { Check, Copy, Download, Code, WrapText } from 'lucide-react';

type CodeBlockProps = {
  language: string;
  code: string;
};

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);

  const cleanLang = (language || 'text').replace(/^language-/, '');
  const lineCount = code.trim().split('\n').length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md',
      rust: 'rs',
      go: 'go',
      cpp: 'cpp',
      c: 'c',
      bash: 'sh',
      shell: 'sh',
    };
    const ext = extMap[cleanLang.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aplx-snippet-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-block-container my-3 rounded-xl overflow-hidden border border-[#2b354f] bg-[#0a0d16] shadow-lg">
      <div className="code-block-header flex items-center justify-between px-3 py-1.5 bg-[#101524] border-b border-[#1f283d] text-xs font-mono text-[#8ea8ff]">
        <div className="flex items-center gap-2">
          <Code size={13} className="text-[#8ea8ff]" />
          <span className="uppercase font-semibold tracking-wider text-[11px]">{cleanLang}</span>
          <span className="text-[#596b8e] text-[10px]">({lineCount} {lineCount === 1 ? 'line' : 'lines'})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWrap(!wrap)}
            title="Toggle word wrap"
            className={`p-1 rounded hover:bg-[#1a233a] transition-colors ${wrap ? 'text-[#8ea8ff]' : 'text-[#6f82a6]'}`}
          >
            <WrapText size={13} />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="Download snippet"
            className="p-1 rounded text-[#6f82a6] hover:text-[#dce5fb] hover:bg-[#1a233a] transition-colors"
          >
            <Download size={13} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#161e33] text-[#dce6ff] hover:bg-[#202b48] border border-[#283552] transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <pre
        className={`p-3.5 m-0 font-mono text-xs leading-relaxed text-[#dbe6ff] overflow-x-auto selection:bg-[#8ea8ff33] ${
          wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
