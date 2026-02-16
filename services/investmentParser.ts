
import { Comparable, InvestmentMetric, SectionData } from '../types';

export const extractComparables = (content: string): Comparable[] => {
  const comparables: Comparable[] = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed.toLowerCase().includes('address')) return;

    // Use flexible matching for each field to handle various delimiters and formats
    const address = trimmed.match(/Address\s*[:\-]?\s*(.+?)(?=[,;]\s*(?:Sold_Price|Price)|$)/i)?.[1]?.trim();
    const price = trimmed.match(/(?:Sold_Price|Price)\s*[:\-]?\s*(.+?)(?=[,;]\s*(?:Sold_Date|Date)|$)/i)?.[1]?.trim();
    const date = trimmed.match(/(?:Sold_Date|Date)\s*[:\-]?\s*(.+?)(?=[,;]\s*Features|$)/i)?.[1]?.trim();
    const features = trimmed.match(/Features\s*[:\-]?\s*(.+?)(?=[,;]\s*Lat|$)/i)?.[1]?.trim();
    const lat = trimmed.match(/Lat\s*[:\-]?\s*([\d.-]+)/i)?.[1];
    const lng = trimmed.match(/Lng\s*[:\-]?\s*([\d.-]+)/i)?.[1];

    if (address && price) {
      comparables.push({
        address,
        soldPrice: price,
        soldDate: date || 'N/A',
        features: features || 'N/A',
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined
      });
    }
  });
  
  return comparables;
};

export const extractInvestmentMetrics = (content: string): InvestmentMetric[] => {
  const metrics: InvestmentMetric[] = [];
  const regex = /Metric(?:\*\*|:)?\s*[:\-]?\s*(.+?)[,;]\s*Property(?:\*\*|:)?\s*[:\-]?\s*(.+?)[,;]\s*Suburb_Average(?:\*\*|:)?\s*[:\-]?\s*(.+?)[,;]\s*Comparison(?:\*\*|:)?\s*[:\-]?\s*(.+)/i;
  content.split('\n').forEach(line => {
     const match = line.match(regex);
     if (match) {
       metrics.push({
         label: match[1].trim(),
         value: match[2].trim(),
         suburbAverage: match[3].trim(),
         comparison: match[4].trim()
       });
     }
  });
  return metrics;
};

export const parseInvestmentInsights = (content: string): Partial<SectionData> => ({
  title: 'Investment Insights',
  icon: 'people',
  investmentMetrics: extractInvestmentMetrics(content),
  comparables: extractComparables(content)
});
