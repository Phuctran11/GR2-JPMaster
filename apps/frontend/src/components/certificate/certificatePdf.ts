import { toPdfText } from './certificateFormatters';

const escapePdfText = (value: string) => {
  return toPdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
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

export const createCertificatePdf = ({
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
