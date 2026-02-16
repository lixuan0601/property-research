
import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

interface MultiMarkerMapProps {
  subjectAddress?: string;
  subjectCoords?: { lat: number; lng: number };
  comparables: { 
    address: string; 
    label?: string; 
    lat?: number; 
    lng?: number;
    status?: string;
  }[];
  highlightAddress?: string;
  onSubjectResolved?: (coords: { lat: number; lng: number }) => void;
}

export const MultiMarkerMap: React.FC<MultiMarkerMapProps> = ({ 
  subjectAddress, 
  subjectCoords, 
  comparables, 
  highlightAddress, 
  onSubjectResolved 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowsRef = useRef<Map<string, any>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

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

  const getMarkerIcon = (status?: string, isSubject?: boolean) => {
    if (isSubject) return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    const s = status?.toUpperCase() || '';
    if (s.includes('SOLD')) return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    if (s.includes('SALE') || s.includes('ACTIVE')) return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    if (s.includes('RENT') || s.includes('LEASED')) return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    if (s.includes('CONTINGENT') || s.includes('PENDING')) return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    return 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
  };

  const getStatusColorClass = (status?: string) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('SOLD')) return '#ef4444';
    if (s.includes('SALE') || s.includes('ACTIVE')) return '#2563eb';
    if (s.includes('RENT') || s.includes('LEASED')) return '#10b981';
    if (s.includes('CONTINGENT') || s.includes('PENDING')) return '#f59e0b';
    return '#64748b';
  };

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const google = (window as any).google;
    
    if (!googleMapRef.current) {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        zoom: 14,
        center: subjectCoords || { lat: -27.4701, lng: 153.0211 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }]
      });
    }

    const map = googleMapRef.current;
    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();

    const addMarkerToMap = (address: string, pos: { lat: number, lng: number }, isSubject: boolean, labelText?: string, status?: string) => {
      if (markersRef.current.has(address)) {
        const existingMarker = markersRef.current.get(address);
        existingMarker.setPosition(pos);
        bounds.extend(pos);
        map.fitBounds(bounds);
        return;
      }

      const statusColor = getStatusColorClass(status);
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: address,
        icon: getMarkerIcon(status, isSubject),
        zIndex: isSubject ? 1000 : 1
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: 'Inter', sans-serif; max-width: 240px;">
            <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; color: ${statusColor}; margin-bottom: 4px;">
              ${status || (isSubject ? 'Search Focus' : 'Property')}
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #1e293b; margin-bottom: 4px;">${address}</div>
            ${labelText ? `<div style="font-weight: 800; font-size: 15px; color: #2563eb;">${labelText}</div>` : ''}
          </div>`
      });
      
      marker.addListener('click', () => {
        infoWindowsRef.current.forEach(iw => iw.close());
        infoWindow.open(map, marker);
      });

      markersRef.current.set(address, marker);
      infoWindowsRef.current.set(address, infoWindow);
      bounds.extend(pos);
      map.fitBounds(bounds);
      
      if (markersRef.current.size === 1) map.setZoom(15);
    };

    // Cleanup stale markers
    const currentAddresses = new Set([
      ...(subjectAddress ? [subjectAddress] : []),
      ...comparables.map(c => c.address)
    ]);
    markersRef.current.forEach((marker, addr) => {
      if (!currentAddresses.has(addr)) {
        marker.setMap(null);
        markersRef.current.delete(addr);
        infoWindowsRef.current.delete(addr);
      }
    });

    // Subject Property
    if (subjectAddress) {
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
    }

    // Comparables with Throttled Geocoding
    comparables.forEach((comp, index) => {
      if (comp.lat && comp.lng) {
        addMarkerToMap(comp.address, { lat: comp.lat, lng: comp.lng }, false, comp.label, comp.status);
      } else {
        // Simple throttle to avoid OVER_QUERY_LIMIT
        setTimeout(() => {
          geocoder.geocode({ address: comp.address }, (results: any, status: string) => {
            if (status === 'OK' && results[0]) {
              const pos = results[0].geometry.location.toJSON();
              addMarkerToMap(comp.address, pos, false, comp.label, comp.status);
            }
          });
        }, index * 250);
      }
    });

  }, [subjectAddress, subjectCoords, comparables, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    const google = (window as any).google;

    markersRef.current.forEach((marker, addr) => {
      const isHighlighted = highlightAddress === addr;
      marker.setAnimation(isHighlighted ? google.maps.Animation.BOUNCE : null);
      if (isHighlighted) {
        const iw = infoWindowsRef.current.get(addr);
        if (iw) iw.open(googleMapRef.current, marker);
      }
    });
  }, [highlightAddress, mapLoaded]);

  return (
    <div className="w-full h-full relative">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <TrendingUp className="text-blue-200 animate-pulse" size={32} />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};
