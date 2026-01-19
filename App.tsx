import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Building2, Download, Check, LayoutDashboard, TrendingUp, GraduationCap, Map, Lightbulb, Scale } from 'lucide-react';
import { analyzeProperty } from './services/geminiService';
import { parseAnalysisSections } from './services/dataParser';
import { AnalysisState, SectionData, SectionProgress } from './types';
import { IntelligenceCard } from './components/IntelligenceCard';
import { AnalysisProgress } from './components/AnalysisProgress';

export default function App() {
  const [address, setAddress] = useState('');
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    data: null
  });
  const [progress, setProgress] = useState<Record<string, SectionProgress>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Refs for Google Places Autocomplete
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

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if ((window as any).google?.maps?.places) {
        initAutocomplete();
        return;
      }

      if (document.getElementById('google-maps-script')) {
        return;
      }

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
          if (place.formatted_address) {
            setAddress(place.formatted_address);
          }
        });
      } catch (error) {
        console.error("Error initializing Google Places Autocomplete:", error);
      }
    };

    loadGoogleMapsScript();
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAddress = address.trim();
    if (!targetAddress) return;

    setState({ status: 'loading', data: null, coordinates: undefined });
    setProgress({});
    setActiveTab(TABS[0]);

    // 1. Geocode the address immediately using Google Geocoder
    if ((window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: targetAddress }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {
          const coords = results[0].geometry.location.toJSON();
          setState(prev => ({ ...prev, coordinates: coords }));
        }
      });
    }

    // 2. Start AI Analysis
    try {
      const result = await analyzeProperty(targetAddress, (update) => {
        setProgress(prev => ({
          ...prev,
          [update.key]: update
        }));
      });
      setState(prev => ({ ...prev, status: 'success', data: result }));
    } catch (err: any) {
      setState({ 
        status: 'error', 
        data: null, 
        error: err.message || "An unknown error occurred" 
      });
    }
  }, [address]);

  const handleDownloadReport = async () => {
    if (isGeneratingPdf || !(window as any).html2pdf) return;
    setIsGeneratingPdf(true);
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) {
        setIsGeneratingPdf(false);
        return;
      }
      const opt = {
        margin: 0, 
        filename: `PropSearch_Intel_${address.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      try {
        await (window as any).html2pdf().set(opt).from(element).save();
      } catch (error) {
        console.error("PDF generation failed:", error);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 1500);
  };

  const sections = state.data ? parseAnalysisSections(state.data.text) : [];
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
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">PropSearch<span className="text-blue-600">Intel</span></span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 pb-12 pt-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Unlock Real Estate <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Market Intelligence</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience the future of real estate analysis powered by cutting-edge Artificial Intelligence. Instantly gauge market interest, track comprehensive listing histories, and unlock precise value estimates—turning complex data into clear, actionable intelligence for smarter property decisions.
          </p>
          
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto group z-20">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:shadow-md transition-all text-lg"
              placeholder="Enter full property address (e.g. 123 Example St, Sydney)..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              type="submit"
              disabled={state.status === 'loading' || !address.trim()}
              className="absolute inset-y-2 right-2 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[3rem]"
            >
              {state.status === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </form>

          {(state.status === 'loading' || (state.status === 'success' && Object.keys(progress).length > 0)) && (
            <AnalysisProgress progress={progress} />
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {state.status === 'idle' && (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-6">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Ready to analyze</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              Enter an address above to generate a comprehensive market report based on real-time search data.
            </p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
            <div className="text-red-600 font-semibold mb-2">Analysis Failed</div>
            <p className="text-red-500">{state.error}</p>
          </div>
        )}

        {state.status === 'success' && state.data && (
          <>
            <div className="animate-fade-in-up">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Market Intelligence Report
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm inline-block">
                      For: {address}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDownloadReport}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}
                </button>
              </div>

              <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar">
                <div className="flex space-x-2 min-w-max border-b border-slate-200 px-1">
                  {TABS.map((tab) => {
                    const Icon = getTabIcon(tab);
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                          flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all relative
                          ${isActive 
                            ? 'text-blue-600 bg-white border border-b-0 border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                        `}
                      >
                        <Icon size={16} />
                        {tab}
                        {isActive && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white z-10"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-b-xl rounded-tr-xl border border-t-0 border-slate-200 shadow-sm min-h-[400px]">
                {activeSectionData ? (
                  <div className="w-full">
                    <IntelligenceCard 
                      section={activeSectionData} 
                      searchAddress={address} 
                      allSections={sections}
                      subjectCoords={state.coordinates}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 bg-slate-50/30">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        {React.createElement(getTabIcon(activeTab), { size: 24, className: "opacity-40" })}
                    </div>
                    <p className="font-medium">No data available for {activeTab}</p>
                    <p className="text-sm mt-1 opacity-75">The AI did not return specific information for this section.</p>
                  </div>
                )}
              </div>
            </div>

            {isGeneratingPdf && (
              <div className="fixed inset-0 z-[9999] bg-slate-100 flex justify-center overflow-auto pt-8">
                <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-lg z-[10000] flex items-center gap-3 backdrop-blur-sm">
                   <Loader2 className="animate-spin text-blue-400" />
                   <span className="font-medium">Generating PDF Report...</span>
                </div>
                
                <div ref={printRef} className="bg-white w-[210mm] min-h-screen p-[15mm] shadow-2xl mb-8 text-slate-900 mx-auto">
                    <div className="text-center mb-8 border-b border-slate-300 pb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Building2 className="text-blue-600 h-8 w-8" />
                        <span className="font-bold text-2xl text-slate-900">PropSearch<span className="text-blue-600">Intel</span></span>
                      </div>
                      <h1 className="text-xl font-bold text-slate-800">Market Intelligence Report</h1>
                      <h2 className="text-lg text-slate-600 mt-2">{address}</h2>
                      <p className="text-sm text-slate-400 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-6">
                      {sections.map((section, index) => (
                        <div key={index} className="mb-6 break-inside-avoid">
                          <IntelligenceCard 
                            section={section} 
                            searchAddress={address} 
                            hideMap={true} 
                            allSections={sections} 
                            subjectCoords={state.coordinates}
                          />
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}