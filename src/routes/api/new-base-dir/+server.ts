import { setBaseDirectory } from '$lib/server-utils/directory-variables';

import { error, type RequestHandler } from '@sveltejs/kit';
import { resolveUserPathWithinRoot } from '$/lib/client-utils/resolve-user-path';

export const POST: RequestHandler = async function ({ request }) {
	let { dir } = await request.json();

	if (typeof dir !== 'string') {
		return error(400, 'Invalid path');
	}

	dir = resolveUserPathWithinRoot(dir, true);
	setBaseDirectory(dir);

	return new Response('OK', { status: 200 });
};
