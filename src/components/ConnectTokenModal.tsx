import React, { useState } from 'react';
import { KeyRound, ShieldCheck, ExternalLink, X, CheckCircle, AlertCircle, Github } from 'lucide-react';

interface ConnectTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (token: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const ConnectTokenModal: React.FC<ConnectTokenModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isLoading,
  error,
}) => {
  const [tokenInput, setTokenInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    onConnect(tokenInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Direct GitHub Authorization</h3>
            <p className="text-xs text-slate-500 font-medium">Authenticate via Personal Access Token / API Key</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs mb-6 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sky-950">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>5,000 API Requests/Hr + Private Repo Analytics</span>
          </div>
          <p className="text-sky-800 leading-relaxed font-medium">
            Your token is stored <strong>exclusively in your local browser storage</strong> and sent directly to GitHub's official REST API. No intermediate backend server or database is used.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              GitHub Personal Access Token (classic or fine-grained)
            </label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono text-slate-900 transition-all placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=DevRep%20Analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 hover:underline"
            >
              <span>Generate token on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-slate-400 text-[11px]">Recommended scope: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">repo, read:user</code></span>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !tokenInput.trim()}
              className="w-2/3 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validating with GitHub...</span>
                </>
              ) : (
                <>
                  <Github className="w-4 h-4" />
                  <span>Authorize & Calculate Score</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
