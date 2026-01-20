
import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { GroundingChunk } from '../types';

interface GroundingSourcesProps {
  chunks: GroundingChunk[];
}

export const GroundingSources: React.FC<GroundingSourcesProps> = ({ chunks }) => {
  // Filter out chunks that don't have web data
  const webSources = chunks.filter(c => c.web && c.web.uri && c.web.title);

  // Deduplicate sources by URI
  // Explicitly typing the Map key/value and casting the entry tuple fixes type inference for uniqueSources
  const uniqueSources = Array.from(
    new Map<string, GroundingChunk>(
      webSources.map((item) => [item.web!.uri!, item] as [string, GroundingChunk])
    ).values()
  );

  if (uniqueSources.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Globe size={16} />
        Verified Sources
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {uniqueSources.map((chunk, idx) => (
          <a
            key={idx}
            href={chunk.web!.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 transition-all duration-200"
          >
            <div className="mt-1 min-w-[16px]">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {idx + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate">
                {chunk.web!.title}
              </p>
              <p className="text-xs text-slate-400 group-hover:text-blue-400 truncate mt-0.5">
                {new URL(chunk.web!.uri!).hostname}
              </p>
            </div>
            <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
};