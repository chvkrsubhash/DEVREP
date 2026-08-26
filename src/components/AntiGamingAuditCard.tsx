import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AntiGamingAudit } from '../types/shared';

interface AntiGamingAuditCardProps {
  audit: AntiGamingAudit;
}

export const AntiGamingAuditCard: React.FC<AntiGamingAuditCardProps> = ({ audit }) => {
  const hasPenalty = audit.scoreDampeningApplied > 0;

  return (
    <div className={`bg-white rounded-2xl p-6 border shadow-sm transition-all ${
      hasPenalty ? 'border-amber-300 bg-amber-50/20' : 'border-emerald-200 bg-emerald-50/20'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm ${
            hasPenalty
              ? 'bg-amber-100 text-amber-700 border-amber-300'
              : 'bg-emerald-100 text-emerald-700 border-emerald-300'
          }`}>
            {hasPenalty ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-bold text-sm text-slate-900">Anti-Gaming Verification Engine</h4>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                hasPenalty ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {hasPenalty ? 'Anomaly Detected' : 'Verified Organic'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Guards against automated commit bursts, fork bombing, and artificial activity scripts.
            </p>
          </div>
        </div>

        {hasPenalty ? (
          <div className="text-right">
            <span className="text-xs text-amber-700 block font-semibold">Dampening Penalty</span>
            <span className="text-base font-bold font-mono text-amber-800">-{audit.scoreDampeningApplied}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>100% Score Integrity</span>
          </div>
        )}
      </div>

      {/* Heuristic Checks List */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-600 font-medium">Commit Spike Check</span>
          <span className={`font-mono font-bold ${audit.commitSpamDetected ? 'text-rose-600' : 'text-emerald-700'}`}>
            {audit.commitSpamDetected ? 'Flagged' : 'Passed ✓'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-600 font-medium">Fork Farming Check</span>
          <span className={`font-mono font-bold ${audit.forkSpamDetected ? 'text-rose-600' : 'text-emerald-700'}`}>
            {audit.forkSpamDetected ? 'Flagged' : 'Passed ✓'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-600 font-medium">PR Dump Check</span>
          <span className={`font-mono font-bold ${audit.prDumpDetected ? 'text-rose-600' : 'text-emerald-700'}`}>
            {audit.prDumpDetected ? 'Flagged' : 'Passed ✓'}
          </span>
        </div>
      </div>

      {/* Audit Notes */}
      {audit.auditNotes && audit.auditNotes.length > 0 && (
        <div className="mt-3.5 text-xs text-slate-600 space-y-1 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
          {audit.auditNotes.map((note, i) => (
            <p key={i} className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{note}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
