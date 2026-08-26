import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HistoricalSnapshot } from '../types/shared';

interface ScoreTrajectoryChartProps {
  snapshots: HistoricalSnapshot[];
}

export const ScoreTrajectoryChart: React.FC<ScoreTrajectoryChartProps> = ({ snapshots }) => {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        No previous historical snapshots recorded yet. Scores are saved on each evaluation.
      </div>
    );
  }

  const chartData = snapshots.map((s) => ({
    date: new Date(s.computedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: s.overallScore,
    impact: s.subScores?.impact || 0,
    collaboration: s.subScores?.collaboration || 0,
  }));

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGlowLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-md">
                    <p className="text-slate-500 font-medium">{d.date}</p>
                    <p className="text-slate-900 font-bold text-sm">Overall Score: {d.score}/100</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#4f46e5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#scoreGlowLight)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
