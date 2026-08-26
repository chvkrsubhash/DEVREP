import React from 'react';
import { X, ShieldCheck, Lock, Database, KeyRound, CheckCircle2 } from 'lucide-react';

interface TrustGuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrustGuaranteeModal: React.FC<TrustGuaranteeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 text-slate-900 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">DevRep Trust & Privacy Guarantee</h3>
            <p className="text-xs text-slate-500 font-medium">
              Architectural & cryptographic boundary documentation
            </p>
          </div>
        </div>

        {/* Core Guarantees */}
        <div className="space-y-4 text-xs">
          {/* 1. Public Mode */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 mb-1.5 text-indigo-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Public Mode Boundary (/api/public/:username)</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-6 font-medium">
              Anyone can look up any GitHub username without creating an account. The GitHub data fetcher is
              hardcoded to strictly request <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-700 font-mono">[PUBLIC]</code> privacy scope.
              Private repos are never queried, never analyzed, and never exposed.
            </p>
          </div>

          {/* 2. Private Mode */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 mb-1.5 text-sky-700 font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span>2. Authenticated Self-Only Private Mode (/api/me/score)</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-6 font-medium">
              When a user logs in with GitHub and opts into private repo analytics, private-inclusive scores are
              stored exclusively in the separate <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-sky-700 font-mono">private_scores</code> table.
              This endpoint is gated behind strict session authentication and foreign-keyed to the owner ID.
              It is mathematically impossible for another user to view your private metrics.
            </p>
          </div>

          {/* 3. Zero Raw Code Storage */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 mb-1.5 text-emerald-700 font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>3. Zero Raw Code or Proprietary IP Storage</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-6 font-medium">
              DevRep only derives aggregate numeric vectors (e.g. commit counts, review counts, merged PR ratios,
              and language byte percentages). No raw source code, repository files, commit messages, or secrets are
              ever persisted in our database or logged.
            </p>
          </div>

          {/* 4. Token Encryption */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 mb-1.5 text-purple-700 font-bold text-sm">
              <KeyRound className="w-4 h-4" />
              <span>4. Military-Grade AES-256-GCM Token Encryption</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-6 font-medium">
              OAuth access tokens are encrypted in transit and at rest using authenticated AES-256-GCM cipher with
              96-bit initialization vectors and authentication tags before any storage in PostgreSQL.
            </p>
          </div>
        </div>

        {/* Close action */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm"
          >
            I Understand the Privacy Architecture
          </button>
        </div>
      </div>
    </div>
  );
};
