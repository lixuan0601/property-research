import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

interface MultiMarkerMapProps {
  subjectAddress: string;
  subjectCoords?: { lat: number; lng: number };
  comparables: { address: string; label?: string; lat?: number; lng?: number }[];
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

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const google = (window as any).google;
    
    if (!googleMapRef.current) {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        zoom: 14,
        center: subjectCoords || { lat: -33.8688, lng: 151.2093 },
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

    comparables.forEach(comp => {
      geocoder.geocode({ address: comp.address }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {
          const pos = results[0].geometry.location.toJSON();
          addMarkerToMap(comp.address, pos, false, comp.label);
        }
      });
    });

  }, [subjectAddress, subjectCoords, comparables, mapLoaded]);

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