'use client';
import { Check } from 'lucide-react';
import { Modal } from './modal';
import { AESTHETICS } from '@/lib/aesthetics';
import { useAesthetic } from '@/hooks/use-aesthetic';

export function ThemePicker({ onClose }: { onClose: () => void }) {
  const { aesthetic, setAesthetic } = useAesthetic();
  return (
    <Modal
      title="Themes"
      description="Choose a style for your workspace. Changes apply immediately."
      onClose={onClose}
      wide
    >
      <div className="aesthetic-options" role="group" aria-label="Website aesthetic">
        {AESTHETICS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="aesthetic-option"
            aria-pressed={aesthetic === item.id}
            onClick={() => setAesthetic(item.id)}
          >
            <span className={`aesthetic-preview aesthetic-preview-${item.id}`} aria-hidden="true">
              <span className="aesthetic-preview-nav" />
              <span className="aesthetic-preview-content">
                <b>JobTrack</b>
                <span className="aesthetic-preview-metrics">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="aesthetic-preview-table" />
              </span>
            </span>
            <span className="aesthetic-option-name">
              {item.name}
              {aesthetic === item.id && <Check size={18} aria-hidden="true" />}
            </span>
            <span className="aesthetic-option-description">{item.description}</span>
          </button>
        ))}
      </div>
      <div className="modal-footer aesthetic-footer">
        <p>Saved in this browser. Light and dark mode work with every theme.</p>
        <button className="button primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
