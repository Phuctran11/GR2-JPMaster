import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Footer, Button, Card, Container, Breadcrumbs } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import { certificateAPI, type Certificate } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const formatDisplayDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString();

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCourseDuration = (durationMinutes?: number | null) => {
  if (durationMinutes == null || durationMinutes <= 0) return 'Self-paced';

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} minutes`;
};

const toPdfText = (value: string) => {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
};

const escapePdfText = (value: string) => {
  return toPdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
};

const sanitizeFileName = (value: string) => {
  const safeName = toPdfText(value).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return safeName || 'certificate';
};

const splitPdfText = (value: string, maxLength: number) => {
  const words = toPdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : ['Course'];
};

const createCertificatePdf = ({
  learnerName,
  courseTitle,
  issuedDate,
  courseWork,
  certificateId,
}: {
  learnerName: string;
  courseTitle: string;
  issuedDate: string;
  courseWork: string;
  certificateId: string;
}) => {
  const pageWidth = 842;
  const titleLines = splitPdfText(courseTitle, 30).slice(0, 3);
  const learner = toPdfText(learnerName) || 'Learner';

  const text = (font: 'F1' | 'F2' | 'F3', size: number, x: number, y: number, value: string) => {
    return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`;
  };

  const estimateTextWidth = (font: 'F1' | 'F2' | 'F3', size: number, value: string) => {
    const widthFactor = font === 'F2' ? 0.56 : 0.5;
    return toPdfText(value).length * size * widthFactor;
  };

  const centerText = (font: 'F1' | 'F2' | 'F3', size: number, y: number, value: string, maxWidth = 720) => {
    const cleanValue = toPdfText(value);
    let fontSize = size;
    let estimatedWidth = estimateTextWidth(font, fontSize, cleanValue);

    while (estimatedWidth > maxWidth && fontSize > 12) {
      fontSize -= 1;
      estimatedWidth = estimateTextWidth(font, fontSize, cleanValue);
    }

    const x = Math.max(54, (pageWidth - estimatedWidth) / 2);
    return text(font, fontSize, x, y, cleanValue);
  };

  const metadataCard = (x: number, label: string, value: string) => [
    '0.99 0.98 0.94 rg',
    `${x} 112 190 66 re f`,
    '0.86 0.63 0.00 RG',
    `${x} 112 190 66 re S`,
    '0.00 0.14 0.44 rg',
    text('F2', 11, x + 18, 153, label),
    '0.55 0.39 0.00 rg',
    text('F1', 14, x + 18, 130, value),
  ];

  const titleStartY = titleLines.length === 1 ? 272 : titleLines.length === 2 ? 286 : 300;

  const content = [
    '0.98 0.96 0.91 rg 0 0 842 595 re f',
    '0.00 0.14 0.44 rg 0 0 842 34 re f',
    '0.86 0.63 0.00 rg 0 561 842 34 re f',
    '0.00 0.14 0.44 RG 34 34 774 527 re S',
    '0.86 0.63 0.00 RG 54 56 734 483 re S',
    '0.93 0.82 0.42 rg 64 507 116 12 re f',
    '0.93 0.82 0.42 rg 662 76 116 12 re f',
    '0.00 0.14 0.44 rg',
    centerText('F2', 17, 500, 'JPMaster Academy'),
    centerText('F2', 41, 451, 'Certificate of Completion', 700),
    '0.86 0.63 0.00 rg 321 425 200 5 re f',
    '0.55 0.39 0.00 rg',
    centerText('F1', 15, 384, 'This certifies that'),
    '0.86 0.63 0.00 rg',
    centerText('F2', 46, 337, learner, 660),
    '0.55 0.39 0.00 rg',
    centerText('F1', 15, 299, 'has successfully completed the course'),
    '0.00 0.14 0.44 rg',
    ...titleLines.map((line, index) => centerText('F2', 27, titleStartY - index * 32, line, 670)),
    ...metadataCard(86, 'ISSUED ON', issuedDate),
    ...metadataCard(326, 'COURSE WORK', courseWork),
    ...metadataCard(566, 'CERTIFICATE ID', certificateId),
    '0.00 0.14 0.44 rg 96 78 220 2 re f',
    text('F2', 16, 96, 52, 'JPMaster Academic Board'),
    text('F1', 11, 96, 35, 'Authorized Signature'),
    '0.93 0.82 0.42 rg 662 34 104 104 re f',
    '0.00 0.14 0.44 RG 674 46 80 80 re S',
    '0.00 0.14 0.44 rg',
    text('F2', 20, 684, 91, 'VERIFIED'),
    text('F1', 10, 694, 73, 'JPMaster'),
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

export default function Certification() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
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

    fetchCertificateCourse();
  }, [addToast, authLoading, courseId, navigate, user]);

  const handleDownloadPdf = () => {
    if (!certificate) return;

    const pdf = createCertificatePdf({
      learnerName: certificate.username,
      courseTitle: certificate.course_title,
      issuedDate: formatDisplayDate(certificate.issued_at),
      courseWork: `${certificate.lesson_count} lessons - ${formatCourseDuration(certificate.course_duration)}`,
      certificateId: certificate.certificate_code,
    });
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFileName(certificate.course_title)}-certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'My Learning', path: '/courses' },
    { label: 'Certification' },
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant">Preparing certificate...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <Breadcrumbs items={breadcrumbs} />
        <main className="flex-1">
          <Container className="py-section-gap">
            <Card className="p-8 text-center border border-outline-variant">
              <Heading level="h1" size="headline-lg" className="mb-3">
                Certificate unavailable
              </Heading>
              <Text variant="body-md" color="on-surface-variant" className="mb-6">
                Complete every lesson and pass the final test before downloading your certificate.
              </Text>
              <Button onClick={() => navigate(courseId ? `/courses/${courseId}` : '/courses')}>
                Back to Course
              </Button>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }

            body {
              background: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .no-print {
              display: none !important;
            }

            .certificate-print-area {
              min-height: 100vh !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            .certificate-container {
              max-width: none !important;
              padding: 0 !important;
            }

            .certificate-sheet {
              width: 297mm !important;
              height: 210mm !important;
              margin: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

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
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(`/courses/${certificate.course_id}`)} variant="secondary">
                  Back to Course
                </Button>
                <Button onClick={handleDownloadPdf}>
                  Download PDF
                </Button>
              </div>
            </div>

            <article className="certificate-sheet relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border-[10px] border-primary bg-white shadow-2xl">
              <div className="absolute inset-0 border-[3px] border-secondary m-6 rounded-[1.25rem]"></div>
              <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-primary/10"></div>
              <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-secondary/15"></div>
              <div className="absolute left-10 top-10 text-primary/10">
                <span className="material-symbols-outlined text-[140px]">workspace_premium</span>
              </div>
              <div className="relative z-10 flex min-h-[680px] flex-col items-center justify-between px-10 py-14 text-center md:px-20">
                <div>
                  <p className="mb-4 text-label-md font-black uppercase tracking-[0.35em] text-secondary">
                    JPMaster Academy
                  </p>
                  <Heading level="h2" size="display-lg" className="text-primary">
                    Certificate of Completion
                  </Heading>
                  <div className="mx-auto mt-6 h-1 w-40 rounded-full bg-secondary"></div>
                </div>

                <div className="max-w-4xl">
                  <p className="mb-5 text-title-lg text-on-surface-variant">
                    This certifies that
                  </p>
                  <h3 className="font-display-lg text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-tight text-primary">
                    {certificate.username}
                  </h3>
                  <p className="mx-auto mt-6 max-w-3xl text-title-lg leading-relaxed text-on-surface-variant">
                    has successfully completed the course
                  </p>
                  <h4 className="mt-4 text-[clamp(1.75rem,4vw,3.5rem)] font-bold leading-tight text-on-surface">
                    {certificate.course_title}
                  </h4>
                </div>

                <div className="grid w-full max-w-4xl grid-cols-1 gap-4 text-left md:grid-cols-3">
                  <div className="rounded-2xl border border-outline-variant bg-primary-fixed/20 p-5">
                    <p className="text-label-sm font-black uppercase tracking-wide text-on-surface-variant">Issued on</p>
                    <p className="mt-2 text-title-md font-bold text-primary">{formatDisplayDate(certificate.issued_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-secondary-container/30 p-5">
                    <p className="text-label-sm font-black uppercase tracking-wide text-on-surface-variant">Course work</p>
                    <p className="mt-2 text-title-md font-bold text-primary">
                      {certificate.lesson_count} lessons · {formatCourseDuration(certificate.course_duration)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                    <p className="text-label-sm font-black uppercase tracking-wide text-on-surface-variant">Certificate ID</p>
                    <p className="mt-2 text-title-md font-bold text-primary">{certificate.certificate_code}</p>
                  </div>
                </div>

                <div className="flex w-full max-w-4xl flex-col gap-8 pt-6 md:flex-row md:items-end md:justify-between">
                  <div className="text-left">
                    <div className="mb-3 h-px w-64 bg-primary"></div>
                    <p className="text-title-md font-bold text-on-surface">JPMaster Academic Board</p>
                    <p className="text-label-md text-on-surface-variant">Authorized Signature</p>
                  </div>
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-secondary bg-secondary-container text-primary shadow-xl">
                    <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </Container>
        </section>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}
