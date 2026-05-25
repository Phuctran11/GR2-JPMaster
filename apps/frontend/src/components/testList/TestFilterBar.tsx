import type { JlptSectionType } from '../../services/api';
import { testLevels, testSections } from './testListData';

interface TestFilterBarProps {
  selectedLevel: string;
  selectedSection: 'all' | JlptSectionType;
  onLevelChange: (level: string) => void;
  onSectionChange: (section: 'all' | JlptSectionType) => void;
}

export function TestFilterBar({
  selectedLevel,
  selectedSection,
  onLevelChange,
  onSectionChange,
}: TestFilterBarProps) {
  return (
    <section className="bg-surface-container-low border-b border-outline-variant sticky top-16 z-40">
      <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md flex flex-col md:flex-row justify-between items-center gap-stack-md">
        <div className="flex flex-wrap gap-stack-sm items-center">
          <span className="text-label-md text-on-surface-variant mr-stack-sm">JLPT Levels:</span>
          {testLevels.map((level) => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              className={`px-4 py-1.5 rounded-full text-label-md transition-colors ${
                selectedLevel === level
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface border border-outline-variant hover:border-primary'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="h-8 w-px bg-outline-variant hidden md:block"></div>
        <div className="flex flex-wrap gap-stack-sm items-center">
          <span className="text-label-md text-on-surface-variant mr-stack-sm">Section:</span>
          <select
            value={selectedSection}
            onChange={(event) => onSectionChange(event.target.value as 'all' | JlptSectionType)}
            className="bg-surface border border-outline-variant text-label-md rounded-lg px-4 py-1.5 focus:border-primary focus:ring-0"
          >
            {testSections.map((section) => (
              <option key={section.value} value={section.value}>
                {section.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
