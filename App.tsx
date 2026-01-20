
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Building2, Download, MessageSquare, Info, LayoutDashboard, TrendingUp, GraduationCap, Map, Lightbulb, ExternalLink } from 'lucide-react';
import { analyzeProperty } from './services/analyzePropertyService';
import { searchPropertiesAgent } from './services/searchPropertiesService';
import { parseAnalysisSections } from './services/dataParser';
import { AnalysisState, SectionData, SectionProgress, ViewMode, AgentSearchResult } from './types';
import { IntelligenceCard } from './components/IntelligenceCard';
import { AnalysisProgress } from './components/AnalysisProgress';

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
    'Price History & Trends',
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
      case 'Price History & Trends': return TrendingUp;
      case 'Suburb Profile': return Map;
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
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">PropSearch<span className="text-blue-600">Intel</span></span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 pb-12 pt-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Advanced Real Estate <span className="text-blue-600">Intelligence</span>
          </h1>
          
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <button 
              onClick={() => { setActiveView('talk'); setInsightState({status:'idle', data:null}); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${activeView === 'talk' ? 'bg-blue-600 text-white scale-105' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-200'}`}
            >
              <MessageSquare size={24} />
              Talk to AI Agent
            </button>
            <button 
              onClick={() => { setActiveView('insight'); setAgentStatus('idle'); setAgentResult(null); }}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${activeView === 'insight' ? 'bg-indigo-600 text-white scale-105' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-indigo-200'}`}
            >
              <Info size={24} />
              Property Insight
            </button>
          </div>

          {activeView === 'talk' && (
            <div className="max-w-2xl mx-auto animate-fade-in">
              <p className="text-slate-500 mb-6">Ask the AI Agent to find properties, suburbs, or market trends for you.</p>
              <form onSubmit={handleAgentSearch} className="relative group">
                <input
                  type="text"
                  className="block w-full pl-6 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:shadow-md transition-all text-lg"
                  placeholder="e.g. Find me 3-bed houses in Paddington under $2M..."
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={agentStatus === 'loading' || !agentQuery.trim()}
                  className="absolute inset-y-2 right-2 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-colors flex items-center justify-center"
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
                  className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all text-lg"
                  placeholder="Enter property address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={insightState.status === 'loading' || !address.trim()}
                  className="absolute inset-y-2 right-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center justify-center"
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
          <div className="animate-fade-in space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm leading-relaxed text-lg text-slate-800 prose prose-blue max-w-none">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="text-blue-600" /> Search Results
              </h2>
              {agentResult.answer.split('\n').map((para, i) => para.trim() ? <p key={i}>{para}</p> : null)}
            </div>
            {agentResult.sources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentResult.sources.map((src, i) => src.web && (
                  <a key={i} href={src.web.uri} target="_blank" rel="noopener" className="p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-500 transition-all flex items-center justify-between group">
                    <div className="flex-1 truncate mr-4">
                      <p className="font-semibold text-sm truncate">{src.web.title}</p>
                      <p className="text-xs text-slate-400 truncate">{src.web.uri}</p>
                    </div>
                    <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-600" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'insight' && insightState.status === 'success' && insightState.data && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Intelligence Report</h2>
                <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm mt-1 inline-block">For: {address}</span>
              </div>
              <button onClick={handleDownloadReport} disabled={isGeneratingPdf} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg font-bold">
                {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}
              </button>
            </div>

            <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar flex space-x-2 border-b border-slate-200 px-1">
              {TABS.map((tab) => {
                const Icon = getTabIcon(tab);
                const isActive = activeTab === tab;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl transition-all relative ${isActive ? 'text-indigo-600 bg-white border border-b-0 border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Icon size={16} /> {tab}
                    {isActive && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white z-10"></div>}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-t-0 border-slate-200 shadow-sm min-h-[400px]">
              {activeSectionData ? (
                <IntelligenceCard section={activeSectionData} searchAddress={address} allSections={sections} subjectCoords={insightState.coordinates} />
              ) : (
                <div className="flex items-center justify-center h-[400px] text-slate-400">No data available for {activeTab}</div>
              )}
            </div>
          </div>
        )}

        {!activeView && (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Welcome to PropSearch Intel</h3>
            <p className="text-slate-500 max-w-md mx-auto">Select a tool above to start your real estate journey. Search for properties with the AI Agent or get deep insights for a specific address.</p>
          </div>
        )}
      </main>

      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[9999] bg-slate-100/90 backdrop-blur flex justify-center overflow-auto pt-8">
           <div ref={printRef} className="bg-white w-[210mm] min-h-screen p-[15mm] shadow-2xl mb-8 text-slate-900 mx-auto">
              <div className="text-center mb-8 border-b border-slate-300 pb-4">
                <Building2 className="text-indigo-600 h-10 w-10 mx-auto mb-2" />
                <h1 className="text-2xl font-bold">Market Intelligence Report</h1>
                <h2 className="text-lg text-slate-600">{address}</h2>
              </div>
              <div className="space-y-6">
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
