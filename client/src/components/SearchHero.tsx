import React, { useState } from 'react';
import { Sparkles, ArrowRight, Github } from 'lucide-react';

interface SearchHeroProps {
  onSearch: (username: string) => void;
  isLoading: boolean;
}

const POPULAR_DEVS = [
  { username: 'torvalds', label: 'Linus Torvalds' },
  { username: 'gaearon', label: 'Dan Abramov' },
  { username: 'yyx990803', label: 'Evan You' },
  { username: 'antfu', label: 'Anthony Fu' },
  { username: 'sindresorhus', label: 'Sindre Sorhus' },
];

export const SearchHero: React.FC<SearchHeroProps> = ({ onSearch, isLoading }) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  return (
    <div className="relative pt-10 pb-12 sm:pt-16 sm:pb-16 text-center max-w-4xl mx-auto px-4">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/70 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm text-xs font-semibold text-indigo-700 mb-6">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
        <span>Authentic GitHub Developer Reputation Engine</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
        Discover Real Developer <br className="hidden sm:block" />
        <span className="gradient-text-indigo">Impact & Craftsmanship</span>
      </h1>

      <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
        Analyze real GitHub code reach, pull request hygiene, commit cadence, and multi-ecosystem breadth with
        pure mathematical anti-gaming protection.
      </p>

      {/* Search Bar Input */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-6">
        <div className="relative flex items-center bg-white rounded-2xl p-1.5 border border-slate-300 shadow-md focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <div className="pl-4 text-slate-400">
            <Github className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Enter GitHub username (e.g. torvalds, gaearon)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Picks */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
        <span className="text-slate-500 font-medium">Try analyzing:</span>
        {POPULAR_DEVS.map((dev) => (
          <button
            key={dev.username}
            onClick={() => {
              setInputVal(dev.username);
              onSearch(dev.username);
            }}
            className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-mono shadow-sm transition-all"
          >
            @{dev.username}
          </button>
        ))}
      </div>
    </div>
  );
};
