
import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, TrendingUp, MapPin, Lightbulb, Info, Users, GraduationCap,
  BedDouble, Bath, Sofa, Maximize, Sun, Waves, Zap, Battery, 
  CheckCircle2, TreeDeciduous, Car, Award, Mountain, ArrowUpToLine, Ruler, PieChart, Scale, Calendar, Map as MapIcon, Tag, Crosshair
} from 'lucide-react';
import { SectionData } from '../types';
import { PriceChart } from './PriceChart';

interface AnalysisCardProps {
  section: SectionData;
  searchAddress?: string;
  hideMap?: boolean;
  allSections?: SectionData[];
  subjectCoords?: { lat: number, lng: number };
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

const getFeatureIcon = (feature: string) => {
  const lower = feature.toLowerCase();
  if (lower.includes('solar') && lower.includes('battery')) return Battery;
  if (lower.includes('solar')) return Sun;
  if (lower.includes('pool') || lower.includes('spa')) return Waves;
  if (lower.includes('tennis') || lower.includes('court')) return Zap;
  if (lower.includes('garden') || lower.includes('yard')) return TreeDeciduous;
  if (lower.includes('garage') || lower.includes('parking')) return Car;
  return CheckCircle2;
};

const getSuburbIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('demo') || t.includes('community') || t.includes('people')) return Users;
  if (t.includes('life') || t.includes('vibe') || t.includes('atmosphere')) return Sun;
  if (t.includes('connect') || t.includes('transport') || t.includes('convenience')) return Car;
  if (t.includes('market') || t.includes('drivers')) return TrendingUp;
  return MapIcon;
};

