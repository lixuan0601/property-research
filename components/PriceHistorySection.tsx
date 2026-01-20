
import React from 'react';
import { PricePoint } from '../types';
import { PriceChart } from './PriceChart';

interface PriceHistorySectionProps {
  history: PricePoint[];
  content: string;
}

export const PriceHistorySection: React.FC<PriceHistorySectionProps> = ({ history, content }) => {
  return (
    <div className="flex-1 animate-fade-in">
      <PriceChart data={history} rawContent={content} />
    </div>
  );
};
