import path from 'path';
import os from 'os';
import { existsSync } from 'fs';
import { walkdirBase, readdir, stat } from '../../mem-fs';
import { getBaseDirectory, setBaseDirectory } from '../../base-directory';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function error(status: number, msg: string) {
	return json({ status, error: msg });
}

async function completeSearch(url: URL) {
	const dir = url.searchParams?.get('dir');
	const depth = url.searchParams?.get('depth');

	if (!dir || !depth) {
		return error(400, 'Did not recieve either a directory or depth query');
	}

	const depthAsNumber = Number.parseFloat(depth);

	if (Number.isNaN(depthAsNumber)) {
		return error(400, 'Depth is not a valid number');
	}

	console.log(path.join(getBaseDirectory(), dir));

	return json({
		files: await walkdirBase(path.join(getBaseDirectory(), dir), depthAsNumber)
	});
}

async function oneLevelDirSearch(url: URL) {
	const homedir = os.homedir();
	const query = (url.searchParams?.get('query') || '')
		.replaceAll('\\', '/')
		.replace(/(?<!\\)~/, homedir);

	let dir = query;

	if (query !== homedir && query !== '/' && !query.endsWith('/')) {
		if (!query.includes('/')) {
			dir = '';
		} else {
			const indexOfLastSlash = query.lastIndexOf('/');

			if (indexOfLastSlash === 0) {
				dir = '/';
			} else if (indexOfLastSlash !== -1) {
				dir = query.slice(0, indexOfLastSlash);
			}
		}
	}

	if (!path.isAbsolute(dir)) {
		dir = path.resolve(getBaseDirectory(), dir);
	}

	if (!existsSync(dir)) {
		return json({ files: [], homedir });
	}

	const stats = await stat(dir);

	if (!stats.isDirectory()) {
		return json({ files: [], homedir });
	}

	const files = (await readdir(dir)).map((e) => path.join(dir, e));
	const filesStats = await Promise.all(
		files.map((e) => stat(e).catch(() => null))
	);

	return json({
		files: files.filter((e, i) => filesStats[i]?.isDirectory()),
		homedir
	});
}

export const GET: RequestHandler = async function ({ url }) {
	const actions = ['new-base-dir-search', 'complete-search'];
	const action = url.searchParams?.get('action');

	if (!action) {
		return error(400, 'No action provided');
	}

	if (!actions.includes(action)) {
		return error(400, 'Invalid action');
	}

	if (action === 'complete-search') {
		return await completeSearch(url);
	}

	return await oneLevelDirSearch(url);
};

export const POST: RequestHandler = async function ({ request }) {
	let { action, dir } = await request.json();

	if (!action) {
		return error(400, 'No action provided');
	}

	if (!dir) {
		return error(400, 'No directory provided');
	}

	if (action !== 'new-base-dir') {
		return error(400, 'The only action allowed is: new-base-dir');
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
