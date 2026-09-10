'use client';
import { useId, useState } from 'react';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { STATUSES, type Application, type ApplicationInput } from '@/types/application';
import { applicationSchema, localDate } from '@/lib/applications';
import { useApplications } from '@/hooks/use-applications';
import { Modal } from './modal';
export function ApplicationForm({
  application,
  onClose,
}: {
  application?: Application;
  onClose: () => void;
}) {
  const { save } = useApplications();
  const jobUrlId = useId();
  const [jobUrl, setJobUrl] = useState(application?.job_link || '');
  const [noJobUrl, setNoJobUrl] = useState(!!application && !application.job_link);
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const parsed = applicationSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setPending(true);
    try {
      await save(parsed.data as ApplicationInput, application?.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={application ? 'Edit application' : 'Add application'}
      description={
        application ? 'Keep the details up to date.' : 'One more step toward your next opportunity.'
      }
      onClose={onClose}
      wide
      busy={pending}
    >
      <form className="application-form" onSubmit={submit}>
        <fieldset disabled={pending}>
          <div className="form-grid">
            <label>
              Company name <span>*</span>
              <input
                name="company_name"
                defaultValue={application?.company_name}
                required
                maxLength={160}
                placeholder="e.g. Linear"
                autoFocus
              />
            </label>
            <label>
              Position <span>*</span>
              <input
                name="position"
                defaultValue={application?.position}
                required
                maxLength={200}
                placeholder="e.g. Product Designer"
              />
            </label>
            <div className="full-width job-url-field">
              <label htmlFor={jobUrlId}>Job URL (optional)</label>
              <input
                id={jobUrlId}
                name="job_link"
                type="url"
                value={noJobUrl ? '' : jobUrl}
                onChange={(event) => setJobUrl(event.target.value)}
                disabled={noJobUrl}
                maxLength={2048}
                placeholder={noJobUrl ? 'N/A' : 'https://company.com/careers/role'}
              />
              {noJobUrl && <input type="hidden" name="job_link" value="" />}
              <label className="job-url-option">
                <input
                  type="checkbox"
                  checked={noJobUrl}
                  onChange={(event) => setNoJobUrl(event.target.checked)}
                />
                N/A — no job URL
              </label>
            </div>
            <label>
              Location
              <input
                name="location"
                defaultValue={application?.location}
                maxLength={200}
                placeholder="e.g. Remote, Europe"
              />
            </label>
            <label>
              Application date <span>*</span>
              <input
                name="application_date"
                type="date"
                defaultValue={application?.application_date || localDate()}
                required
              />
            </label>
            <label className="full-width">
              Status <span>*</span>
              <select name="status" defaultValue={application?.status || 'Applied'} required>
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Notes
              <textarea
                name="notes"
                rows={4}
                defaultValue={application?.notes}
                maxLength={10000}
                placeholder="Contacts, interview prep, things to remember…"
              />
            </label>
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="modal-footer">
            <span>* Required fields</span>
            <button className="button secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button primary">
              {pending ? <LoaderCircle className="spin" size={16} /> : <ArrowUpRight size={16} />}{' '}
              {pending ? 'Saving…' : application ? 'Save changes' : 'Add application'}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
