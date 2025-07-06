import type { WalkDirItem } from '../server-utils/mem-fs';

export function getWalkdirItem(paths: string[], files: WalkDirItem) {
	let current: WalkDirItem = files;

	for (const path of paths) {
		const next = current.children?.find((e) => e.name === path);

		if (!next) {
			break;
		}

		current = next;
	}

	return current;
}
