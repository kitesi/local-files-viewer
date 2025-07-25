import { readFile } from '$lib/server-utils/mem-fs';
import { getMimeType } from '$lib/server-utils/get-mime-types';
import {
	getBaseDirectory,
	getRootDirectory
} from '$lib/server-utils/directory-variables';
import { highlighterWrapper } from '$lib/server-utils/highlight';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGemoji from 'remark-gemoji';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';

import { escape as escapeHtml } from 'html-escaper';

import path from 'path';

// todo: fix typing in this file
interface UnistNode {
	type: string;
	value: string;
	lang?: string;
	meta?: string;
}

export interface BodyReturn {
	content?: string;
	html?: string;
	error?: string;
	maximizeCodeBlockWidth?: boolean;
	needsHighlighting?: boolean;
	stats: {
		lines?: number;
		chars?: number;
		words?: number;
	};
	[k: string]: any;
}

function rehypeAddLineNumbers() {
	return (tree: any) => {
		visit(tree, (node) => {
			if (
				node.position &&
				node.properties &&
				typeof node.position.start.line === 'number'
			) {
				node.properties['data-line'] = node.position.start.line;
				node.properties['id'] = `L${node.position.start.line}`;
			}
		});
	};
}

async function getFileContents(url: URL) {
	const filePathParam = url.searchParams?.get('file');

	if (!filePathParam) {
		error(400, 'Did not recieve a file path');
	}

	let filePath = path.join(getBaseDirectory(), filePathParam);
	filePath = path.resolve(filePath);

	if (!filePath.startsWith(getRootDirectory())) {
		error(400, 'File path is not in the root directory');
	}

	const mimeType = getMimeType(filePath);

	const content = await readFile(filePath, 'utf-8');
	const body: BodyReturn = {
		stats: {}
	};

	body.stats.lines = content.match(/\n/g)?.length || 0;
	body.stats.words = content.match(/[^\s]+/g)?.length || 0;
	body.stats.chars = content.match(/[^\s]/g)?.length || 0;

	if (mimeType.specific === 'plain') {
		body.content = content;
		return json(body);
	}

	switch (mimeType.specific) {
		case 'markdown':
			try {
				const vfile = await unified()
					.use(remarkParse)
					.use(remarkGemoji)
					.use(remarkGfm)
					.use(function () {
						return (tree) => {
							visit(tree, 'code', (node: UnistNode) => {
								// @ts-ignore
								node.type = 'html';
								node.value = highlighterWrapper(
									node.value,
									node.lang || undefined,
									node.meta || ''
								);
							});
						};
					})
					.use(remarkRehype, { allowDangerousHtml: true })
					.use(rehypeRaw)
					.use(rehypeSlug)
					.use(rehypeStringify)
					.use(rehypeAddLineNumbers)
					.process(await readFile(filePath, 'utf-8'));

				body.html = String(vfile).replace(
					/<img src="([^"]*)"/g,
					(m: string, src: string) => {
						if (src.startsWith('http')) {
							return m;
						}

						const dirname = src.startsWith('/')
							? ''
							: path.dirname(filePathParam);

						if (dirname === '.') {
							return `<img src="/serve/${src}"`;
						}

						return `<img src="/serve/${path.join(dirname, src)}"`;
					}
				);
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
			body.html = `<pre><code>${escapeHtml(content)}</code></pre>`;
			body.maximizeCodeBlockWidth = true;
			body.needsHighlighting = true;
			break;
		default:
			if (mimeType.genre === 'application') {
				error(400, 'Could not handle mime type of: ' + mimeType.full);
			}

			body.html = `<pre><code>${escapeHtml(content)}</code></pre>`;
			body.maximizeCodeBlockWidth = true;
			body.needsHighlighting = true;

			break;
	}

	return json(body);
}

export const GET: RequestHandler = async function ({ url }) {
	return await getFileContents(url);
};
