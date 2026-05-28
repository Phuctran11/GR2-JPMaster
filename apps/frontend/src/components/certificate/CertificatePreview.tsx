import type { Certificate } from '../../services/api';
import { Heading } from '../ui/Typography';
import { formatCourseDuration, formatDisplayDate } from './certificateFormatters';

export function CertificatePreview({ certificate }: { certificate: Certificate }) {
  return (
    <article className="certificate-sheet relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border-[10px] border-primary bg-surface shadow-2xl">
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
              {certificate.lesson_count} lessons {' · '} {formatCourseDuration(certificate.course_duration)}
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
  );
}
