import path from 'path';
import Fuse from 'fuse.js';
import { walkdirBase, type WalkDirItem } from '../../mem-fs';
import { getBaseDirectory } from '../../base-directory';
import { json } from '@sveltejs/kit';

function error(status: number, msg: string) {
	return json({ status, error: msg });
}
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ url }: { url: URL }) {
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
