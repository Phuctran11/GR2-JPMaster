import { useNavigate, useParams } from 'react-router-dom';
import { Header, Footer, Container, Breadcrumbs } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import {
  CertificateActions,
  CertificateLoadingPage,
  CertificatePreview,
  CertificatePrintStyles,
  CertificateUnavailablePage,
} from '../components/certificate';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCertificateData } from '../hooks/certificate/useCertificateData';
import { useCertificateDownload } from '../hooks/certificate/useCertificateDownload';

export default function Certification() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const { certificate, loading } = useCertificateData({
    courseId,
    user,
    authLoading,
    navigate,
    addToast,
  });
  const { handleDownloadPdf } = useCertificateDownload(certificate);
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'My Learning', path: '/courses' },
    { label: 'Certification' },
  ];

  if (loading || authLoading) {
    return <CertificateLoadingPage />;
  }

  if (!certificate) {
    return (
      <CertificateUnavailablePage
        breadcrumbs={breadcrumbs}
        onBackToCourse={() => navigate(courseId ? `/courses/${courseId}` : '/courses')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CertificatePrintStyles />

      <div className="no-print">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <main className="flex-1">
        <section className="certificate-print-area bg-surface-container-low py-section-gap">
          <Container className="certificate-container">
            <div className="no-print mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Heading level="h1" size="headline-lg" className="text-primary">
                  Course Certification
                </Heading>
                <Text variant="body-md" color="on-surface-variant" className="mt-2">
                  Preview your certificate and download it as a PDF.
                </Text>
              </div>
              <CertificateActions
                onBackToCourse={() => navigate(`/courses/${certificate.course_id}`)}
                onDownloadPdf={handleDownloadPdf}
              />
            </div>

            <CertificatePreview certificate={certificate} />
          </Container>
        </section>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}
