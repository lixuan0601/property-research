import React from 'react';
import { 
  Home, TrendingUp, MapPin, Lightbulb, Info, Users, GraduationCap, Scale
} from 'lucide-react';
import { SectionData } from '../types';
import { PropertyOverviewSection } from './PropertyOverviewSection';
import { PriceHistorySection } from './PriceHistorySection';
import { SchoolCatchmentSection } from './SchoolCatchmentSection';
import { SuburbProfileSection } from './SuburbProfileSection';
import { InvestmentInsightsSection } from './InvestmentInsightsSection';
import { formatContent } from '../utils/reportUtils';

interface IntelligenceCardProps {
  section: SectionData;
  searchAddress?: string;
  hideMap?: boolean;
  allSections?: SectionData[];
  subjectCoords?: { lat: number, lng: number };
}

const iconMap = {
  house: Home,
  chart: TrendingUp,
  map: MapPin,
  people: Lightbulb,
  info: Info,
  users: Users,
  school: GraduationCap,
  scale: Scale
};

/**
 * IntelligenceCard
 * Core container component for rendering modular property intelligence sections.
 * This component handles the conditional dispatching to specialized sub-sections 
 * based on the provided data payload.
 */
export const IntelligenceCard: React.FC<IntelligenceCardProps> = ({ 
  section, 
  searchAddress, 
  hideMap = false, 
  subjectCoords 
}) => {
  const Icon = iconMap[section.icon] || Info;

  const renderSectionContent = () => {
    // Specialized Data-Driven Sections
    if (section.propertyAttributes) {
      return <PropertyOverviewSection attrs={section.propertyAttributes} content={section.content} />;
    }
    
    if (section.priceHistory && section.priceHistory.length > 0) {
      return <PriceHistorySection history={section.priceHistory} content={section.content} />;
    }
    
    if (section.schools && section.schools.length > 0) {
      return <SchoolCatchmentSection schools={section.schools} />;
    }
    
    if (section.suburbProfile && section.suburbProfile.length > 0) {
      return <SuburbProfileSection subsections={section.suburbProfile} />;
    }
    
    if (section.investmentMetrics || section.comparables) {
      return (
        <InvestmentInsightsSection 
          metrics={section.investmentMetrics}
          comparables={section.comparables}
          searchAddress={searchAddress}
          hideMap={hideMap}
          subjectCoords={subjectCoords}
          content={section.content}
        />
      );
    }

    // Generic Fallback
    return (
      <div className="prose prose-slate prose-sm max-w-none flex-1">
        {formatContent(section.content)}
      </div>
    );
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col print:shadow-none print:border-slate-300">
      <header className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3 print:bg-slate-100 print:border-slate-300">
        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 print:shadow-none print:border print:border-slate-300" aria-hidden="true">
          <Icon size={20} strokeWidth={2} />
        </div>
        <h3 className="font-semibold text-slate-800 text-lg">{section.title}</h3>
      </header>
      <div className="p-6 flex-1 flex flex-col print:block">
        {renderSectionContent()}
      </div>
    </article>
  );
};
