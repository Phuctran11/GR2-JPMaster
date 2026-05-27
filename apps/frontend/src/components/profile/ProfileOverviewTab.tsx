import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button, Card } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { EnrolledCourse } from '../../services/api';
import { formRules, getFieldError } from '../../utils/formValidation';
import { formatDate } from './profileUtils';
import type { ProfileFormValues } from './profileTypes';

export function ProfileOverviewTab({
  avatarUrl,
  username,
  saving,
  avatarUploading,
  completedCourses,
  registerProfile,
  profileErrors,
  onSubmit,
  onAvatarUpload,
  onRemoveAvatar,
  onViewCertificate,
}: {
  avatarUrl: string;
  username: string;
  saving: boolean;
  avatarUploading: boolean;
  completedCourses: EnrolledCourse[];
  registerProfile: UseFormRegister<ProfileFormValues>;
  profileErrors: FieldErrors<ProfileFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onAvatarUpload: (file: File) => void;
  onRemoveAvatar: () => void;
  onViewCertificate: (courseId: number) => void;
}) {
  return (
    <>
      <Card className="p-6 md:p-8 border border-outline-variant">
        <div className="mb-6">
          <Heading level="h2" size="headline-lg" className="text-primary">
            Basic Information
          </Heading>
          <Text variant="body-md" color="on-surface-variant" className="mt-2">
            Update your display name and contact email.
          </Text>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-label-lg font-bold text-on-surface">
              Avatar
            </label>
            <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 sm:flex-row sm:items-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="h-20 w-20 shrink-0 rounded-full border border-outline-variant bg-surface object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface text-headline-md font-bold text-primary">
                  {username.trim().charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-3">
                <input
                  {...registerProfile('avatarUrl', formRules.optionalUrl<ProfileFormValues>())}
                  className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors focus:border-primary"
                  placeholder="https://example.com/avatar.jpg"
                />
                {profileErrors.avatarUrl && <p className="text-label-sm font-semibold text-error">{getFieldError(profileErrors.avatarUrl)}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md font-bold text-on-primary hover:bg-primary/90 ${avatarUploading ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                    <span className="material-symbols-outlined text-[18px]">{avatarUploading ? 'hourglass_empty' : 'upload'}</span>
                    {avatarUploading ? 'Uploading...' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={avatarUploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onAvatarUpload(file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={onRemoveAvatar}
                      disabled={saving || avatarUploading}
                      className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-bold text-error hover:bg-error/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="username" className="mb-2 block text-label-lg font-bold text-on-surface">
              Username
            </label>
            <input
              id="username"
              {...registerProfile('username', formRules.required<ProfileFormValues>('Username'))}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
            />
            {profileErrors.username && <p className="mt-2 text-label-sm font-semibold text-error">{getFieldError(profileErrors.username)}</p>}
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-label-lg font-bold text-on-surface">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...registerProfile('email', formRules.email<ProfileFormValues>())}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
            />
            {profileErrors.email && <p className="mt-2 text-label-sm font-semibold text-error">{getFieldError(profileErrors.email)}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 md:p-8 border border-outline-variant">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Heading level="h2" size="headline-lg" className="text-primary">
              Certifications
            </Heading>
            <Text variant="body-md" color="on-surface-variant" className="mt-2">
              Certificates earned from completed courses.
            </Text>
          </div>
          <Link to="/courses" className="text-label-md font-bold text-primary hover:underline">
            View My Learning
          </Link>
        </div>

        {completedCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
            <span className="material-symbols-outlined text-[56px] text-outline">workspace_premium</span>
            <Text variant="body-md" color="on-surface-variant" className="mt-3">
              Complete a course to unlock your first certificate.
            </Text>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {completedCourses.map((enrollment) => (
              <div
                key={enrollment.enrollment_id}
                className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary-container/40 to-surface p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-label-sm font-black uppercase tracking-wide text-secondary">Certified Course</p>
                    <h3 className="mt-2 text-title-lg font-bold text-on-surface">{enrollment.course.title}</h3>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-3 text-label-md">
                  <div className="rounded-xl bg-surface/70 p-3">
                    <p className="font-bold text-on-surface-variant">Progress</p>
                    <p className="text-primary font-bold">{enrollment.progress_percent ?? 100}%</p>
                  </div>
                  <div className="rounded-xl bg-surface/70 p-3">
                    <p className="font-bold text-on-surface-variant">Enrolled</p>
                    <p className="text-primary font-bold">{formatDate(enrollment.enrollment_date)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onViewCertificate(enrollment.course_id)}
                  className="w-full"
                >
                  View Certificate
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
