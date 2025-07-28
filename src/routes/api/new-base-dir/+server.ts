import { setBaseDirectory } from '$lib/server-utils/directory-variables';

import { type RequestHandler } from '@sveltejs/kit';
import { resolveUserDir } from '$/lib/client-utils/resolve-user-dir';

export const POST: RequestHandler = async function ({ request }) {
	let { dir } = await request.json();

	dir = resolveUserDir(dir);
	setBaseDirectory(dir);

	return new Response('OK', { status: 200 });
};
