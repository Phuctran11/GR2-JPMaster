import type { Certificate } from '../../services/api';
import { createCertificatePdf } from '../../components/certificate/certificatePdf';
import {
  formatCourseDuration,
  formatDisplayDate,
  sanitizeFileName,
} from '../../components/certificate/certificateFormatters';

export function useCertificateDownload(certificate: Certificate | null) {
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

  return {
    handleDownloadPdf,
  };
}
