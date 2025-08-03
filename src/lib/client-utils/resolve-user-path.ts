import { error } from '@sveltejs/kit';
import path from 'path';
import os from 'os';
import {
	getBaseDirectory,
	getRootDirectory
} from '$lib/server-utils/directory-variables';
import { existsSync } from 'fs';

// validate a given user path - force to be used within root directory
export function resolveUserPathWithinRoot(
	file: string,
	isDirectory: boolean
): string {
	if (typeof file !== 'string') {
		error(400, 'No path provided');
	}

	file = file.replace(/(?<!\\)~/, os.homedir());
	file = path.resolve(getBaseDirectory(), file);

	if (isDirectory && !file.endsWith(path.sep)) {
		file += path.sep;
	}

	if (!file.startsWith(getRootDirectory())) {
		error(400, 'Path is not in the root directory');
	}

	if (!existsSync(file)) {
		error(400, 'No such path');
	}

	return file;
}

// validate a given user path - force to be used within base directory
export function resolveUserPathWithinBase(
	file: string,
	isDirectory: boolean
): string {
	file = resolveUserPathWithinRoot(file, isDirectory);

	if (!file.startsWith(getBaseDirectory())) {
		error(400, 'Path is not in the base directory');
	}

	return file;
}
