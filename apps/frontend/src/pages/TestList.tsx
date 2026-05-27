import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../components';
import {
  TestFilterBar,
  TestGridSection,
  TestListHero,
  TestProtocolSection,
} from '../components/testList';
import { useJlptTestList } from '../hooks/jlpt/useJlptTestList';

export default function TestList() {
  const navigate = useNavigate();
  const {
    error,
    loading,
    page,
    selectedLevel,
    selectedSection,
    setPage,
    setSelectedLevel,
    setSelectedSection,
    tests,
    totalCount,
    totalQuestions,
  } = useJlptTestList();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <TestListHero />
        <TestFilterBar
          selectedLevel={selectedLevel}
          selectedSection={selectedSection}
          onLevelChange={setSelectedLevel}
          onSectionChange={setSelectedSection}
        />
        <TestGridSection
          error={error}
          loading={loading}
          page={page}
          tests={tests}
          totalCount={totalCount}
          totalQuestions={totalQuestions}
          onPageChange={setPage}
          onStartTest={(examId) => navigate(`/tests/${examId}`)}
        />
        <TestProtocolSection />
      </main>
      <Footer />
    </div>
  );
}
