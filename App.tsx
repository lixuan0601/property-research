
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Loader2, Building2, Download, MessageSquare, 
  Info, LayoutDashboard, TrendingUp, GraduationCap, Map as MapIcon, 
  Lightbulb, ExternalLink, Home, Tag, Sparkles, DollarSign, 
  BedDouble, Calendar, CheckCircle2, ChevronRight, List
} from 'lucide-react';
import { analyzeProperty } from './services/analyzePropertyService';
import { searchPropertiesAgent } from './services/searchPropertiesService';
import { parseAnalysisSections } from './services/dataParser';
import { AnalysisState, SectionData, SectionProgress, ViewMode, AgentSearchResult, PropertyData } from './types';
import { IntelligenceCard } from './components/IntelligenceCard';
import { AnalysisProgress } from './components/AnalysisProgress';
import { MultiMarkerMap } from './components/MultiMarkerMap';

const STATUS_KEYWORDS = ['SOLD', 'FOR SALE', 'FOR RENT', 'LEASED', 'RECENTLY SOLD', 'CONTINGENT', 'ACTIVE', 'PENDING'];

const getStatusColor = (status: string) => {
  const s = status.toUpperCase();
  if (s.includes('SOLD')) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500' };
  if (s.includes('SALE') || s.includes('ACTIVE')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' };
  if (s.includes('RENT') || s.includes('LEASED')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' };
  if (s.includes('CONTINGENT') || s.includes('PENDING')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' };
  return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', dot: 'bg-slate-500' };
};

const getStatusFromTitle = (title: string) => {
  const statusMatch = title.match(/\[(.*?)\]/);
  if (statusMatch) return statusMatch[1].toUpperCase();
  const foundKeyword = STATUS_KEYWORDS.find(k => title.toUpperCase().includes(k));
  return foundKeyword || 'OTHER';
};

// Main Agent Result Component
const AgentResultView = ({ result }: { result: AgentSearchResult }) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapHighlight, setMapHighlight] = useState<string | undefined>(undefined);

  // Parse logic to extract properties and intro text
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
          const status = current.status;
          if (!categories[status]) categories[status] = [];
          categories[status].push(current);
          all.push(current);
        }
        const title = trimmed.substring(4);
        const status = getStatusFromTitle(title);
        current = { 
          address: title.replace(/\[.*?\]/, '').trim(), 
          status, 
          rawItems: [] 
        };
      } else if (trimmed.startsWith('- ') && current) {
        current.rawItems.push(trimmed.substring(2));
        const lower = trimmed.toLowerCase();
        if (lower.includes('price:')) current.price = trimmed.split(':')[1]?.trim();
        if (lower.includes('listed:')) current.date = trimmed.split(':')[1]?.trim();
        if (lower.includes('feat:') || lower.includes('attr:')) {
          const val = trimmed.split(':')[1]?.trim();
          current.features = current.features ? `${current.features} • ${val}` : val;
        }
      } else {
        if (!current) {
          intro.push(trimmed);
        } else {
          const status = current.status;
          if (!categories[status]) categories[status] = [];
          categories[status].push(current);
          all.push(current);
          current = null;
          intro.push(trimmed);
        }
      }
    });

    if (current) {
      const status = (current as PropertyData).status;
      if (!categories[status]) categories[status] = [];
      categories[status].push(current);
      all.push(current);
    }

    return { introText: intro, categorizedCards: categories, allProperties: all };
  }, [result]);

  const highlightKeywords = (str: string) => {
    let parts: React.ReactNode[] = [str];
    STATUS_KEYWORDS.forEach(word => {
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        const regex = new RegExp(`(${word})`, 'gi');
        const segments = part.split(regex);
        segments.forEach((seg, i) => {
          if (seg.toUpperCase() === word) {
            const colors = getStatusColor(seg);
            newParts.push(
              <span key={`${word}-${i}`} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mx-1 border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></span>
                {seg.toUpperCase()}
              </span>
            );
          } else if (seg) {
            newParts.push(seg);
          }
        });
      });
      parts = newParts;
    });
    return parts;
  };

  const handleShowOnMap = (address: string) => {
    setMapHighlight(address);
    setViewMode('map');
  };

  const renderPropertyCard = (prop: PropertyData, key: string) => {
    const colors = getStatusColor(prop.status);
    return (
      <div key={key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-default">
        <div className="p-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-blue-50 rounded-full text-blue-500 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Home size={16} />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-blue-700 transition-colors">
                  {prop.address.replace(new RegExp(prop.status, 'gi'), '').trim() || prop.address}
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-3 items-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`}></span>
                    {prop.status}
                  </span>
                  {prop.date && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Calendar size={11} className="text-slate-300" />
                      <span>{prop.date}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => handleShowOnMap(prop.address)}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider ml-2 group/btn"
                  >
                    <MapIcon size={12} className="group-hover/btn:scale-110 transition-transform" />
                    <span>View on Map</span>
                  </button>
                </div>
              </div>
            </div>
            {prop.price && (
              <div className="flex flex-col items-end flex-shrink-0 text-right">
                <span className="text-xl font-extrabold text-blue-600 tracking-tight">{prop.price}</span>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest mt-0.5">Estimated Price</span>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              <span className="font-extrabold text-slate-300 uppercase text-[9px] tracking-widest mr-2">Features</span>
              <span className="text-slate-600 group-hover:text-slate-800 transition-colors">{prop.features || 'Details available on request'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const statusDisplayOrder = ['SOLD', 'RECENTLY SOLD', 'FOR SALE', 'ACTIVE', 'FOR RENT', 'LEASED', 'PENDING', 'CONTINGENT', 'OTHER'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
          <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600 shadow-sm">
            <Sparkles size={28} />
          </div>
          Market Search Intelligence
        </h2>
        
        {allProperties.length > 0 && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-fit">
            <button 
              onClick={() => { setViewMode('list'); setMapHighlight(undefined); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={16} /> List View
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MapIcon size={16} /> Map View
            </button>
          </div>
        )}
      </div>

      <div className="intro-section">
        {introText.map((p, i) => (
          <p key={i} className="mb-4 text-slate-600 leading-relaxed text-sm last:mb-0">
            {highlightKeywords(p)}
          </p>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-10">
          {statusDisplayOrder.map(status => {
            const cards = categorizedCards[status];
            if (!cards || cards.length === 0) return null;
            const colors = getStatusColor(status);
            return (
              <div key={status} className="category-group animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-px flex-1 ${colors.border.replace('border', 'bg')}`}></div>
                  <h3 className={`text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                    {status} <span className="ml-1 opacity-50">({cards.length})</span>
                  </h3>
                  <div className={`h-px flex-1 ${colors.border.replace('border', 'bg')}`}></div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {cards.map((card, idx) => renderPropertyCard(card, `${status}-${idx}`))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="animate-fade-in space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span> 
                <span>Sold</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm"></span> 
                <span>For Sale</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></span> 
                <span>For Rent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-sm"></span> 
                <span>Pending</span>
              </div>
            </div>
            {mapHighlight && (
              <button 
                onClick={() => setMapHighlight(undefined)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 transition-all"
              >
                Clear Focus
              </button>
            )}
          </div>
          <div className="w-full h-[600px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-inner relative group/map">
            <MultiMarkerMap 
              comparables={allProperties.map(p => ({
                address: p.address,
                status: p.status,
                label: p.price
              }))}
              highlightAddress={mapHighlight}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode | null>(null);
  
  // Property Insight State
  const [address, setAddress] = useState('');
  const [insightState, setInsightState] = useState<AnalysisState>({
    status: 'idle',
    data: null
  });
  const [insightProgress, setInsightProgress] = useState<Record<string, SectionProgress>>({});
  
  // AI Agent State
  const [agentQuery, setAgentQuery] = useState('');
  const [agentStatus, setAgentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [agentResult, setAgentResult] = useState<AgentSearchResult | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCompleteRef = useRef<any>(null);

  const TABS = [
    'Property Overview',
    'Investment Insights',
    'Price History',
    'Suburb Profile',
    'School Catchment & Ratings'
  ];
  const [activeTab, setActiveTab] = useState(TABS[0]);

  useEffect(() => {
    if (activeView !== 'insight') return;

    const loadGoogleMapsScript = () => {
      if ((window as any).google?.maps?.places) {
        initAutocomplete();
        return;
      }
      if (document.getElementById('google-maps-script')) return;
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB0dDMOVbcQkBfYpFu5HJY6N0HdMUFBPsk&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initAutocomplete();
      document.body.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!inputRef.current || !(window as any).google) return;
      if (autoCompleteRef.current) return;
      try {
        autoCompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['formatted_address'],
          componentRestrictions: { country: 'au' },
        });
        autoCompleteRef.current.addListener('place_changed', () => {
          const place = autoCompleteRef.current.getPlace();
          if (place.formatted_address) setAddress(place.formatted_address);
        });
      } catch (error) {
        console.error("Autocomplete Error:", error);
      }
    };

    loadGoogleMapsScript();
  }, [activeView]);

  const handleAgentSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentQuery.trim()) return;
    setAgentStatus('loading');
    setAgentResult(null);
    try {
      const res = await searchPropertiesAgent(agentQuery);
      setAgentResult(res);
      setAgentStatus('success');
    } catch (err) {
      setAgentStatus('error');
    }
  };

  const handleInsightSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAddress = address.trim();
    if (!targetAddress) return;

    setInsightState({ status: 'loading', data: null, coordinates: undefined });
    setInsightProgress({});
    setActiveTab(TABS[0]);

    if ((window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: targetAddress }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {
          const coords = results[0].geometry.location.toJSON();
          setInsightState(prev => ({ ...prev, coordinates: coords }));
        }
      });
    }

    try {
      const result = await analyzeProperty(targetAddress, (update) => {
        setInsightProgress(prev => ({ ...prev, [update.key]: update }));
      });
      setInsightState(prev => ({ ...prev, status: 'success', data: result }));
    } catch (err: any) {
      setInsightState({ status: 'error', data: null, error: err.message || "Error" });
    }
  }, [address]);

  const handleDownloadReport = async () => {
    if (isGeneratingPdf || !(window as any).html2pdf) return;
    setIsGeneratingPdf(true);
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) { setIsGeneratingPdf(false); return; }
      const opt = {
        margin: 0, 
        filename: `PropSearch_Intel_${address.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      try { await (window as any).html2pdf().set(opt).from(element).save(); } 
      catch (error) { console.error("PDF generation failed:", error); } 
      finally { setIsGeneratingPdf(false); }
    }, 1500);
  };

  const sections = insightState.data ? parseAnalysisSections(insightState.data.text) : [];
  const activeSectionData = sections.find(s => s.title === activeTab);

  const getTabIcon = (tab: string) => {
    switch(tab) {
      case 'Property Overview': return LayoutDashboard;
      case 'Price History': return TrendingUp;
      case 'Suburb Profile': return MapIcon;
      case 'School Catchment & Ratings': return GraduationCap;
      case 'Investment Insights': return Lightbulb;
      default: return LayoutDashboard;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView(null)}>
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">PropSearch<span className="text-blue-600">Intel</span></span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 pb-12 pt-16 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Advanced Real Estate <span className="text-blue-600">Intelligence</span>
          </h1>
          
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <button 
              onClick={() => { setActiveView('talk'); setInsightState({status:'idle', data:null}); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${activeView === 'talk' ? 'bg-blue-600 text-white scale-105' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-md'}`}
            >
              <MessageSquare size={24} />
              Talk to AI Agent
            </button>
            <button 
              onClick={() => { setActiveView('insight'); setAgentStatus('idle'); setAgentResult(null); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${activeView === 'insight' ? 'bg-indigo-600 text-white scale-105' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-indigo-200 hover:shadow-md'}`}
            >
              <Info size={24} />
              Property Insight
            </button>
          </div>

          {activeView === 'talk' && (
            <div className="max-w-2xl mx-auto animate-fade-in">
              <p className="text-slate-500 mb-6 flex items-center justify-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                Ask the AI Agent to find properties, suburbs, or market trends for you.
              </p>
              <form onSubmit={handleAgentSearch} className="relative group">
                <input
                  type="text"
                  className="block w-full pl-6 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:shadow-md transition-all text-lg"
                  placeholder="e.g. Find me 3-bed houses in Paddington under $2M..."
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={agentStatus === 'loading' || !agentQuery.trim()}
                  className="absolute inset-y-2.5 right-2.5 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex items-center justify-center shadow-md"
                >
                  {agentStatus === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </button>
              </form>
            </div>
          )}

          {activeView === 'insight' && (
            <div className="max-w-2xl mx-auto animate-fade-in">
              <p className="text-slate-500 mb-6">Enter a specific address for a detailed intelligence report.</p>
              <form onSubmit={handleInsightSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all text-lg"
                  placeholder="Enter property address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={insightState.status === 'loading' || !address.trim()}
                  className="absolute inset-y-2.5 right-2.5 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center justify-center shadow-md"
                >
                  {insightState.status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </button>
              </form>
              {insightState.status === 'loading' && <AnalysisProgress progress={insightProgress} />}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeView === 'talk' && agentResult && (
          <div className="animate-fade-in space-y-12">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm leading-relaxed text-slate-800 max-w-none">
              <AgentResultView result={agentResult} />
            </div>
            {agentResult.sources.length > 0 && (
              <div className="animate-fade-in pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 ml-2 flex items-center gap-4">
                  <div className="w-12 h-0.5 bg-slate-200 rounded-full"></div>
                  Verification Sources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agentResult.sources.map((src, i) => src.web && (
                    <a key={i} href={src.web.uri} target="_blank" rel="noopener" className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all flex items-center justify-between group">
                      <div className="flex-1 truncate mr-4">
                        <p className="font-bold text-sm truncate text-slate-700 group-hover:text-blue-700 transition-colors">{src.web.title}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-1.5 font-mono font-medium">{src.web.uri}</p>
                      </div>
                      <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-600 flex-shrink-0 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'insight' && insightState.status === 'success' && insightState.data && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Intelligence Report</h2>
                <span className="text-xs text-slate-500 font-bold px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm mt-2 inline-block uppercase tracking-wider">For: {address}</span>
              </div>
              <button onClick={handleDownloadReport} disabled={isGeneratingPdf} className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg font-bold hover:shadow-indigo-200 active:scale-95">
                {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}
              </button>
            </div>

            <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar flex space-x-2 border-b border-slate-200 px-1">
              {TABS.map((tab) => {
                const Icon = getTabIcon(tab);
                const isActive = activeTab === tab;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold rounded-t-2xl transition-all relative whitespace-nowrap ${isActive ? 'text-indigo-600 bg-white border border-b-0 border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} /> {tab}
                    {isActive && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white z-10"></div>}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-b-3xl rounded-tr-3xl border border-t-0 border-slate-200 shadow-sm min-h-[400px]">
              {activeSectionData ? (
                <IntelligenceCard section={activeSectionData} searchAddress={address} allSections={sections} subjectCoords={insightState.coordinates} />
              ) : (
                <div className="flex items-center justify-center h-[400px] text-slate-400 font-medium italic">No data available for {activeTab}</div>
              )}
            </div>
          </div>
        )}

        {!activeView && (
          <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50 flex flex-col items-center">
            <div className="bg-white p-6 rounded-full shadow-lg border border-slate-100 mb-8">
              <Building2 className="text-blue-600" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Welcome to PropSearch Intel</h3>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">Select a tool above to start your real estate journey. Search for properties with the AI Agent or get deep insights for a specific address.</p>
          </div>
        )}
      </main>

      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[9999] bg-slate-100/90 backdrop-blur flex justify-center overflow-auto pt-8">
           <div ref={printRef} className="bg-white w-[210mm] min-h-screen p-[15mm] shadow-2xl mb-8 text-slate-900 mx-auto">
              <div className="text-center mb-12 border-b border-slate-300 pb-8">
                <Building2 className="text-indigo-600 h-12 w-12 mx-auto mb-4" />
                <h1 className="text-3xl font-extrabold tracking-tight">Market Intelligence Report</h1>
                <h2 className="text-xl text-slate-500 font-medium mt-2">{address}</h2>
              </div>
              <div className="space-y-10">
                {sections.map((section, idx) => (
                  <div key={idx} className="break-inside-avoid">
                    <IntelligenceCard section={section} searchAddress={address} hideMap={true} allSections={sections} subjectCoords={insightState.coordinates} />
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
