import React, { useState, useEffect } from 'react';
import { 
  Home, TrendingUp, MapPin, Lightbulb, Info, Users, GraduationCap,
  BedDouble, Bath, Sofa, Maximize, Sun, Waves, Zap, Battery, 
  CheckCircle2, TreeDeciduous, Car, Award, Mountain, ArrowUpToLine, Ruler, PieChart, Scale, Calendar, Map as MapIcon
} from 'lucide-react';
import { SectionData } from '../types';
import { PriceChart } from './PriceChart';

interface AnalysisCardProps {
  section: SectionData;
  searchAddress?: string;
}

const iconMap = {
  house: Home,
  chart: TrendingUp,
  map: MapPin,
  people: Lightbulb,
  info: Info,
  users: Users,
  school: GraduationCap,
  scale: Scale
};

// Helper to find the best icon for a feature name
const getFeatureIcon = (feature: string) => {
  const lower = feature.toLowerCase();
  if (lower.includes('solar') && lower.includes('battery')) return Battery;
  if (lower.includes('solar')) return Sun;
  if (lower.includes('pool') || lower.includes('spa')) return Waves;
  if (lower.includes('tennis') || lower.includes('court')) return Zap; // Activity/Sport
  if (lower.includes('garden') || lower.includes('yard')) return TreeDeciduous;
  if (lower.includes('garage') || lower.includes('parking')) return Car;
  return CheckCircle2; // Default
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ section, searchAddress }) => {
  const Icon = iconMap[section.icon] || Info;
  const [mapAddress, setMapAddress] = useState<string | undefined>(searchAddress);

  // Update map address when search address changes or section changes
  useEffect(() => {
    if (searchAddress) {
      setMapAddress(searchAddress);
    }
  }, [searchAddress]);

  // Simple parser to make lists look better in the text content
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} className="content-spacer" />;
      
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return (
          <li key={i} className="ml-4 pl-2 text-slate-600 mb-2 list-disc marker:text-blue-500">
            {trimmed.substring(2)}
          </li>
        );
      }
      return <p key={i} className="mb-3 text-slate-700 leading-relaxed">{trimmed}</p>;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
          <Icon size={20} strokeWidth={2} />
        </div>
        <h3 className="font-semibold text-slate-800 text-lg">{section.title}</h3>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        {/* Special rendering for Property Overview */}
        {section.propertyAttributes ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {section.propertyAttributes.beds && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <BedDouble className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800">{section.propertyAttributes.beds}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Beds</span>
                 </div>
               )}
               {section.propertyAttributes.baths && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <Bath className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800">{section.propertyAttributes.baths}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Baths</span>
                 </div>
               )}
               {section.propertyAttributes.living && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <Sofa className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800">{section.propertyAttributes.living}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Living</span>
                 </div>
               )}
               {section.propertyAttributes.carport && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <Car className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800">{section.propertyAttributes.carport}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Carport</span>
                 </div>
               )}
               {section.propertyAttributes.land && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <Maximize className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.land}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Land</span>
                 </div>
               )}
               {section.propertyAttributes.buildingSize && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <Ruler className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.buildingSize}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Build Size</span>
                 </div>
               )}
               {section.propertyAttributes.buildingCoverage && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <PieChart className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.buildingCoverage}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Coverage</span>
                 </div>
               )}
               {section.propertyAttributes.groundElevation && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <Mountain className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.groundElevation}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Elevation</span>
                 </div>
               )}
               {section.propertyAttributes.roofHeight && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <ArrowUpToLine className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.roofHeight}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Roof Height</span>
                 </div>
               )}
               {section.propertyAttributes.solar && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center">
                   <Sun className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm truncate w-full px-1">{section.propertyAttributes.solar}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Solar</span>
                 </div>
               )}
            </div>

            {section.propertyAttributes.type && (
              <div className="flex items-center gap-2 p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                 <Home size={16} className="text-slate-400" />
                 <span className="text-sm text-slate-500">Property Type:</span>
                 <span className="text-sm font-medium text-slate-800">{section.propertyAttributes.type}</span>
              </div>
            )}

            {section.propertyAttributes.features && section.propertyAttributes.features.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features & Amenities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {section.propertyAttributes.features.map((feature, i) => {
                    const FeatureIcon = getFeatureIcon(feature);
                    return (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 transition-colors">
                        <FeatureIcon size={16} className="text-blue-500" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
               {formatContent(section.content.split('\n').filter(line => line.includes('Status') || line.includes('Listed')).join('\n'))}
            </div>
          </div>
        ) : section.priceHistory && section.priceHistory.length > 0 ? (
          /* Price History View */
          <div className="flex-1 flex flex-col">
             <p className="text-sm text-slate-500 mb-4 italic">
               Visualizing market performance based on detected historical listing data.
             </p>
             <PriceChart data={section.priceHistory} rawContent={section.content} />
          </div>
        ) : section.schools && section.schools.length > 0 ? (
          /* Schools View */
          <div className="space-y-4">
            <p className="text-sm text-slate-500 italic mb-2">Nearby public and private educational institutions.</p>
            {section.schools.map((school, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800">{school.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide border ${
                      school.type.toLowerCase().includes('private') 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {school.type}
                    </span>
                  </div>
                  {school.distance && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={12} />
                      <span>{school.distance}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-slate-100 shadow-sm self-start sm:self-center">
                  <Award size={14} className="text-amber-500" />
                  <span className="text-sm font-bold text-slate-700">{school.rating}</span>
                </div>
              </div>
            ))}
          </div>
        ) : section.investmentMetrics && section.investmentMetrics.length > 0 ? (
          /* Investment Insights View */
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.investmentMetrics.map((metric, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    metric.comparison.toLowerCase().includes('above') ? 'bg-green-500' : 
                    metric.comparison.toLowerCase().includes('below') ? 'bg-orange-500' : 'bg-slate-300'
                  }`}></div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{metric.label}</h4>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-slate-900">{metric.value}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-500">Suburb Avg:</span>
                       <span className="font-medium text-slate-700">{metric.suburbAverage}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-500">Comparison:</span>
                       <span className={`font-bold ${
                         metric.comparison.toLowerCase().includes('above') ? 'text-green-600' : 
                         metric.comparison.toLowerCase().includes('below') ? 'text-orange-600' : 'text-slate-600'
                       }`}>{metric.comparison}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparable Properties rendered within Investment Insights */}
            {section.comparables && section.comparables.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Scale size={16} /> Comparable Properties
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.comparables.map((comp, i) => (
                    <div 
                      key={i} 
                      onClick={() => setMapAddress(comp.address)}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]"
                      title="Click to view on map"
                    >
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-2">
                            <div className="mt-1 p-1.5 bg-blue-50 rounded-full text-blue-500">
                              <Home size={14} />
                            </div>
                            <h4 className="font-semibold text-slate-800 text-sm leading-tight max-w-[200px]">{comp.address}</h4>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{comp.soldPrice}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">Sold Price</span>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 pl-9">
                          <Calendar size={12} />
                          <span>Sold: {comp.soldDate}</span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 pl-1">
                          <p className="text-xs text-slate-600 line-clamp-2">
                            <span className="font-medium text-slate-400 mr-1">Features:</span>
                            {comp.features}
                          </p>
                      </div>
                      <div className="mt-2 text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity text-center bg-blue-50 py-1 rounded">
                        Click to view map location
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Map Subsection */}
            {section.comparables && section.comparables.length > 0 && mapAddress && (
               <div className="pt-6 border-t border-slate-100 animate-fade-in">
                  <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapIcon size={16} /> Location Analysis
                  </h4>
                  <div className="w-full h-[350px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-xs font-medium text-slate-700 max-w-[80%] truncate">
                      Viewing: <span className="text-blue-600">{mapAddress}</span>
                    </div>
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full"
                    ></iframe>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Select a property from the list above to view its specific location.
                  </p>
               </div>
            )}

            {/* Render remaining content */}
            <div className="prose prose-slate prose-sm max-w-none pt-4 border-t border-slate-100">
              {formatContent(section.content)}
            </div>
          </div>
        ) : (
          /* Standard markdown rendering fallback */
          <div className="prose prose-slate prose-sm max-w-none flex-1">
            {formatContent(section.content)}
          </div>
        )}
      </div>
    </div>
  );
};