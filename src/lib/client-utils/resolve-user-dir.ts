import { error } from '@sveltejs/kit';
import path from 'path';
import os from 'os';
import {
	getBaseDirectory,
	getRootDirectory
} from '$lib/server-utils/directory-variables';
import { existsSync } from 'fs';

// validate a given user directory
export function resolveUserDir(dir: string): string {
	if (!dir) {
		error(400, 'No directory provided');
	}

	dir = dir.replace(/(?<!\\)~/, os.homedir());
	dir = path.resolve(getBaseDirectory(), dir);

	if (!dir.endsWith(path.sep)) {
		dir += path.sep;
	}

	if (!dir.startsWith(getRootDirectory())) {
		error(400, 'Directory is not in the root directory');
	}

	if (!existsSync(dir)) {
		error(400, 'No such directory');
	}

	return dir;
}
