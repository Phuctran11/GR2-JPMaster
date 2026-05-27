import { useEffect, useMemo, useState } from 'react';
import { jlptExamAPI, type JlptExamSummary, type JlptSectionType } from '../../services/api';
import { TEST_LIST_PAGE_SIZE } from '../../components/testList/testListData';

export function useJlptTestList() {
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedSection, setSelectedSection] = useState<'all' | JlptSectionType>('all');
  const [page, setPage] = useState(1);
  const [tests, setTests] = useState<JlptExamSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await jlptExamAPI.getExams({
          level: selectedLevel,
          section_type: selectedSection,
          limit: TEST_LIST_PAGE_SIZE,
          offset: (page - 1) * TEST_LIST_PAGE_SIZE,
        });
        if (active) {
          setTests(result.data);
          setTotalCount(result.total_count ?? result.count);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load JLPT tests');
          setTotalCount(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTests();
    return () => {
      active = false;
    };
  }, [selectedLevel, selectedSection, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedLevel, selectedSection]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / TEST_LIST_PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [page, totalCount]);

  const totalQuestions = useMemo(
    () => tests.reduce((sum, test) => sum + Number(test.question_count || 0), 0),
    [tests],
  );

  return {
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
  };
}
