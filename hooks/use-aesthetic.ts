'use client';
import { useSyncExternalStore } from 'react';
import { AESTHETIC_KEY, parseAesthetic, type Aesthetic } from '@/lib/aesthetics';

const changed = 'jobtrack-aesthetic-change';
function subscribe(notify: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key !== AESTHETIC_KEY && event.key !== null) return;
    document.documentElement.dataset.aesthetic = parseAesthetic(event.newValue);
    notify();
  };
  window.addEventListener(changed, notify);
  window.addEventListener('storage', sync);
  return () => {
    window.removeEventListener(changed, notify);
    window.removeEventListener('storage', sync);
  };
}
function getSnapshot() {
  return parseAesthetic(document.documentElement.dataset.aesthetic);
}
export function setAesthetic(value: Aesthetic) {
  const next = parseAesthetic(value);
  document.documentElement.dataset.aesthetic = next;
  try {
    localStorage.setItem(AESTHETIC_KEY, next);
  } catch {
    // The theme still works for this tab when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(changed));
}
export function useAesthetic() {
  const aesthetic = useSyncExternalStore(subscribe, getSnapshot, () => 'original' as const);
  return { aesthetic, setAesthetic };
}