const MultiMarkerMap: React.FC<{ 
  subjectAddress: string, 
  subjectCoords?: { lat: number, lng: number },
  comparables: { address: string, label?: string, lat?: number, lng?: number }[],
  highlightAddress?: string,
  onSubjectResolved?: (coords: { lat: number, lng: number }) => void
}> = ({ subjectAddress, subjectCoords, comparables, highlightAddress, onSubjectResolved }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowsRef = useRef<Map<string, any>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Poll for Google Maps availability
  useEffect(() => {
    const checkGoogle = () => {
      if ((window as any).google && (window as any).google.maps) {
        setMapLoaded(true);
      } else {
        setTimeout(checkGoogle, 500);
      }
    };
    if (!mapLoaded) checkGoogle();
  }, [mapLoaded]);

  // Handle marker creation and coordinate mapping
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const google = (window as any).google;
    
    // Initialize map if it doesn't exist
    if (!googleMapRef.current) {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        zoom: 14,
        center: subjectCoords || { lat: -33.8688, lng: 151.2093 }, // Use provided coords or fallback
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            "featureType": "poi",
            "stylers": [{ "visibility": "off" }]
          }
        ]
      });
    }

    const map = googleMapRef.current;
    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();

    // Cleanup old markers
    const currentAddresses = new Set([subjectAddress, ...comparables.map(c => c.address)]);
    markersRef.current.forEach((marker, addr) => {
      if (!currentAddresses.has(addr)) {
        marker.setMap(null);
        markersRef.current.delete(addr);
        infoWindowsRef.current.delete(addr);
      }
    });

    const addMarkerToMap = (address: string, pos: { lat: number, lng: number }, isSubject: boolean, labelText?: string) => {
      if (markersRef.current.has(address)) {
        bounds.extend(pos);
        map.fitBounds(bounds);
        return;
      }

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: address,
        icon: isSubject 
          ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
          : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        zIndex: isSubject ? 1000 : 1
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 10px; font-family: Inter, sans-serif; max-width: 240px;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: ${isSubject ? '#2563eb' : '#ef4444'};">
            ${isSubject ? 'Subject Property' : 'Comparable Sale'}
          </div>
          <div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: 8px;">${address}</div>
          <div style="background: #f1f5f9; padding: 6px; border-radius: 4px; font-family: monospace; font-size: 10px; color: #64748b;">
            Lat: ${pos.lat.toFixed(6)}<br/>Lng: ${pos.lng.toFixed(6)}
          </div>
          ${labelText ? `<div style="font-weight: 700; font-size: 14px; color: #2563eb; margin-top: 8px; border-top: 1px solid #e2e8f0; pt: 8px;">${labelText}</div>` : ''}
        </div>`
      });
      
      marker.addListener('click', () => {
        infoWindowsRef.current.forEach(iw => iw.close());
        infoWindow.open(map, marker);
      });

      markersRef.current.set(address, marker);
      infoWindowsRef.current.set(address, infoWindow);
      bounds.extend(pos);
      
      if (markersRef.current.size > 0) {
        map.fitBounds(bounds);
        if (markersRef.current.size === 1) map.setZoom(15);
      }
    };

    // 1. Process Subject Property - Prioritize passed coords, then geocode
    if (subjectCoords) {
      addMarkerToMap(subjectAddress, subjectCoords, true);
      if (onSubjectResolved) onSubjectResolved(subjectCoords);
    } else {
      geocoder.geocode({ address: subjectAddress }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {
          const pos = results[0].geometry.location.toJSON();
          addMarkerToMap(subjectAddress, pos, true);
          if (onSubjectResolved) onSubjectResolved(pos);
        }
      });
    }

    // 2. Process All Comparables
    comparables.forEach(comp => {
      geocoder.geocode({ address: comp.address }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {
          const pos = results[0].geometry.location.toJSON();
          addMarkerToMap(comp.address, pos, false, comp.label);
        }
      });
    });

  }, [subjectAddress, subjectCoords, comparables, mapLoaded]);

  // Handle Hover Highlighting independently
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    const google = (window as any).google;

    markersRef.current.forEach((marker, addr) => {
      const isHighlighted = highlightAddress === addr;
      marker.setAnimation(isHighlighted ? google.maps.Animation.BOUNCE : null);
      
      const iw = infoWindowsRef.current.get(addr);
      if (isHighlighted && iw) {
        iw.open(googleMapRef.current, marker);
      } else if (iw && highlightAddress && !isHighlighted) {
        iw.close();
      }
    });
  }, [highlightAddress, mapLoaded]);

  return (
    <div className="w-full h-full relative">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <div className="flex flex-col items-center gap-2">
            <TrendingUp className="text-blue-200 animate-pulse" size={32} />
            <span className="text-xs text-slate-400 font-medium">Loading Map Data...</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ section, searchAddress, hideMap = false, allSections = [], subjectCoords }) => {
  const Icon = iconMap[section.icon] || Info;
  const [mapHighlightAddress, setMapHighlightAddress] = useState<string | undefined>(undefined);
  const [resolvedCoords, setResolvedCoords] = useState<{lat: number, lng: number} | null>(subjectCoords || null);

  // Sync resolved coords if prop updates
  useEffect(() => {
    if (subjectCoords) {
      setResolvedCoords(subjectCoords);
    }
  }, [subjectCoords]);

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} className="content-spacer" />;
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={i} className="text-lg font-semibold text-slate-800 mt-6 mb-3 flex items-center gap-2">
            {trimmed.substring(4)}
          </h4>
        );
      }
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col print:shadow-none print:border-slate-300">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3 print:bg-slate-100 print:border-slate-300">
        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 print:shadow-none print:border print:border-slate-300">
          <Icon size={20} strokeWidth={2} />
        </div>
        <h3 className="font-semibold text-slate-800 text-lg">{section.title}</h3>
      </div>
      <div className="p-6 flex-1 flex flex-col print:block">
        {section.propertyAttributes ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
               {section.propertyAttributes.beds && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <BedDouble className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800">{section.propertyAttributes.beds}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Beds</span>
                 </div>
               )}
               {section.propertyAttributes.baths && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <Bath className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800">{section.propertyAttributes.baths}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Baths</span>
                 </div>
               )}
               {section.propertyAttributes.living && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <Sofa className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800">{section.propertyAttributes.living}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Living</span>
                 </div>
               )}
               {section.propertyAttributes.carport && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <Car className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800">{section.propertyAttributes.carport}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Carport</span>
                 </div>
               )}
               {section.propertyAttributes.land && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <Maximize className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.land}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Land</span>
                 </div>
               )}
               {section.propertyAttributes.buildingSize && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <Ruler className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.buildingSize}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Build Size</span>
                 </div>
               )}
               {section.propertyAttributes.buildingCoverage && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <PieChart className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.buildingCoverage}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Coverage</span>
                 </div>
               )}
               {section.propertyAttributes.groundElevation && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <Mountain className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.groundElevation}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Elevation</span>
                 </div>
               )}
               {section.propertyAttributes.roofHeight && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <ArrowUpToLine className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm">{section.propertyAttributes.roofHeight}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Roof Height</span>
                 </div>
               )}
               {section.propertyAttributes.solar && (
                 <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center print:border print:border-blue-100">
                   <Sun className="text-blue-500 mb-1" size={20} />
                   <span className="font-bold text-slate-800 text-xs sm:text-sm truncate w-full px-1">{section.propertyAttributes.solar}</span>
                   <span className="text-[10px] uppercase tracking-wide text-slate-500">Solar</span>
                 </div>
               )}
            </div>

            {section.propertyAttributes.type && (
              <div className="flex items-center gap-2 p-3 border border-slate-100 rounded-lg bg-slate-50/50 print:border-slate-200">
                 <Home size={16} className="text-slate-400" />
                 <span className="text-sm text-slate-500">Property Type:</span>
                 <span className="text-sm font-medium text-slate-800">{section.propertyAttributes.type}</span>
              </div>
            )}

            {section.propertyAttributes.features && section.propertyAttributes.features.length > 0 && (
              <div className="print:break-inside-avoid">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features & Amenities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print:grid-cols-2">
                  {section.propertyAttributes.features.map((feature, i) => {
                    const FeatureIcon = getFeatureIcon(feature);
                    return (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50 transition-colors print:border print:border-slate-100">
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
          <div className="flex-1 flex flex-col print:block">
             <p className="text-sm text-slate-500 mb-4 italic">
               Visualizing market performance based on detected historical listing data.
             </p>
             <PriceChart data={section.priceHistory} rawContent={section.content} />
          </div>
        ) : section.schools && section.schools.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 italic mb-2">Nearby public and private educational institutions.</p>
            {section.schools.map((school, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all gap-3 print:border-slate-200 print:bg-white print:break-inside-avoid">
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
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-slate-100 shadow-sm self-start sm:self-center print:shadow-none print:border-slate-200">
                  <Award size={14} className="text-amber-500" />
                  <span className="text-sm font-bold text-slate-700">{school.rating}</span>
                </div>
              </div>
            ))}
          </div>
        ) : section.suburbProfile && section.suburbProfile.length > 0 ? (
          <div className="space-y-6">
            <div className="text-sm text-slate-500 italic mb-2">
              Demographic and lifestyle analysis of the surrounding neighborhood.
            </div>
            {section.suburbProfile.map((sub, i) => {
              const SubIcon = getSuburbIcon(sub.title);
              return (
                <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors print:bg-white print:border-slate-200 print:break-inside-avoid">
                  <h4 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                     <div className="p-1.5 bg-white rounded-md shadow-sm text-blue-600 print:border print:border-slate-200 print:shadow-none">
                       <SubIcon size={16} />
                     </div>
                     {sub.title}
                  </h4>
                  <div className="text-slate-700 text-sm leading-relaxed prose prose-slate max-w-none">
                    {formatContent(sub.content)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (section.investmentMetrics && section.investmentMetrics.length > 0) || (section.comparables && section.comparables.length > 0) ? (
          <div className="space-y-10">
            {/* 1. INVESTMENT METRICS SECTION */}
            {section.investmentMetrics && section.investmentMetrics.length > 0 && (
              <div className="animate-fade-in">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" /> Suburb Performance Metrics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                  {section.investmentMetrics.map((metric, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col relative overflow-hidden print:shadow-none print:break-inside-avoid">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        metric.comparison.toLowerCase().includes('above') ? 'bg-green-500' : 
                        metric.comparison.toLowerCase().includes('below') ? 'bg-orange-500' : 'bg-slate-300'
                      }`}></div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{metric.label}</h4>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-slate-900">{metric.value}</span>
                      </div>
                      <div className="pt-4 mt-auto border-t border-slate-100 flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500">Suburb Average</span>
                           <span className="font-semibold text-slate-700">{metric.suburbAverage}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-slate-500">Relative Performance</span>
                           <span className={`font-bold ${
                             metric.comparison.toLowerCase().includes('above') ? 'text-green-600' : 
                             metric.comparison.toLowerCase().includes('below') ? 'text-orange-600' : 'text-slate-600'
                           }`}>{metric.comparison}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. COMPARABLE PROPERTIES SECTION */}
            {section.comparables && section.comparables.length > 0 && (
              <div className="pt-6 border-t border-slate-100 print:break-inside-avoid animate-fade-in">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Scale size={18} className="text-blue-600" /> Comparable Properties
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                  {section.comparables.map((comp, i) => (
                    <div 
                      key={i} 
                      onMouseEnter={() => setMapHighlightAddress(comp.address)}
                      onMouseLeave={() => setMapHighlightAddress(undefined)}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer active:scale-[0.98] print:shadow-none print:break-inside-avoid relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-2">
                            <div className="mt-1 p-1.5 bg-blue-50 rounded-full text-blue-500 print:border print:border-blue-100 flex-shrink-0">
                              <Home size={14} />
                            </div>
                            <div className="flex flex-col">
                              <h4 className="font-semibold text-slate-800 text-sm leading-tight max-w-[180px] sm:max-w-[200px]">{comp.address}</h4>
                              <div className="mt-1.5 flex">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 shadow-sm animate-pulse-subtle">
                                  <Tag size={10} className="mr-1" /> SOLD
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md print:border print:border-blue-100">{comp.soldPrice}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">Sale Price</span>
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
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 3. LOCATION ANALYSIS SECTION */}
            {searchAddress && !hideMap && (
               <div className="pt-6 border-t border-slate-100 animate-fade-in print:break-inside-avoid">
                  <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapIcon size={18} className="text-blue-600" /> Interactive Location Map
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full shadow-sm"></span> 
                        <span className="font-medium">Subject Property</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full shadow-sm"></span> 
                        <span className="font-medium">Recent Comparable Sales</span>
                      </div>
                    </div>
                    
                    {resolvedCoords && (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm animate-in fade-in slide-in-from-right-2">
                        <Crosshair size={14} className="text-blue-500" />
                        <div className="flex flex-col">
                           <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">Subject Geocoordinates</span>
                           <span className="text-xs font-mono font-semibold text-blue-600">
                              {resolvedCoords.lat.toFixed(6)}, {resolvedCoords.lng.toFixed(6)}
                           </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-full h-[550px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-md relative print:border-slate-300 mb-4">
                    <MultiMarkerMap 
                      subjectAddress={searchAddress} 
                      subjectCoords={subjectCoords}
                      comparables={section.comparables?.map(c => ({ 
                        address: c.address, 
                        label: c.soldPrice,
                        lat: c.lat,
                        lng: c.lng
                      })) || []}
                      highlightAddress={mapHighlightAddress}
                      onSubjectResolved={(coords) => setResolvedCoords(coords)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic text-center">Map markers are accurately positioned using verified coordinates resolved by the Google Geocoding service.</p>
               </div>
            )}

            <div className="prose prose-slate prose-sm max-w-none pt-6 border-t border-slate-100">
              {formatContent(section.content)}
            </div>
          </div>
        ) : (
          <div className="prose prose-slate prose-sm max-w-none flex-1">
            {formatContent(section.content)}
          </div>
        )}
      </div>
    </div>
  );
};
