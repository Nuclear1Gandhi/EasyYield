import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

function createThemeStore() {
  const initial: Theme = browser
    ? (document.documentElement.getAttribute('data-theme') as Theme) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
    : 'light';

  const { subscribe, set, update } = writable<Theme>(initial);

  const apply = (t: Theme) => {
    if (!browser) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', t); // SCSS variables selector
    root.classList.toggle('dark', t === 'dark'); // Tailwind/Flowbite dark class
    try {
      localStorage.setItem('theme', t);
    } catch {}
  };

  if (browser) {
    // Ensure DOM reflects initial store value on client init
    apply(initial);
  }

  return {
    subscribe,
    set: (t: Theme) => {
      set(t);
      apply(t);
    },
    toggle: () => {
      update((prev) => {
        const next = prev === 'dark' ? 'light' : 'dark';
        apply(next);
        return next;
      });
    },
  };
}

export const theme = createThemeStore();
