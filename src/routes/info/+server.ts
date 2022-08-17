import { json } from '@sveltejs/kit';
import path from 'path';
import { walkdirBase } from '../../mem-fs';
import { getBaseDirectory } from '../../base-directory';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ url }: { url: URL }) {
	const dir = url.searchParams?.get('dir');
	const depth = url.searchParams?.get('depth');

	if (!dir || !depth) {
		return json({ error: 'Did not recieve either a directory or depth query' }, {
			status: 400
		});
	}

	const depthAsNumber = Number.parseInt(depth);

	if (Number.isNaN(depthAsNumber)) {
		return json({ error: 'Depth is not a valid number' }, {
			status: 400
		});
	}

	return json({
		files: await walkdirBase(
			path.join(getBaseDirectory(), dir),
			depthAsNumber
		)
	});
}
