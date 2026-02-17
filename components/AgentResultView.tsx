
import React, { useState, useMemo } from 'react';
import { List, Map as MapIcon, Sparkles } from 'lucide-react';
import { AgentSearchResult, PropertyData } from '../types';
import { PropertyCard } from './PropertyCard';
import { MultiMarkerMap } from './MultiMarkerMap';
import { getStatusColor, getStatusFromTitle, findUrlInGrounding, STATUS_KEYWORDS } from '../utils/propertyUtils';

interface AgentResultViewProps {
  result: AgentSearchResult;
  onAddToCompare: (prop: PropertyData) => void;
  compareList: PropertyData[];
}

export const AgentResultView: React.FC<AgentResultViewProps> = ({ 
  result, 
  onAddToCompare, 
  compareList 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapHighlight, setMapHighlight] = useState<string | undefined>(undefined);

  const { introText, categorizedCards, allProperties } = useMemo(() => {
    const cleanText = result.answer.replace(/\*\*/g, '');
    const lines = cleanText.split('\n');
    const intro: string[] = [];
    const categories: Record<string, PropertyData[]> = {};
    const all: PropertyData[] = [];
    let current: PropertyData | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('### ')) {
        if (current) {
          if (!categories[current.status]) categories[current.status] = [];
          categories[current.status].push(current);
          all.push(current);
        }
        const title = trimmed.substring(4);
        const status = getStatusFromTitle(title);
        const address = title.replace(/\[.*?\]/, '').trim();
        current = { id: btoa(address).substring(0, 16), address, status, rawItems: [], type: 'House' };
      } else if (trimmed.startsWith('- ') && current) {
        current.rawItems.push(trimmed.substring(2));
        const content = trimmed.substring(2).trim();
        const lower = content.toLowerCase();
        if (lower.startsWith('price:')) current.price = content.split(':')[1]?.trim();
        else if (lower.startsWith('type:')) current.type = content.split(':')[1]?.trim();
        else if (lower.startsWith('beds:')) current.beds = content.split(':')[1]?.trim();
        else if (lower.startsWith('baths:')) current.baths = content.split(':')[1]?.trim();
        else if (lower.startsWith('cars:')) current.cars = content.split(':')[1]?.trim();
        else if (lower.startsWith('land:')) current.landSize = content.split(':')[1]?.trim();
        else if (lower.startsWith('lat:')) current.lat = parseFloat(content.split(':')[1]?.trim());
        else if (lower.startsWith('lng:')) current.lng = parseFloat(content.split(':')[1]?.trim());
        else if (lower.startsWith('listed:') || lower.startsWith('sold:')) current.date = content.split(':')[1]?.trim();
        else if (lower.startsWith('summary:')) current.description = content.split(':')[1]?.trim();
        else if (lower.startsWith('domain:')) current.domainUrl = content.split(':')[1]?.trim();
        else if (lower.startsWith('rea:')) current.realestateUrl = content.split(':')[1]?.trim();
        else if (lower.startsWith('features:')) {
           const f = lower.split(':')[1];
           if (f.includes('pool')) current.pool = true;
           if (f.includes('solar')) current.solar = true;
           if (f.includes('battery')) current.battery = true;
           if (f.includes('tennis')) current.tennis = true;
           if (f.includes('deck')) current.deck = true;
           if (f.includes('balcony')) current.balcony = true;
           if (f.includes('shed')) current.shed = true;
           if (f.includes('granny')) current.grannyFlat = true;
        }
      } else if (!current) {
        intro.push(trimmed);
      }
    });
    if (current) {
      if (!categories[current.status]) categories[current.status] = [];
      categories[current.status].push(current);
      all.push(current);
    }
    return { introText: intro, categorizedCards: categories, allProperties: all };
  }, [result]);

  const highlightKeywords = (str: string) => {
    let parts: React.ReactNode[] = [str];
    STATUS_KEYWORDS.forEach(word => {
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') { newParts.push(part); return; }
        const regex = new RegExp(`(${word})`, 'gi');
        part.split(regex).forEach((seg, i) => {
          if (seg.toUpperCase() === word) {
            const colors = getStatusColor(seg);
            newParts.push(<span key={i} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mx-1 border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}><span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></span>{seg.toUpperCase()}</span>);
          } else if (seg) newParts.push(seg);
        });
      });
      parts = newParts;
    });
    return parts;
  };

  const handleShowOnMap = (address: string) => { setMapHighlight(address); setViewMode('map'); };

  const statusDisplayOrder = ['SOLD', 'RECENTLY SOLD', 'FOR SALE', 'ACTIVE', 'FOR RENT', 'LEASED', 'PENDING', 'CONTINGENT', 'OTHER'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
          <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600 shadow-sm"><Sparkles size={28} /></div> Market Search Intelligence
        </h2>
        {allProperties.length > 0 && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-fit">
            <button onClick={() => { setViewMode('list'); setMapHighlight(undefined); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <List size={16} /> List View
            </button>
            <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <MapIcon size={16} /> Map View
            </button>
          </div>
        )}
      </div>
      <div className="intro-section">
        {introText.map((p, i) => <p key={i} className="mb-4 text-slate-600 leading-relaxed text-sm last:mb-0">{highlightKeywords(p)}</p>)}
      </div>
      {viewMode === 'list' ? (
        <div className="space-y-12">
          {statusDisplayOrder.map(status => {
            const cards = categorizedCards[status];
            if (!cards || cards.length === 0) return null;
            return (
              <div key={status} className="category-group animate-fade-in">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border bg-white text-slate-400 border-slate-100">{status}</h3>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {cards.map((card, idx) => (
                    <PropertyCard 
                      key={`${status}-${idx}`} 
                      prop={card} 
                      onShowOnMap={handleShowOnMap}
                      onAddToCompare={onAddToCompare}
                      isAlreadySelected={compareList.some(item => item.id === card.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full h-[700px] bg-slate-100 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative">
          <MultiMarkerMap 
            comparables={allProperties.map(p => ({ address: p.address, status: p.status, label: p.price, lat: p.lat, lng: p.lng }))} 
            highlightAddress={mapHighlight} 
          />
        </div>
      )}
    </div>
  );
};
