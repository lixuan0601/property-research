
import { PropertyAttributes, SectionData } from '../types';

export const extractPropertyAttributes = (content: string): PropertyAttributes | undefined => {
  const attrs: PropertyAttributes = {};
  let found = false;
  const createRegex = (key: string) => new RegExp(`${key}(?:\\*\\*)?\\s*[:\\-]?\s*([^\\n]+)`, 'i');
  
  const patterns = {
    type: createRegex('Type'),
    beds: /(?:Bedrooms|Beds)(?:\*\*)?\s*[:\-]?\s*(\d+)/i,
    baths: /(?:Bathrooms|Baths)(?:\*\*)?\s*[:\-]?\s*(\d+)/i,
    living: /(?:Living Areas|Living)(?:\*\*)?\s*[:\-]?\s*(\d+)/i,
    carport: /(?:Carport Spaces|Carport|Parking)(?:\*\*)?\s*[:\-]?\s*(\d+)/i,
    land: /(?:Land Size|Land)(?:\*\*)?\s*[:\-]?\s*([^,\n]+)/i,
    buildingSize: /(?:Building Size)(?:\*\*)?\s*[:\-]?\s*([^,\n]+)/i,
    buildingCoverage: /(?:Building Coverage)(?:\*\*)?\s*[:\-]?\s*([^,\n]+)/i,
    groundElevation: /(?:Ground Elevation)(?:\*\*)?\s*[:\-]?\s*([^,\n]+)/i,
    roofHeight: /(?:Roof Height)(?:\*\*)?\s*[:\-]?\s*([^,\n]+)/i,
    solar: /(?:Solar Power|Solar Panel|Solar)(?:\*\*)?\s*[:\-]?\s*([^,\n]+)/i,
    features: /(?:Key Features|Features)(?:\*\*)?\s*[:\-]?\s*([^.\n]+)/i,
    lat: /(?:Latitude)(?:\*\*)?\s*[:\-]?\s*([\d.-]+)/i,
    lng: /(?:Longitude)(?:\*\*)?\s*[:\-]?\s*([\d.-]+)/i
  };

  const typeMatch = content.match(patterns.type);
  if (typeMatch) { attrs.type = typeMatch[1].trim(); found = true; }
  const bedsMatch = content.match(patterns.beds);
  if (bedsMatch) { attrs.beds = bedsMatch[1].trim(); found = true; }
  const bathsMatch = content.match(patterns.baths);
  if (bathsMatch) { attrs.baths = bathsMatch[1].trim(); found = true; }
  const livingMatch = content.match(patterns.living);
  if (livingMatch) { attrs.living = livingMatch[1].trim(); found = true; }
  const carportMatch = content.match(patterns.carport);
  if (carportMatch) { attrs.carport = carportMatch[1].trim(); found = true; }
  const landMatch = content.match(patterns.land);
  if (landMatch) { attrs.land = landMatch[1].trim(); found = true; }
  const buildSizeMatch = content.match(patterns.buildingSize);
  if (buildSizeMatch) { attrs.buildingSize = buildSizeMatch[1].trim(); found = true; }
  const buildCovMatch = content.match(patterns.buildingCoverage);
  if (buildCovMatch) { attrs.buildingCoverage = buildCovMatch[1].trim(); found = true; }
  const elevMatch = content.match(patterns.groundElevation);
  if (elevMatch) { attrs.groundElevation = elevMatch[1].trim(); found = true; }
  const roofMatch = content.match(patterns.roofHeight);
  if (roofMatch) { attrs.roofHeight = roofMatch[1].trim(); found = true; }
  const solarMatch = content.match(patterns.solar);
  if (solarMatch) { attrs.solar = solarMatch[1].trim(); found = true; }
  const latMatch = content.match(patterns.lat);
  if (latMatch) { attrs.lat = parseFloat(latMatch[1]); found = true; }
  const lngMatch = content.match(patterns.lng);
  if (lngMatch) { attrs.lng = parseFloat(lngMatch[1]); found = true; }
  
  const featuresMatch = content.match(patterns.features);
  if (featuresMatch) { 
    attrs.features = featuresMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
    found = true; 
  }

  return found ? attrs : undefined;
};

export const parsePropertyOverview = (content: string): Partial<SectionData> => ({
  title: 'Property Overview',
  icon: 'house',
  propertyAttributes: extractPropertyAttributes(content)
});