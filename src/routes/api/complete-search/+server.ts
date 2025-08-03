import { walkdirBase } from '$lib/server-utils/mem-fs';
import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { resolveUserPathWithinBase } from '$lib/server-utils/resolve-user-path';

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

	dir = resolveUserPathWithinBase(dir, true);

	const response: CompleteSearchResponse = {
		files: await walkdirBase(dir, depthAsNumber)
	};

	return json(response);
}

export const GET: RequestHandler = async function ({ url }) {
	return await completeSearch(url);
};
