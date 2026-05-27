export function CertificatePrintStyles() {
  return (
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
  );
}
