import path from 'path';
import { walkdirBase } from '../mem-fs';

let baseDirectory: string = '';

if (process.env.LFV_DEFAULT_FOLDER) {
	baseDirectory = process.env.LFV_DEFAULT_FOLDER;
} else {
	throw new Error('No base directory provided.');
}

if (baseDirectory.endsWith('/')) {
	baseDirectory = baseDirectory.slice(0, -1);
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ url }: { url: URL }) {
	const dir = url.searchParams?.get('dir');
	const depth = url.searchParams?.get('depth');

	if (!dir || !depth) {
		return {
			body: { error: 'Did not recieve either a directory or depth query' },
			status: 400
		};
	}

	const depthAsNumber = Number.parseInt(depth);

	if (Number.isNaN(depthAsNumber)) {
		return {
			body: { error: 'Depth is not a valid number' },
			status: 400
		};
	}

	return {
		body: {
			files: await walkdirBase(path.join(baseDirectory, dir), depthAsNumber)
		}
	};
}
