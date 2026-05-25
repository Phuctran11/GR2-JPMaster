import { Button } from '../Button';

export function CertificateActions({
  onBackToCourse,
  onDownloadPdf,
}: {
  onBackToCourse: () => void;
  onDownloadPdf: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={onBackToCourse} variant="secondary">
        Back to Course
      </Button>
      <Button onClick={onDownloadPdf}>
        Download PDF
      </Button>
    </div>
  );
}
