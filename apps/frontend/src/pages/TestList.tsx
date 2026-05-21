import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Container, Card } from '../components';
import { Text } from '../components/ui/Typography';
import { TestCard } from '../components/cards';
import { jlptExamAPI, type JlptExamSummary, type JlptSectionType } from '../services/api';

const levels = ['All', 'N1', 'N2', 'N3', 'N4', 'N5'];
const sections: Array<{ value: 'all' | JlptSectionType; label: string }> = [
  { value: 'all', label: 'All Sections' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
];

const sectionLabels: Record<JlptSectionType, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
};

const testImages = [
  'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80',
];

const guidelines = [
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

const scoringTable = [
  { level: 'N1', passmark: 'Practice pass: 60%', maxpoints: 'By exam' },
  { level: 'N2', passmark: 'Practice pass: 60%', maxpoints: 'By exam' },
  { level: 'N3', passmark: 'Practice pass: 60%', maxpoints: 'By exam' },
  { level: 'N4 / N5', passmark: 'Practice pass: 60%', maxpoints: 'By exam' },
];

const getExamType = (exam: JlptExamSummary) => {
  if (!exam.section_types.length) return 'JLPT Mock';
  if (exam.section_types.length === 1) return sectionLabels[exam.section_types[0]];
  return `${exam.section_types.length} Sections`;
};

export default function TestList() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedSection, setSelectedSection] = useState<'all' | JlptSectionType>('all');
  const [tests, setTests] = useState<JlptExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await jlptExamAPI.getExams({ level: selectedLevel, section_type: selectedSection });
        if (active) setTests(result.data);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Failed to load JLPT tests');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTests();
    return () => {
      active = false;
    };
  }, [selectedLevel, selectedSection]);

  const totalQuestions = useMemo(() => tests.reduce((sum, test) => sum + Number(test.question_count || 0), 0), [tests]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="seigaiha-pattern py-section-gap border-b border-outline-variant">
          <div className="max-w-[1280px] mx-auto px-margin-desktop">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 bg-primary-fixed text-on-primary-fixed text-label-md rounded mb-stack-sm">
                JLPT MOCK TESTS
              </span>
              <h1 className="font-display-lg text-display-lg text-primary mb-stack-md">JLPT Tests</h1>
              <Text variant="body-lg" color="on-surface-variant" className="leading-relaxed">
                Choose a JLPT level and section, then take a mock test generated from the exams managed by admins.
              </Text>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low border-b border-outline-variant sticky top-16 z-40">
          <div className="max-w-[1280px] mx-auto px-margin-desktop py-stack-md flex flex-col md:flex-row justify-between items-center gap-stack-md">
            <div className="flex flex-wrap gap-stack-sm items-center">
              <span className="text-label-md text-on-surface-variant mr-stack-sm">JLPT Levels:</span>
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
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
                onChange={(event) => setSelectedSection(event.target.value as 'all' | JlptSectionType)}
                className="bg-surface border border-outline-variant text-label-md rounded-lg px-4 py-1.5 focus:border-primary focus:ring-0"
              >
                {sections.map((section) => (
                  <option key={section.value} value={section.value}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="py-section-gap max-w-[1280px] mx-auto px-margin-desktop">
          <div className="flex items-center justify-between mb-section-gap">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Available Tests</h2>
              <div className="w-16 h-1 bg-secondary mt-2"></div>
            </div>
            <span className="text-label-md text-on-surface-variant">
              {loading ? 'Loading tests...' : `${tests.length} tests, ${totalQuestions} questions`}
            </span>
          </div>

          {error && <p className="mb-stack-md rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>}

          {!loading && !error && tests.length === 0 && (
            <Card className="border border-outline-variant bg-surface p-stack-lg text-center">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">No JLPT tests available</h3>
              <p className="mt-2 text-body-md text-on-surface-variant">Try another level or section, or ask an admin to publish questions for this test type.</p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {tests.map((test, index) => (
              <TestCard
                key={test.exam_id}
                title={test.title}
                level={test.jlpt_level}
                type={getExamType(test)}
                duration={test.duration_minutes ? `${test.duration_minutes} min` : `${test.question_count} questions`}
                image={testImages[index % testImages.length]}
                onStart={() => navigate(`/tests/${test.exam_id}`)}
              />
            ))}
          </div>
        </section>

        <section className="bg-surface-container py-section-gap overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center">
            <div>
              <h2 className="font-display-lg text-headline-lg text-primary mb-stack-lg">Test Taking Protocol</h2>
              <Text variant="body-lg" color="on-surface-variant" className="mb-stack-lg">
                Follow these guidelines to make your mock test results useful for study planning.
              </Text>
              <div className="space-y-stack-md">
                {guidelines.map((guideline) => (
                  <div key={guideline.number} className="flex items-start gap-stack-md">
                    <span className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold flex-shrink-0">
                      {guideline.number}
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface">{guideline.title}</h4>
                      <Text variant="body-md" color="on-surface-variant">
                        {guideline.description}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-white p-stack-lg border border-outline-variant shadow-sm relative">
              <h3 className="font-headline-sm text-headline-sm mb-stack-md text-primary">Practice Scoring</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="py-3 font-bold text-label-md">Level</th>
                      <th className="py-3 font-bold text-label-md">Pass Mark</th>
                      <th className="py-3 font-bold text-label-md">Max Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoringTable.map((row) => (
                      <tr key={row.level} className="border-b border-outline-variant/30">
                        <td className="py-3 text-body-md">{row.level}</td>
                        <td className="py-3 text-body-md">{row.passmark}</td>
                        <td className="py-3 text-body-md">{row.maxpoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        <section className="py-section-gap">
          <Container>
            <div className="rounded-lg border border-outline-variant bg-surface p-stack-lg text-center">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Ready for the next mock?</h2>
              <p className="mt-2 text-body-md text-on-surface-variant">Admins can add more JLPT exams and sections from the dashboard.</p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
