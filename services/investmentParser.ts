import { Comparable, InvestmentMetric, SectionData } from '../types';

export const extractComparables = (content: string): Comparable[] => {
  const comparables: Comparable[] = [];
  const lines = content.split('\n');
  const regex = /Address(?:\*\*|:)?\s*[:\-]?\s*(.+?)[,;]\s*Sold_Price(?:\*\*|:)?\s*[:\-]?\s*(.+?)[,;]\s*Sold_Date(?:\*\*|:)?\s*[:\-]?\s*(.+?)[,;]\s*Features(?:\*\*|:)?\s*[:\-]?\s*(.+?)(?:[,;]\s*Lat(?:\*\*|:)?\s*[:\-]?\s*([\d.-]+))?(?:[,;]\s*Lng(?:\*\*|:)?\s*[:\-]?\s*([\d.-]+))?$/i;
  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      comparables.push({
        address: match[1].trim(),
        soldPrice: match[2].trim(),
        soldDate: match[3].trim(),
        features: match[4].trim(),
        lat: match[5] ? parseFloat(match[5]) : undefined,
        lng: match[6] ? parseFloat(match[6]) : undefined
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