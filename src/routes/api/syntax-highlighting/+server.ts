import { readFile } from '$lib/server-utils/mem-fs';
import { getMimeType } from '$/lib/server-utils/get-mime-types';

import { error, type RequestHandler } from '@sveltejs/kit';
import { codeToHtml, bundledLanguagesInfo } from 'shiki';
import { resolveUserPathWithinBase } from '$/lib/server-utils/resolve-user-path';

const cache = new Map<string, string>();

async function getSyntaxHighlighting(url: URL): Promise<Response> {
	const filePathParam = url.searchParams.get('file');

	if (!filePathParam) {
		error(400, 'No file path was provided');
	}

	const filePath = resolveUserPathWithinBase(filePathParam, false);
	const cached = cache.get(filePath);
	if (cached !== undefined) {
		return new Response(cached);
	}

	try {
		const content = await readFile(filePath, 'utf-8');
		const mimeType = getMimeType(filePath);

		let lang = mimeType.specific;

		switch (mimeType.specific) {
			case 'x-scss':
				lang = 'scss';
				break;
		}

		const html =
			!bundledLanguagesInfo.some(
				(e) => e.id === lang || e.aliases?.includes(lang)
			)
				? await codeToHtml(content, {
						lang: 'plaintext',
						theme: 'github-dark'
					})
				: await codeToHtml(content, { lang, theme: 'github-dark' });

		cache.set(filePath, html);
		return new Response(html);
	} catch (err) {
		console.error(err);
		return error(500, 'error highlighting code');
	}
}

export const GET: RequestHandler = async function ({ url }) {
	return await getSyntaxHighlighting(url);
};
