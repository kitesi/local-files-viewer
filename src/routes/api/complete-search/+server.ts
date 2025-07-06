import { getBaseDirectory } from '$lib/server-utils/base-directory';
import { walkdirBase } from '$lib/server-utils/mem-fs';
import type { RequestHandler } from '@sveltejs/kit';
import path from 'path';
import { json, error } from '@sveltejs/kit';

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

	return json({
		files: await walkdirBase(path.join(getBaseDirectory(), dir), depthAsNumber)
	});
}

export const GET: RequestHandler = async function ({ url }) {
	return await completeSearch(url);
};
