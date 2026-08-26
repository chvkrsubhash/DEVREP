import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { SubScores } from '../types/shared';

interface ScoreRadarChartProps {
  subScores: SubScores;
  dataMode?: 'public' | 'private-inclusive';
}

export const ScoreRadarChart: React.FC<ScoreRadarChartProps> = ({ subScores, dataMode = 'public' }) => {
  const chartData = [
    { subject: 'Impact', score: subScores.impact, fullMark: 100, description: 'Stars, forks, organic reach' },
    { subject: 'Collaboration', score: subScores.collaboration, fullMark: 100, description: 'PR acceptance & code reviews' },
    { subject: 'Consistency', score: subScores.consistency, fullMark: 100, description: 'Weekly cadence & active streaks' },
    { subject: 'Breadth', score: subScores.breadth, fullMark: 100, description: 'Languages & external contributions' },
    { subject: 'Quality', score: subScores.quality, fullMark: 100, description: 'PR sizing & low revert rate' },
  ];

  const strokeColor = dataMode === 'private-inclusive' ? '#0284c7' : '#4f46e5';
  const fillColor = dataMode === 'private-inclusive' ? '#0ea5e9' : '#6366f1';

  return (
    <div className="w-full h-72 sm:h-80 flex flex-col items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            stroke="#cbd5e1"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs">
                    <p className="font-bold text-slate-900 mb-1 flex items-center justify-between gap-4">
                      <span>{data.subject}</span>
                      <span className="text-indigo-600 font-mono text-sm font-extrabold">{data.score}/100</span>
                    </p>
                    <p className="text-slate-500">{data.description}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={strokeColor}
            strokeWidth={2.5}
            fill={fillColor}
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
