
import { PricePoint, SectionData } from '../types';

export const extractPriceHistory = (content: string): PricePoint[] => {
  const points: PricePoint[] = [];
  const lines = content.split('\n');
  
  // More flexible regex to handle variations in label, punctuation, and order
  const dateRegex = /(?:Date|Sold|Listed)?\s*[:\-]?\s*([\d-]{8,10})/i;
  const priceRegex = /Price\s*[:\-]?\s*([$kKmM\d.,\s]+)/i;
  const typeRegex = /Type\s*[:\-]?\s*([a-zA-Z]+)/i;
  const eventRegex = /Event\s*[:\-]?\s*([^,\n]+)/i;

  lines.forEach(line => {
    // Try to find a date first as it's our anchor
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      
      // Look for price in the same line
      const priceMatch = line.match(priceRegex);
      let price: number | null = null;
      let priceStr = 'N/A';
      
      if (priceMatch) {
        priceStr = priceMatch[1].trim();
        // Clean value: remove $ and commas
        let cleanVal = priceStr.replace(/[$,\s]/g, '').toLowerCase();
        
        let multiplier = 1;
        if (cleanVal.endsWith('k')) { 
          multiplier = 1000; 
          cleanVal = cleanVal.replace('k', ''); 
        } else if (cleanVal.endsWith('m')) { 
          multiplier = 1000000; 
          cleanVal = cleanVal.replace('m', ''); 
        }
        
        const parsed = parseFloat(cleanVal);
        if (!isNaN(parsed)) { 
          price = parsed * multiplier; 
        }
      } else {
        // Fallback: search for any $ amount if "Price:" label is missing
        const fallbackPriceMatch = line.match(/\$[\d,.]+(?:\s*[kKmM])?/);
        if (fallbackPriceMatch) {
          priceStr = fallbackPriceMatch[0];
          let cleanVal = priceStr.replace(/[$,\s]/g, '').toLowerCase();
          let multiplier = 1;
          if (cleanVal.endsWith('k')) { multiplier = 1000; cleanVal = cleanVal.replace('k', ''); }
          else if (cleanVal.endsWith('m')) { multiplier = 1000000; cleanVal = cleanVal.replace('m', ''); }
          const parsed = parseFloat(cleanVal);
          if (!isNaN(parsed)) price = parsed * multiplier;
        }
      }

      const typeMatch = line.match(typeRegex);
      const eventMatch = line.match(eventRegex);
      
      let type: 'sale' | 'rent' = 'sale';
      const lineLower = line.toLowerCase();
      
      if (lineLower.includes('rent') || lineLower.includes('lease') || (typeMatch && typeMatch[1].toLowerCase().includes('rent'))) {
        type = 'rent';
      }

      points.push({
        date: dateStr,
        price: price,
        formattedPrice: priceStr,
        event: eventMatch ? eventMatch[1].trim() : undefined,
        type: type
      });
    }
  });

  // Sort by date descending
  return points.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const parsePriceHistorySection = (content: string): Partial<SectionData> => ({
  title: 'Price History & Trends',
  icon: 'chart',
  priceHistory: extractPriceHistory(content)
});
