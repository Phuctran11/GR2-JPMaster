import { Card } from '../index';
import { Heading } from '../ui/Typography';
import type { UserProfile } from '../../services/api';
import { formatDate } from './profileUtils';

export function ProfileHero({
  profile,
  completedCourseCount,
  activeCourseCount,
}: {
  profile: UserProfile;
  completedCourseCount: number;
  activeCourseCount: number;
}) {
  return (
    <Card className="overflow-hidden border border-outline-variant bg-surface">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <div className="bg-gradient-to-br from-primary via-[#2563eb] to-secondary p-6 text-on-primary md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.username} avatar`}
                className="h-24 w-24 shrink-0 rounded-full border-4 border-white/40 bg-white/15 object-cover shadow-xl"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/40 bg-white/15 text-display-md font-bold shadow-xl">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-label-md font-black uppercase tracking-wide text-white/75">Learner profile</p>
              <Heading level="h1" size="headline-lg" className="mt-2 text-on-primary">
                {profile.username}
              </Heading>
              <p className="mt-2 break-all text-label-md text-white/85">{profile.email}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="rounded-xl border border-outline-variant bg-primary-fixed/20 p-4">
            <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">Completed</p>
            <p className="mt-2 text-headline-md font-bold text-primary">{completedCourseCount}</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-secondary-container/30 p-4">
            <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">In progress</p>
            <p className="mt-2 text-headline-md font-bold text-primary">{activeCourseCount}</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">Member since</p>
            <p className="mt-2 text-title-md font-bold text-on-surface">{formatDate(profile.created_at)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
