'use client';
import { useState } from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { Application } from '@/types/application';
import { formatDate } from '@/lib/applications';
import { useApplications } from '@/hooks/use-applications';
import { Modal } from './modal';
import { StatusBadge } from './status-badge';
export function ApplicationDetails({
  application: a,
  onClose,
  onEdit,
}: {
  application: Application;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal title={a.company_name} description={a.position} onClose={onClose} wide>
      <div className="details-grid">
        <div>
          <span>Current status</span>
          <StatusBadge status={a.status} />
        </div>
        <div>
          <span>Application date</span>
          <strong>{formatDate(a.application_date)}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>{a.location || 'Not specified'}</strong>
        </div>
        <div>
          <span>Job posting</span>
          {a.job_link ? (
            <a className="text-link" href={a.job_link} target="_blank" rel="noopener noreferrer">
              Open original posting <ExternalLink size={14} />
            </a>
          ) : (
            <strong>No link added</strong>
          )}
        </div>
        <div className="full-width">
          <span>Notes</span>
          <p className="notes">{a.notes || 'No notes added yet.'}</p>
        </div>
        <div>
          <span>Created</span>
          <strong>{new Date(a.created_at).toLocaleString()}</strong>
        </div>
        <div>
          <span>Last updated</span>
          <strong>{new Date(a.updated_at).toLocaleString()}</strong>
        </div>
      </div>
      <div className="modal-footer">
        <button className="button secondary" onClick={onClose}>
          Close
        </button>
        <button className="button primary" onClick={onEdit}>
          <Pencil size={15} />
          Edit application
        </button>
      </div>
    </Modal>
  );
}
export function DeleteApplication({
  application,
  onClose,
}: {
  application: Application;
  onClose: () => void;
}) {
  const { remove } = useApplications();
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  async function confirm() {
    setPending(true);
    try {
      await remove(application.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete.');
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title="Delete this application?"
      description={`This will permanently delete your ${application.position} application at ${application.company_name}. This cannot be undone.`}
      onClose={onClose}
      busy={pending}
    >
      <div className="delete-content">
        <p>Are you sure you want to delete this application?</p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer">
        <button className="button secondary" disabled={pending} onClick={onClose}>
          Keep application
        </button>
        <button className="button danger" disabled={pending} onClick={confirm}>
          <Trash2 size={15} />
          {pending ? 'Deleting…' : 'Delete application'}
        </button>
      </div>
    </Modal>
  );
}
