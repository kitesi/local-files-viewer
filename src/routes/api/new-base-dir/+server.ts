import { existsSync } from 'fs';
import { setBaseDirectory, getBaseDirectory } from '../../../base-directory';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import path from 'path';
import os from 'os';

export const POST: RequestHandler = async function ({ request }) {
	let { dir } = await request.json();

	if (!dir) {
		return error(400, 'No directory provided');
	}

	dir = dir.replace(/(?<!\\)~/, os.homedir());

	if (!path.isAbsolute(dir)) {
		dir = path.resolve(getBaseDirectory(), dir);
	}

	if (!existsSync(dir)) {
		return error(400, 'No such directory');
	}

	setBaseDirectory(dir);
	return json({ status: '200' });
};
