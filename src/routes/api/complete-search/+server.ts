import {
	getBaseDirectory,
	getRootDirectory
} from '$lib/server-utils/directory-variables';
import { walkdirBase } from '$lib/server-utils/mem-fs';
import type { RequestHandler } from '@sveltejs/kit';
import path from 'path';
import { json, error } from '@sveltejs/kit';
import { existsSync } from 'fs';

export interface CompleteSearchResponse {
	files: {
		name: string;
		isDirectory: boolean;
		children?: any[];
	};
}

async function completeSearch(url: URL) {
	let dir = url.searchParams?.get('dir');
	const depth = url.searchParams?.get('depth');

	if (!dir || !depth) {
		return error(400, 'Did not recieve either a directory or depth query');
	}

	const depthAsNumber = Number.parseFloat(depth);

	if (Number.isNaN(depthAsNumber)) {
		return error(400, 'Depth is not a valid number');
	}

	dir = path.join(getBaseDirectory(), dir);

	if (!dir.startsWith(getRootDirectory())) {
		return error(400, 'Directory is not in the root directory');
	}

	if (!existsSync(dir)) {
		return error(400, 'Directory does not exist');
	}

	const response: CompleteSearchResponse = {
		files: await walkdirBase(dir, depthAsNumber)
	};

	return json(response);
}

export const GET: RequestHandler = async function ({ url }) {
	return await completeSearch(url);
};
