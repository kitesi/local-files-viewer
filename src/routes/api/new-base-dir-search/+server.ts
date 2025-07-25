import os from 'os';
import path from 'path';
import { existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { getRootDirectory } from '$lib/server-utils/directory-variables';

import { getBaseDirectory } from '$lib/server-utils/directory-variables';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

async function oneLevelDirSearch(url: URL) {
	const homedir = os.homedir();
	const query = (url.searchParams?.get('query') || '').replace(
		/(?<!\\)~/,
		homedir
	);

	let dir = query;

	// trim the user input to get the directory we should be searching
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

	dir = path.resolve(getBaseDirectory(), dir);

	if (!dir.endsWith(path.sep)) {
		dir += path.sep;
	}

	if (!dir.startsWith(getRootDirectory())) {
		return json({ files: [], homedir });
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
	const filteredDirectories = files.filter((_, i) =>
		filesStats[i]?.isDirectory()
	);

	if (query.startsWith('../')) {
		// add this entry so that the user can go back to the parent directory (if the user presses enter, it selects the first entry)
		filteredDirectories.unshift('../');
	}

	return json({
		files: filteredDirectories,
		homedir
	});
}

export const GET: RequestHandler = async function ({ url }) {
	return await oneLevelDirSearch(url);
};
