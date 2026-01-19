import { SectionData, SuburbSubsection } from '../types';

export const parseSuburbProfile = (content: string): Partial<SectionData> => {
  const suburbProfile: SuburbSubsection[] = [];
  const rawSubsections = content.split(/(?:\r?\n|^)(?:###|\*\*)\s+/);
  rawSubsections.forEach(s => {
     const trimmed = s.trim();
     if (!trimmed) return;
     const sLines = trimmed.split('\n');
     const subTitle = sLines[0].replace(/\*\*/g, '').trim();
     const subContent = sLines.slice(1).join('\n').trim();
     if (subTitle && subContent && subTitle.length < 100) { 
       suburbProfile.push({ title: subTitle, content: subContent }); 
     }
  });
  return {
    title: 'Suburb Profile',
    icon: 'map',
    suburbProfile: suburbProfile.length > 0 ? suburbProfile : undefined
  };
};