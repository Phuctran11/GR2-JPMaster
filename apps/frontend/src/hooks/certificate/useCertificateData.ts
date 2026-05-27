import { useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { certificateAPI, type Certificate } from '../../services/api';
import type { User } from '../../contexts/AuthContext';

export function useCertificateData({
  courseId,
  user,
  authLoading,
  navigate,
  addToast,
}: {
  courseId?: string;
  user: User | null;
  authLoading: boolean;
  navigate: NavigateFunction;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}) {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      addToast('Please log in to view your certificate', 'error');
      navigate('/login');
      return;
    }

    if (!courseId) {
      navigate('/courses');
      return;
    }

    const fetchCertificateCourse = async () => {
      try {
        setLoading(true);
        const result = await certificateAPI.getCourseCertificate(parseInt(courseId));
        setCertificate(result.data);
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Failed to load certificate', 'error');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    void fetchCertificateCourse();
  }, [addToast, authLoading, courseId, navigate, user]);

  return {
    certificate,
    loading,
  };
}
