export interface SearchResult {
  text: string;
  groundingChunks: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
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
}