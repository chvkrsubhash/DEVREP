import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { ReputationScoreResult } from '../types/shared';

interface CompareRadarChartProps {
  userA: ReputationScoreResult;
  userB: ReputationScoreResult;
}

export const CompareRadarChart: React.FC<CompareRadarChartProps> = ({ userA, userB }) => {
  const chartData = [
    {
      subject: 'Impact',
      [userA.username]: userA.subScores.impact,
      [userB.username]: userB.subScores.impact,
      fullMark: 100,
    },
    {
      subject: 'Collaboration',
      [userA.username]: userA.subScores.collaboration,
      [userB.username]: userB.subScores.collaboration,
      fullMark: 100,
    },
    {
      subject: 'Consistency',
      [userA.username]: userA.subScores.consistency,
      [userB.username]: userB.subScores.consistency,
      fullMark: 100,
    },
    {
      subject: 'Breadth',
      [userA.username]: userA.subScores.breadth,
      [userB.username]: userB.subScores.breadth,
      fullMark: 100,
    },
    {
      subject: 'Quality',
      [userA.username]: userA.subScores.quality,
      [userB.username]: userB.subScores.quality,
      fullMark: 100,
    },
  ];

  return (
    <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center relative">
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
                return (
                  <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 text-xs">
                    <p className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">
                      {payload[0]?.payload?.subject}
                    </p>
                    <div className="space-y-1">
                      <p className="flex items-center justify-between gap-4 font-semibold text-indigo-600">
                        <span>@{userA.username}:</span>
                        <span className="font-mono">{payload[0]?.value}/100</span>
                      </p>
                      <p className="flex items-center justify-between gap-4 font-semibold text-emerald-600">
                        <span>@{userB.username}:</span>
                        <span className="font-mono">{payload[1]?.value}/100</span>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-xs font-bold text-slate-700">@{value}</span>}
          />
          <Radar
            name={userA.username}
            dataKey={userA.username}
            stroke="#4f46e5"
            strokeWidth={2.5}
            fill="#6366f1"
            fillOpacity={0.25}
          />
          <Radar
            name={userB.username}
            dataKey={userB.username}
            stroke="#059669"
            strokeWidth={2.5}
            fill="#10b981"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
