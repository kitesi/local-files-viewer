import path from 'path';
import {
	stat as fsStat,
	readFile as fsReadFile,
	readdir as fsReaddir
} from 'fs/promises';

import type { Stats } from 'fs';

export interface WalkDirItem {
	name: string;
	isDirectory: boolean;
	children?: WalkDirItem[];
}

const cached = {
	walkdir: new Map<string, WalkDirItem>(),
	readdir: new Map<string, string[]>(),
	readFile: new Map<string, string>(),
	stats: new Map<string, Stats>()
};

export async function walkdirBase(baseDirectory: string): Promise<WalkDirItem> {
	const baseItem: WalkDirItem & { children: WalkDirItem[] } = {
		name: path.basename(baseDirectory),
		isDirectory: true,
		children: []
	};

	async function recurse(
		dir: string,
		toPopulate: WalkDirItem[],
		parent?: WalkDirItem
	) {
		const files = await fsReaddir(dir);
		const stats = await Promise.all(files.map((f) => stat(path.join(dir, f))));
		const recursivePromises: Promise<any>[] = [];

		const populateDirs: WalkDirItem[] = [];
		const populateFiles: WalkDirItem[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (file === '.git' || file === 'node_modules') {
				continue;
			}

			const item: WalkDirItem = {
				name: file,
				isDirectory: stats[i].isDirectory()
			};

			if (stats[i].isDirectory()) {
				item.children = [];
				populateDirs.push(item);
				recursivePromises.push(recurse(path.join(dir, file), item.children));
			} else {
				populateFiles.push(item);
			}
		}

		const collactor = new Intl.Collator(undefined, {
			numeric: true,
			sensitivity: 'base'
		});

		const compare = (a: WalkDirItem, b: WalkDirItem) =>
			collactor.compare(a.name, b.name);

		populateDirs.sort(compare);
		populateFiles.sort(compare);

		toPopulate.push(...populateDirs, ...populateFiles);

		await Promise.all(recursivePromises);
	}

	await recurse(baseDirectory, baseItem.children);
	return baseItem;
}

export async function walkdir(dir: string) {
	if (!cached.walkdir.has(dir)) {
		cached.walkdir.set(dir, await walkdirBase(dir));
	}

	return cached.walkdir.get(dir)!;
}

export async function readdir(filePath: string) {
	if (!cached.readdir.has(filePath)) {
		cached.readdir.set(filePath, await fsReaddir(filePath, 'utf-8'));
	}

	return cached.readdir.get(filePath)!;
}

export async function readFile(
	filePath: string,
	encoding: 'utf-8' | 'base64' = 'utf-8'
) {
	if (!cached.readFile.has(filePath)) {
		cached.readFile.set(filePath, await fsReadFile(filePath, encoding));
	}

	return cached.readFile.get(filePath)!;
}

export async function stat(filePath: string) {
	if (!cached.stats.has(filePath)) {
		cached.stats.set(filePath, await fsStat(filePath));
	}

	return cached.stats.get(filePath)!;
}
