
export interface SearchResult {
  text: string;
  groundingChunks: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface SectionProgress {
  key: string;
  label: string;
  status: 'pending' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
}

export interface PricePoint {
  date: string;
  price: number | null;
  formattedPrice: string;
  event?: string;
  type: 'sale' | 'rent';
}

export interface PropertyAttributes {
  type?: string;
  beds?: string;
  baths?: string;
  living?: string;
  land?: string;
  carport?: string;
  solar?: string;
  buildingSize?: string;
  buildingCoverage?: string;
  groundElevation?: string;
  roofHeight?: string;
  features?: string[];
  lat?: number;
  lng?: number;
}

export interface School {
  name: string;
  type: string;
  rating: string;
  distance?: string;
}

export interface InvestmentMetric {
  label: string;
  value: string;
  suburbAverage: string;
  comparison: string;
}

export interface Comparable {
  address: string;
  soldPrice: string;
  soldDate: string;
  features: string;
  lat?: number;
  lng?: number;
}

export interface SuburbSubsection {
  title: string;
  content: string;
}

export interface SectionData {
  title: string;
  content: string;
  icon: 'house' | 'chart' | 'map' | 'people' | 'info' | 'users' | 'school' | 'scale';
  priceHistory?: PricePoint[];
  propertyAttributes?: PropertyAttributes;
  schools?: School[];
  investmentMetrics?: InvestmentMetric[];
  comparables?: Comparable[];
  suburbProfile?: SuburbSubsection[];
}

export interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: SearchResult | null;
  error?: string;
  coordinates?: { lat: number, lng: number };
}

export type ViewMode = 'talk' | 'insight' | 'compare';

export interface AgentSearchResult {
  answer: string;
  sources: GroundingChunk[];
}

export interface PropertyData {
  id: string;
  address: string;
  status: string;
  price?: string;
  date?: string;
  features?: string; 
  landSize?: string;
  description?: string; 
  rawItems: string[];
  // Extracted details for comparison
  beds?: string;
  baths?: string;
  cars?: string;
  type?: string;
  // Specific features
  solar?: boolean;
  battery?: boolean;
  pool?: boolean;
  tennis?: boolean;
  deck?: boolean;
  balcony?: boolean;
  shed?: boolean;
  grannyFlat?: boolean;
  // Direct listing links
  domainUrl?: string;
  realestateUrl?: string;
}
