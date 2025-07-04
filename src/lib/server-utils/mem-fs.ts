import path from 'path';
import {
	stat as fsStat,
	readFile as fsReadFile,
	readdir as fsReaddir
} from 'fs/promises';

import { watch } from 'fs';

import type { Stats } from 'fs';
import { fileChanged as fileChangedStore } from '../stores';

export interface WalkDirItem {
	name: string;
	isDirectory: boolean;
	children?: WalkDirItem[];
}

const cached = {
	walkdir: new Map<string, WalkDirItem>(),
	readdir: new Map<string, string[]>(),
	readFile: new Map<string, string | Buffer>(),
	stats: new Map<string, Stats>()
};

export async function walkdirBase(
	baseDirectory: string,
	depth: number
): Promise<WalkDirItem> {
	const baseItem: WalkDirItem & { children: WalkDirItem[] } = {
		name: path.basename(baseDirectory),
		isDirectory: true,
		children: []
	};

	async function recurse(
		dir: string,
		toPopulate: WalkDirItem[],
		level: number
	) {
		const files = await fsReaddir(dir);
		const stats = await Promise.all(
			files.map((f) => stat(path.join(dir, f)).catch(() => undefined))
		);
		const recursivePromises: Promise<any>[] = [];

		const populateDirs: WalkDirItem[] = [];
		const populateFiles: WalkDirItem[] = [];

		for (let i = 0; i < files.length; i++) {
			const currentFile = files[i];
			const currentStats = stats[i];

			if (
				!currentStats ||
				currentFile === '.git' ||
				currentFile === 'node_modules'
			) {
				continue;
			}

			const item: WalkDirItem = {
				name: currentFile,
				isDirectory: currentStats.isDirectory()
			};

			if (currentStats.isDirectory()) {
				item.children = [];
				populateDirs.push(item);

				if (level <= depth) {
					recursivePromises.push(
						recurse(path.join(dir, currentFile), item.children, level + 1)
					);
				}
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

	await recurse(baseDirectory, baseItem.children, 1);
	return baseItem;
}

export async function walkdir(dir: string, depth: number) {
	if (!cached.walkdir.has(dir)) {
		cached.walkdir.set(dir, await walkdirBase(dir, depth));
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
	encoding: null
): Promise<Buffer>;
export async function readFile(
	filePath: string,
	encoding: 'utf-8' | 'base64'
): Promise<string>;
export async function readFile(
	filePath: string,
	encoding: 'utf-8' | 'base64' | null
) {
	const key = [filePath, encoding].toString();

	if (!cached.readFile.has(key)) {
		// so we don't make multiple watch callbacks
		cached.readFile.set(key, '');
		const signal = new AbortController().signal;

		watch(filePath, { signal }, (event) => {
			console.log(event, Math.random());
			// hacky implementation to get the page to reload when file reloads
			fileChangedStore.set(Math.random());
		});
	}

	return await fsReadFile(filePath, encoding);
}

export async function stat(filePath: string) {
	if (!cached.stats.has(filePath)) {
		cached.stats.set(filePath, await fsStat(filePath));
	}

	return cached.stats.get(filePath)!;
}
