import React from 'react';
import { PricePoint } from '../types';
import { PriceChart } from './PriceChart';

interface PriceHistorySectionProps {
  history: PricePoint[];
  content: string;
}

export const PriceHistorySection: React.FC<PriceHistorySectionProps> = ({ history, content }) => (
  <div className="flex-1 flex flex-col print:block">
     <p className="text-sm text-slate-500 mb-4 italic">
       Visualizing market performance based on detected historical listing data.
     </p>
     <PriceChart data={history} rawContent={content} />
  </div>
);