import type { Application } from '@/types/application';

// The database applies the same rule daily. This keeps the browser-local demo consistent.
export const AUTO_GHOST_DAYS = 30;
export function applyDemoAutoGhost(applications: Application[], now = new Date()): Application[] {
  const cutoff = now.getTime() - AUTO_GHOST_DAYS * 24 * 60 * 60 * 1000;
  return applications.map((application) => {
    const changedAt = application.status_changed_at || application.updated_at;
    if (
      (application.status === 'Applied' || application.status === 'Waiting') &&
      new Date(changedAt).getTime() <= cutoff
    ) {
      return {
        ...application,
        status: 'Ghosted',
        status_changed_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
    }
    return { ...application, status_changed_at: changedAt };
  });
}
