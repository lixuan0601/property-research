import { SectionData } from '../types';
import { parsePropertyOverview, extractPropertyAttributes } from './propertyParser';
import { parsePriceHistorySection, extractPriceHistory } from './priceParser';
import { parseSchoolCatchment, extractSchools } from './schoolParser';
import { parseInvestmentInsights, extractInvestmentMetrics, extractComparables } from './investmentParser';
import { parseSuburbProfile } from './suburbParser';

export const parseAnalysisSections = (text: string): SectionData[] => {
  const sections: SectionData[] = [];
  const parts = text.split(/(?:\r?\n|^)##\s+/);

  parts.forEach(part => {
    const partTrimmed = part.trim();
    if (!partTrimmed) return;

    const lines = partTrimmed.split('\n');
    const titleLine = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    if (!content) return;

    let parsedSection: Partial<SectionData> | null = null;

    if (titleLine.includes('Property Overview')) {
      parsedSection = parsePropertyOverview(content);
    } else if (titleLine.includes('Price History')) {
      parsedSection = parsePriceHistorySection(content);
    } else if (titleLine.includes('Suburb Profile') || titleLine.includes('Demographics')) {
      parsedSection = parseSuburbProfile(content);
    } else if (titleLine.includes('School Catchment')) {
      parsedSection = parseSchoolCatchment(content);
    } else if (titleLine.includes('Investment') || titleLine.includes('Value')) {
      parsedSection = parseInvestmentInsights(content);
    }

    if (parsedSection && titleLine.length > 0 && titleLine !== text.trim()) {
      sections.push({
        title: parsedSection.title || titleLine,
        content: content,
        icon: parsedSection.icon || 'info',
        ...parsedSection
      } as SectionData);
    }
  });

  return sections;
};

// Re-export specific low-level parsers for backward compatibility
export { 
  extractPriceHistory as parsePriceHistory, 
  extractSchools as parseSchools, 
  extractComparables as parseComparables, 
  extractInvestmentMetrics as parseInvestmentMetrics, 
  extractPropertyAttributes as parsePropertyAttributes 
};