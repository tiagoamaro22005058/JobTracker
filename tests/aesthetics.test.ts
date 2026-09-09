import { afterEach, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import { aestheticBootstrap, AESTHETIC_KEY, AESTHETICS } from '@/lib/aesthetics';
import { setAesthetic } from '@/hooks/use-aesthetic';

afterEach(() => vi.unstubAllGlobals());

it.each(AESTHETICS.map((item) => item.id))('restores saved %s before hydration', (saved) => {
  const dataset: Record<string, string> = {};
  runInNewContext(aestheticBootstrap, {
    document: { documentElement: { dataset } },
    localStorage: { getItem: () => saved },
  });
  expect(dataset.aesthetic).toBe(saved);
});

it.each([null, 'removed-theme', '<script>'])(
  'falls back for unavailable or invalid saved values: %s',
  (saved) => {
    const dataset: Record<string, string> = {};
    runInNewContext(aestheticBootstrap, {
      document: { documentElement: { dataset } },
      localStorage: { getItem: () => saved },
    });
    expect(dataset.aesthetic).toBe('original');
  },
);

it('keeps the original design when storage access is blocked', () => {
  const dataset: Record<string, string> = {};
  runInNewContext(aestheticBootstrap, {
    document: { documentElement: { dataset } },
    localStorage: {
      getItem: () => {
        throw new Error('Blocked');
      },
    },
  });
  expect(dataset.aesthetic).toBe('original');
});

it.each([false, true])(
  'switches without changing dark mode even when storage is blocked: %s',
  (blocked) => {
    const root = { dataset: { aesthetic: 'original' }, className: 'dark' };
    const setItem = vi.fn(() => {
      if (blocked) throw new Error('Blocked');
    });
    const events = new EventTarget();
    const changed = vi.fn();
    events.addEventListener('jobtrack-aesthetic-change', changed);
    vi.stubGlobal('document', { documentElement: root });
    vi.stubGlobal('localStorage', { setItem });
    vi.stubGlobal('window', events);
    setAesthetic('vintage');
    expect(root.dataset.aesthetic).toBe('vintage');
    expect(root.className).toBe('dark');
    expect(setItem).toHaveBeenCalledWith(AESTHETIC_KEY, 'vintage');
    expect(changed).toHaveBeenCalledOnce();
  },
);
