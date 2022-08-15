import { writable } from 'svelte/store';
import type { WalkDirItem } from './mem-fs';

export const files = writable({} as WalkDirItem);
