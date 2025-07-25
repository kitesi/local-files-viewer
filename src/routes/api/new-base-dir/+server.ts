import { existsSync } from 'fs';
import {
	setBaseDirectory,
	getBaseDirectory,
	getRootDirectory
} from '$lib/server-utils/directory-variables';

import { error, json, type RequestHandler } from '@sveltejs/kit';
import path from 'path';
import os from 'os';

export const POST: RequestHandler = async function ({ request }) {
	let { dir } = await request.json();

	if (!dir) {
		return error(400, 'No directory provided');
	}

	dir = dir.replace(/(?<!\\)~/, os.homedir());
	dir = path.resolve(getBaseDirectory(), dir);

	if (!dir.endsWith(path.sep)) {
		dir += path.sep;
	}

	if (!dir.startsWith(getRootDirectory())) {
		return error(400, 'Directory is not in the root directory');
	}

	if (!existsSync(dir)) {
		return error(400, 'No such directory');
	}

	setBaseDirectory(dir);
	return json({ status: '200' });
};
