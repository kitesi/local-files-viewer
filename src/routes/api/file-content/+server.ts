import { readFile } from '$lib/server-utils/mem-fs';
import { getMimeType, type MimeType } from '$/lib/server-utils/get-mime-types';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { escape as escapeHtml } from 'html-escaper';
import path from 'path';
import { resolveUserPathWithinBase } from '$/lib/server-utils/resolve-user-path';

export interface FileContentResponse {
	content?: string;
	html?: string;
	error?: string;
	maximizeCodeBlockWidth?: boolean;
	needsHighlighting?: boolean;
	mimeType?: MimeType;
	stats: {
		lines?: number;
		chars?: number;
		words?: number;
	};
	[k: string]: any;
}

async function getFileContents(url: URL) {
	const filePathParam = url.searchParams?.get('file');

	if (!filePathParam) {
		error(400, 'In directory.');
	}

	const filePath = resolveUserPathWithinBase(filePathParam, false);
	const mimeType = getMimeType(filePath);
	const content = await readFile(filePath, 'utf-8');
	const body: FileContentResponse = {
		mimeType,
		stats: {}
	};

	body.stats.lines = content.match(/\n/g)?.length || 0;
	body.stats.words = content.match(/[^\s]+/g)?.length || 0;
	body.stats.chars = content.match(/[^\s]/g)?.length || 0;

	if (mimeType.specific === 'plain') {
		body.content = content;
		return json(body);
	}

	if (
		mimeType?.genre === 'audio' ||
		mimeType?.genre === 'video' ||
		mimeType?.genre === 'image' ||
		mimeType?.genre === 'font'
	) {
		return json(body);
	}

	switch (mimeType.specific) {
		case 'markdown':
			try {
				const { parseMarkdownToHtml } = await import(
					'$lib/server-utils/markdown-parser'
				);
				body.html = await parseMarkdownToHtml(content, filePathParam);
			} catch (err: any) {
				error(500, err?.message || 'Internal server error');
			}
			break;
		case 'plain':
			body.content = content;
			break;
		case 'pdf':
			body.content = ``;
			break;
		case 'typescript':
		case 'javascript':
		case 'json':
		case 'x-scss':
			body.html = `<pre class="bg-code text-code-foreground"><code>${escapeHtml(content)}</code></pre>`;
			body.maximizeCodeBlockWidth = true;
			body.needsHighlighting = true;
			break;
		default:
			body.html = `<pre class="bg-code text-code-foreground"><code>${escapeHtml(content)}</code></pre>`;
			body.maximizeCodeBlockWidth = true;
			body.needsHighlighting = true;
			break;
	}

	return json(body);
}

export const GET: RequestHandler = async function ({ url }) {
	return await getFileContents(url);
};
