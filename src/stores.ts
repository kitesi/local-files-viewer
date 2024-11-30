import { DEFAULT_ERROR_MESSAGE_TIMEOUT } from './config';
import { writable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import type { WalkDirItem } from './mem-fs';

interface ToastError {
	id: string;
	msg: string;
	timeout: number;
}

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
