
import React from 'react';
import { 
  Users, Sun, Car, TrendingUp, Map as MapIcon, 
  Battery, Waves, Zap, TreeDeciduous, CheckCircle2 
} from 'lucide-react';

export const formatContent = (text: string) => {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} className="content-spacer" />;

    // Remove any extraneous bolding asterisks from the model's output.
    // This assumes that the formatContent function itself does not interpret markdown bolding
    // and that any `**` are artifacts from prompt instructions.
    const cleanedLine = trimmed.replace(/\*\*/g, '');

    if (cleanedLine.startsWith('### ')) {
      return (
        <h4 key={i} className="text-lg font-semibold text-slate-800 mt-6 mb-3 flex items-center gap-2">
          {cleanedLine.substring(4)}
        </h4>
      );
    }
    if (cleanedLine.startsWith('- ') || cleanedLine.startsWith('• ')) {
      return (
        <li key={i} className="ml-4 pl-2 text-slate-600 mb-2 list-disc marker:text-blue-500">
          {cleanedLine.substring(2)}
        </li>
      );
    }
    return <p key={i} className="mb-3 text-slate-700 leading-relaxed">{cleanedLine}</p>;
  });
};

export const getFeatureIcon = (feature: string) => {
  const lower = feature.toLowerCase();
  if (lower.includes('solar') && lower.includes('battery')) return Battery;
  if (lower.includes('solar')) return Sun;
  if (lower.includes('pool') || lower.includes('spa')) return Waves;
  if (lower.includes('tennis') || lower.includes('court')) return Zap;
  if (lower.includes('garden') || lower.includes('yard')) return TreeDeciduous;
  if (lower.includes('garage') || lower.includes('parking')) return Car;
  return CheckCircle2;
};

export const getSuburbIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('demo') || t.includes('community') || t.includes('people')) return Users;
  if (t.includes('life') || t.includes('vibe') || t.includes('atmosphere')) return Sun;
  if (t.includes('connect') || t.includes('transport') || t.includes('convenience')) return Car;
  if (t.includes('market') || t.includes('drivers')) return TrendingUp;
  return MapIcon;
};
