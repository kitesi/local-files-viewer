import type { RequestHandler } from './$types';

export const GET: RequestHandler = async function ({ url }) {
	return Response.redirect(url.href + 'preview', 302);
};
