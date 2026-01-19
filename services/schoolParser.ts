import { School, SectionData } from '../types';

export const extractSchools = (content: string): School[] => {
  const schools: School[] = [];
  const lines = content.split('\n');
  const regex = /Name(?:\*\*|:)?\s*[:\-]?\s*(.+?)[,;]\s*Type(?:\*\*|:)?\s*[:\-]?\s*(.+?)[,;]\s*Rating(?:\*\*|:)?\s*[:\-]?\s*(.+?)(?:[,;]\s*Distance(?:\*\*|:)?\s*[:\-]?\s*(.+))?$/i;
  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      schools.push({
        name: match[1].trim(),
        type: match[2].trim(),
        rating: match[3].trim(),
        distance: match[4] ? match[4].trim() : undefined
      });
    }
  });
  return schools;
};

export const parseSchoolCatchment = (content: string): Partial<SectionData> => ({
  title: 'School Catchment & Ratings',
  icon: 'school',
  schools: extractSchools(content)
});