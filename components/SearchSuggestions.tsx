
import React from 'react';
import { DollarSign, Activity, Battery, Clock, Waves, Users, GraduationCap } from 'lucide-react';

interface Suggestion {
  label: string;
  icon: any;
  color: string;
  query: string;
}

const SUGGESTIONS: Suggestion[] = [
  { label: 'Under $1.5M in Kenmore QLD', icon: DollarSign, color: 'text-emerald-500', query: 'Find 3+ bed houses under $1.5M in Kenmore, QLD' },
  { label: 'High Yield > 5% Investment', icon: Activity, color: 'text-blue-500', query: 'Search for properties with high rental yield > 5% in Brisbane suburbs' },
  { label: 'Solar Battery & Green Tech', icon: Battery, color: 'text-amber-500', query: 'Houses with solar panels and battery storage in Brisbane' },
  { label: 'Sold in last 30 Days', icon: Clock, color: 'text-rose-500', query: 'Show me properties sold in the last 30 days in Indooroopilly' },
  { label: 'Waterfront Subdivisions', icon: Waves, color: 'text-cyan-500', query: 'Waterfront properties in new subdivisions on the Gold Coast' },
  { label: '4+ Bed with Granny Flat', icon: Users, color: 'text-purple-500', query: '4+ bedroom houses with a granny flat or dual living in QLD' },
  { label: 'Luxury Townhouse Catchments', icon: GraduationCap, color: 'text-indigo-500', query: 'Luxury townhouses in elite school catchment zones' },
];

interface SearchSuggestionsProps {
  onSelect: (query: string) => void;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ onSelect }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {SUGGESTIONS.map((s, i) => (
      <button 
        key={i} 
        onClick={() => onSelect(s.query)} 
        className="flex items-center gap-3 p-4 bg-white/40 border border-slate-200 rounded-2xl text-left hover:bg-white hover:border-blue-300 transition-all shadow-sm"
      >
        <div className={`p-2 rounded-xl bg-white border border-slate-100 shadow-sm ${s.color}`}>
          <s.icon size={16} />
        </div>
        <span className="text-xs font-black text-slate-800 leading-tight">
          {s.label}
        </span>
      </button>
    ))}
  </div>
);
