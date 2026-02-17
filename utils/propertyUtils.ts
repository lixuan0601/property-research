
import { GroundingChunk } from '../types';

export const STATUS_KEYWORDS = ['SOLD', 'FOR SALE', 'FOR RENT', 'LEASED', 'RECENTLY SOLD', 'CONTINGENT', 'ACTIVE', 'PENDING'];

export const getStatusColor = (status: string) => {
  const s = status?.toUpperCase() || '';
  if (s.includes('SOLD')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500', highlight: 'bg-red-50/50 text-red-700 border-red-100' };
  if (s.includes('SALE') || s.includes('ACTIVE')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500', highlight: 'bg-blue-50/50 text-blue-700 border-blue-100' };
  if (s.includes('RENT') || s.includes('LEASED')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500', highlight: 'bg-emerald-50/50 text-emerald-700 border-emerald-100' };
  if (s.includes('CONTINGENT') || s.includes('PENDING')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500', highlight: 'bg-amber-50/50 text-amber-700 border-amber-100' };
  return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', dot: 'bg-slate-500', highlight: 'bg-slate-50/50 text-slate-700 border-slate-100' };
};

export const getStatusFromTitle = (title: string) => {
  const statusMatch = title.match(/\[(.*?)\]/);
  if (statusMatch) return statusMatch[1].toUpperCase();
  const foundKeyword = STATUS_KEYWORDS.find(k => title.toUpperCase().includes(k));
  return foundKeyword || 'OTHER';
};

export const findUrlInGrounding = (address: string, chunks: GroundingChunk[], domain: 'domain' | 'realestate') => {
  const targetHost = domain === 'domain' ? 'domain.com.au' : 'realestate.com.au';
  const addressParts = address.toLowerCase().split(/[ ,]+/).filter(p => p.length > 2);
  let bestMatch: GroundingChunk | null = null;
  let highestScore = 0;
  chunks.forEach(c => {
    if (!c.web?.uri) return;
    const uri = c.web.uri.toLowerCase();
    if (!uri.includes(targetHost)) return;
    const matches = addressParts.filter(part => uri.includes(part)).length;
    let patternScore = 0;
    if (domain === 'domain' && uri.includes('property-profile')) patternScore = 2;
    if (domain === 'realestate' && uri.includes('/property/')) patternScore = 2;
    const totalScore = matches + patternScore;
    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestMatch = c;
    }
  });
  return highestScore >= 3 ? bestMatch?.web?.uri : null;
};
