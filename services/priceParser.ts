import { PricePoint, SectionData } from '../types';

export const extractPriceHistory = (content: string): PricePoint[] => {
  const points: PricePoint[] = [];
  const lines = content.split('\n');
  const dateRegex = /Date(?:\*\*|:)?\s*[:\-]?\s*([\d-]{8,10})/i;
  const priceRegex = /Price(?:\*\*|:)?\s*[:\-]?\s*(.+?)(?:,\s*(?:Type|Event)|$)/i;
  const typeRegex = /Type(?:\*\*|:)?\s*[:\-]?\s*([a-zA-Z]+)/i;
  const eventRegex = /Event(?:\*\*|:)?\s*[:\-]?\s*([^,\n]+)/i;

  lines.forEach(line => {
    const dateMatch = line.match(dateRegex);
    const priceMatch = line.match(priceRegex);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      let price: number | null = null;
      let priceStr = 'N/A';
      if (priceMatch) {
        priceStr = priceMatch[1].trim();
        let cleanVal = priceStr.replace(/[$,]/g, '').toLowerCase().trim();
        let multiplier = 1;
        if (cleanVal.endsWith('k')) { multiplier = 1000; cleanVal = cleanVal.replace('k', ''); }
        else if (cleanVal.endsWith('m')) { multiplier = 1000000; cleanVal = cleanVal.replace('m', ''); }
        const parsed = parseFloat(cleanVal);
        if (!isNaN(parsed)) { price = parsed * multiplier; }
      }
      const typeMatch = line.match(typeRegex);
      const eventMatch = line.match(eventRegex);
      let type: 'sale' | 'rent' = 'sale';
      const typeStr = typeMatch ? typeMatch[1].toLowerCase() : '';
      const eventStr = eventMatch ? eventMatch[1].toLowerCase() : '';
      if (typeStr.includes('rent') || eventStr.includes('rent') || eventStr.includes('lease')) { type = 'rent'; }
      points.push({
        date: dateStr,
        price: price,
        formattedPrice: priceStr,
        event: eventMatch ? eventMatch[1].trim() : undefined,
        type: type
      });
    }
  });
  return points;
};

export const parsePriceHistorySection = (content: string): Partial<SectionData> => ({
  title: 'Price History & Trends',
  icon: 'chart',
  priceHistory: extractPriceHistory(content)
});