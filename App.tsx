
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Building2, MessageSquare, Info, ChevronRight } from 'lucide-react';
import { analyzeProperty } from './services/analyzePropertyService';
import { searchPropertiesAgent } from './services/searchPropertiesService';
import { parseAnalysisSections } from './services/dataParser';
import { AnalysisState, SectionProgress, ViewMode, AgentSearchResult, PropertyData } from './types';
import { IntelligenceCard } from './components/IntelligenceCard';
import { AnalysisProgress } from './components/AnalysisProgress';
import { AgentResultView } from './components/AgentResultView';
import { ComparisonCarousel } from './components/ComparisonCarousel';
import { ComparisonTray } from './components/ComparisonTray';
import { SearchSuggestions } from './components/SearchSuggestions';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode | null>(null);
  const [comparisonList, setComparisonList] = useState<PropertyData[]>([]);
  const [address, setAddress] = useState('');
  const [insightState, setInsightState] = useState<AnalysisState>({ status: 'idle', data: null });
  const [insightProgress, setInsightProgress] = useState<Record<string, SectionProgress>>({});
  const [agentQuery, setAgentQuery] = useState('');
  const [agentStatus, setAgentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [agentResult, setAgentResult] = useState<AgentSearchResult | null>(null);
  const [activeTab, setActiveTab] = useState('Property Overview');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCompleteRef = useRef<any>(null);
  const TABS = ['Property Overview', 'Investment Insights', 'Price History', 'Suburb Profile', 'School Catchment & Ratings'];

  useEffect(() => {
    if (!activeView || activeView === 'compare') return;
    const loadGoogleMapsScript = () => {
      if ((window as any).google?.maps?.places) { initAutocomplete(); return; }
      if (document.getElementById('google-maps-script')) return;
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB0dDMOVbcQkBfYpFu5HJY6N0HdMUFBPsk&libraries=places`;
      script.async = true;
      script.onload = () => initAutocomplete();
      document.body.appendChild(script);
    };
    const initAutocomplete = () => {
      if (!inputRef.current || !(window as any).google || autoCompleteRef.current) return;
      autoCompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, { 
        types: ['address'], 
        componentRestrictions: { country: 'au' } 
      });
      autoCompleteRef.current.addListener('place_changed', () => {
        const place = autoCompleteRef.current.getPlace();
        if (place.formatted_address) setAddress(place.formatted_address);
      });
    };
    loadGoogleMapsScript();
  }, [activeView]);

  const handleAgentSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery || agentQuery;
    if (!queryToUse.trim()) return;
    if (customQuery) setAgentQuery(customQuery);
    setAgentStatus('loading');
    try {
      const res = await searchPropertiesAgent(queryToUse);
      setAgentResult(res);
      setAgentStatus('success');
    } catch (err) { setAgentStatus('error'); }
  };

  const handleInsightSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setInsightState({ status: 'loading', data: null });
    setInsightProgress({});
    setActiveTab(TABS[0]);
    try {
      const result = await analyzeProperty(address.trim(), (update) => {
        setInsightProgress(prev => ({ ...prev, [update.key]: update }));
      });
      setInsightState({ status: 'success', data: result });
    } catch (err: any) { setInsightState({ status: 'error', data: null, error: err.message }); }
  }, [address]);

  const handleAddToCompare = (prop: PropertyData) => {
    if (comparisonList.length >= 10) { alert("Max 10 properties."); return; }
    if (!comparisonList.find(p => p.id === prop.id)) setComparisonList(prev => [...prev, prop]);
  };

  const sections = insightState.data ? parseAnalysisSections(insightState.data.text) : [];
  const activeSectionData = sections.find(s => s.title === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center px-8 justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveView(null); setAgentResult(null); }}>
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm"><Building2 className="text-white h-6 w-6" /></div>
          <span className="font-bold text-xl tracking-tight text-slate-800">PropSearch<span className="text-blue-600">Intel</span></span>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <div className={`flex-1 overflow-y-auto transition-all duration-500 ${(activeView === 'talk' || activeView === 'insight') && comparisonList.length > 0 ? 'mr-80' : ''}`}>
          <div className="bg-white border-b border-slate-200 pb-12 pt-16 px-4 shadow-sm text-center">
            <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Advanced Real Estate <span className="text-blue-600">Intelligence</span></h1>
            
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <button 
                onClick={() => { setActiveView('talk'); setInsightState({status:'idle', data:null}); }} 
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${activeView === 'talk' ? 'bg-blue-600 text-white scale-105' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-200'}`}
              >
                <MessageSquare size={24} /> Talk to AI Agent
              </button>
              <button 
                onClick={() => { setActiveView('insight'); setAgentStatus('idle'); setAgentResult(null); }} 
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${activeView === 'insight' ? 'bg-indigo-600 text-white scale-105' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-indigo-200'}`}
              >
                <Info size={24} /> Property Insight
              </button>
            </div>

            {activeView === 'talk' && (
              <div className="max-w-3xl mx-auto animate-fade-in px-4">
                <form onSubmit={(e) => handleAgentSearch(e)} className="relative group mb-8">
                  <input 
                    type="text" 
                    className="block w-full pl-6 pr-12 py-5 bg-white border border-slate-200 rounded-3xl text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-xl text-lg" 
                    placeholder="Find me houses in Paddington under $2M..." 
                    value={agentQuery} 
                    onChange={(e) => setAgentQuery(e.target.value)} 
                  />
                  <button type="submit" disabled={agentStatus === 'loading'} className="absolute inset-y-3 right-3 px-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-slate-300 shadow-lg">
                    {agentStatus === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </button>
                </form>
                {!agentResult && agentStatus !== 'loading' && (
                  <SearchSuggestions onSelect={(q) => handleAgentSearch(undefined, q)} />
                )}
              </div>
            )}

            {activeView === 'insight' && (
              <div className="max-w-2xl mx-auto animate-fade-in px-4">
                <form onSubmit={handleInsightSearch} className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><MapPin className="h-5 w-5 text-slate-400" /></div>
                  <input 
                    ref={inputRef} 
                    type="text" 
                    className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm text-lg" 
                    placeholder="Enter property address..." 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                  />
                  <button type="submit" disabled={insightState.status === 'loading'} className="absolute inset-y-2.5 right-2.5 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md">
                    {insightState.status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </button>
                </form>
                {insightState.status === 'loading' && <AnalysisProgress progress={insightProgress} />}
              </div>
            )}
          </div>

          <main className="max-w-7xl mx-auto px-4 py-12">
            {activeView === 'compare' ? (
              <ComparisonCarousel items={comparisonList} onBack={() => setActiveView('talk')} />
            ) : (
              <>
                {activeView === 'talk' && agentResult && (
                  <div className="animate-fade-in">
                    <AgentResultView result={agentResult} onAddToCompare={handleAddToCompare} compareList={comparisonList} />
                  </div>
                )}
                {activeView === 'insight' && insightState.status === 'success' && (
                  <div className="animate-fade-in">
                    <div className="mb-6 flex space-x-2 border-b border-slate-200 overflow-x-auto">
                      {TABS.map(tab => (
                        <button 
                          key={tab} 
                          onClick={() => setActiveTab(tab)} 
                          className={`px-6 py-4 text-sm font-bold rounded-t-2xl transition-all whitespace-nowrap ${activeTab === tab ? 'text-indigo-600 bg-white border border-b-0 border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="bg-white rounded-b-3xl border border-t-0 border-slate-200 shadow-sm p-6">
                      {activeSectionData ? (
                        <IntelligenceCard 
                          section={activeSectionData} 
                          searchAddress={address} 
                          allSections={sections} 
                          onAddToCompare={handleAddToCompare} 
                          comparisonList={comparisonList} 
                        />
                      ) : (
                        <div className="text-center py-20 text-slate-400 italic">No data available for {activeTab}</div>
                      )}
                    </div>
                  </div>
                )}
                {!activeView && (
                  <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50 flex flex-col items-center">
                    <div className="bg-white p-6 rounded-full shadow-lg mb-8"><Building2 className="text-blue-600" size={48} /></div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Welcome to PropSearch Intel</h3>
                    <p className="text-slate-500 max-w-md mx-auto leading-relaxed">Select a tool above to start your real estate journey. Search for properties with the AI Agent or get deep insights for a specific address.</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {(activeView === 'talk' || activeView === 'insight') && comparisonList.length > 0 && (
          <ComparisonTray 
            items={comparisonList}
            onRemove={(id) => setComparisonList(prev => prev.filter(p => p.id !== id))}
            onClear={() => setComparisonList([])}
            onCompare={() => setActiveView('compare')}
          />
        )}
      </div>
    </div>
  );
}
