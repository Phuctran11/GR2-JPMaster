import type { JlptExamSummary, JlptSectionType } from '../../services/api';

export const TEST_LIST_PAGE_SIZE = 9;

export const testLevels = ['All', 'N1', 'N2', 'N3', 'N4', 'N5'];

export const testSections: Array<{ value: 'all' | JlptSectionType; label: string }> = [
  { value: 'all', label: 'All Sections' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
];

export const sectionLabels: Record<JlptSectionType, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
};

export const testImages = [
  'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80',
];

export const guidelines = [
  {
    number: '1',
    title: 'Time Management',
    description: 'Each test uses the duration configured by admins. Practice completing all selected sections within that time.',
  },
  {
    number: '2',
    title: 'Section Coverage',
    description: 'Mock exams may include one section or multiple JLPT sections depending on how the test was created.',
  },
  {
    number: '3',
    title: 'Academic Integrity',
    description: 'For accurate practice results, avoid dictionaries and translation tools while taking the test.',
  },
];

export const scoringTable = [
  { level: 'N1', passmark: 'Practice pass: 60%', maxpoints: 'By exam' },
  { level: 'N2', passmark: 'Practice pass: 60%', maxpoints: 'By exam' },
  { level: 'N3', passmark: 'Practice pass: 60%', maxpoints: 'By exam' },
  { level: 'N4 / N5', passmark: 'Practice pass: 60%', maxpoints: 'By exam' },
];

export const getExamType = (exam: JlptExamSummary) => {
  if (!exam.section_types.length) return 'JLPT Mock';
  if (exam.section_types.length === 1) return sectionLabels[exam.section_types[0]];
  return `${exam.section_types.length} Sections`;
};
