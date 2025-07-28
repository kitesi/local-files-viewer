import os from 'os';
import path from 'path';
import { readdir, stat } from 'fs/promises';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { resolveUserPathWithinRoot } from '$/lib/client-utils/resolve-user-path';

export interface NewBaseDirSearchResponse {
	files: string[];
	homedir: string;
}

async function oneLevelDirSearch(url: URL) {
	const homedir = os.homedir();
	const query = url.searchParams?.get('query') || '';

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

	const response: NewBaseDirSearchResponse = {
		files: [],
		homedir
	};

	try {
		dir = resolveUserPathWithinRoot(dir, true);
	} catch (err) {
		// on error just return blank response
		return json(response);
	}

	const stats = await stat(dir);

	if (!stats.isDirectory()) {
		return json(response);
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

	response.files = filteredDirectories;
	return json(response);
}

export const GET: RequestHandler = async function ({ url }) {
	return await oneLevelDirSearch(url);
};
