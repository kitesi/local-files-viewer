import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ url }) {
	const file = url.searchParams?.get('file');

	if (!file) {
		return new Response('', {
			headers: {
				'Content-Type': 'text/css'
			}
		});
	}

	let format = 'truetype';

	if (file.endsWith('.otf')) {
		format = 'opentype';
	} else if (file.endsWith('.woff')) {
		format = 'woff';
	} else if (file.endsWith('.woff2')) {
		format = 'woff2';
	}

	return new Response(
		`@font-face {font-family:'placeholder';src:url('/serve/${file}') format('${format}');}`,
		{
			headers: {
				'Content-Type': 'text/css'
			}
		}
	);
};
