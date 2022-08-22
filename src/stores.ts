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

export function addToastError(msg: string, timeout: number) {
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
