import path from 'path';
import { readFile } from '$lib/server-utils/mem-fs';
import { getBaseDirectory } from '$lib/server-utils/base-directory';
import { getMimeType } from '$lib/server-utils/get-mime-types';

import { json, type RequestHandler } from '@sveltejs/kit';
import { getHighlighter, BUNDLED_LANGUAGES } from 'shiki';

const cache: Map<string, string> = new Map();

const highlighter = await getHighlighter({
	theme: 'github-dark'
});

function error(status: number, msg: string) {
	return json({ status, error: msg });
}

async function getSyntaxHighlighting(url: URL): Promise<Response> {
	const filePathParam = url.searchParams.get('file');

	if (!filePathParam) {
		return error(500, 'no file path was provided');
	}

	const filePath = path.join(getBaseDirectory(), filePathParam);

	if (cache.has(filePath)) {
		return new Response(cache.get(filePath));
	}

	const content = await readFile(filePath, 'utf-8');
	const mimeType = getMimeType(filePath);

	let lang = mimeType.specific;

	switch (mimeType.specific) {
		case 'x-scss':
			lang = 'scss';
			break;
	}

	if (
		!BUNDLED_LANGUAGES.some((e) => e.id === lang || e.aliases?.includes(lang))
	) {
		cache.set(content, '');
	} else {
		cache.set(content, highlighter.codeToHtml(content, { lang }));
	}

	return new Response(cache.get(content));
}

export const GET: RequestHandler = async function ({ url }) {
	return await getSyntaxHighlighting(url);
};
