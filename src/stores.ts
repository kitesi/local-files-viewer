import { DEFAULT_ERROR_MESSAGE_TIMEOUT } from './config';
import { writable } from 'svelte/store';
import { v4 as uuid } from 'uuid';
import { browser } from '$app/environment';

import type { WalkDirItem } from './mem-fs';

interface ToastError {
	id: string;
	msg: string;
	timeout: number;
}

// Theme store with localStorage persistence
function createThemeStore() {
	const { subscribe, set, update } = writable<'light' | 'dark'>('light');

	// Initialize from localStorage if available
	if (browser) {
		const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (savedTheme) {
			set(savedTheme);
			document.documentElement.classList.toggle('dark', savedTheme === 'dark');
		} else {
			// Check system preference
			const prefersDark = window.matchMedia(
				'(prefers-color-scheme: dark)'
			).matches;
			set(prefersDark ? 'dark' : 'light');
			document.documentElement.classList.toggle('dark', prefersDark);
		}
	}

	return {
		subscribe,
		toggle: () => {
			update((current) => {
				const newTheme = current === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', newTheme);
					document.documentElement.classList.toggle(
						'dark',
						newTheme === 'dark'
					);
				}
				return newTheme;
			});
		},
		set: (theme: 'light' | 'dark') => {
			set(theme);
			if (browser) {
				localStorage.setItem('theme', theme);
				document.documentElement.classList.toggle('dark', theme === 'dark');
			}
		}
	};
}

export const theme = createThemeStore();

export function removeToastError(id: string) {
	toasts.update((all) => all.filter((t) => t.id !== id));
}

export function addToastError(
	msg: string,
	timeout: number = DEFAULT_ERROR_MESSAGE_TIMEOUT
) {
	const id = uuid();

	const toast: ToastError = {
		id,
		msg,
		timeout
	};

	toasts.update((all) => [toast, ...all]);
	setTimeout(() => removeToastError(id), timeout);
}

export const files = writable({} as WalkDirItem);
export const modalState = writable(
	'' as '' | 'choose-file' | 'choose-directory'
);
export const toasts = writable([] as ToastError[]);
export const baseDirectory = writable('');
export const isSidebarOpen = writable(false);

// hacky implementation to get the page to reload when file reloads
export const fileChanged = writable(0);

export const abortController = writable(new AbortController());
