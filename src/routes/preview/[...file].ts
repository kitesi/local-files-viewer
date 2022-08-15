import path from 'path';
import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/index';
import { compile } from 'mdsvex';
import { escape } from 'html-escaper';
import { stat, walkdir, readFile } from '../../mem-fs';
import { getMimeType } from '../../get-mime-types';
import { getBaseDirectory } from '../../base-directory';

import { existsSync } from 'fs';

import type { Stats } from 'fs';

loadLanguages();

function highlight(code: string, grammar: Prism.Grammar, language: string) {
	return `<pre class="language-${language}"><code>${Prism.highlight(
		code,
		grammar,
		language
	)}</code></pre>`;
}

export async function GET({ params, url }: { params: any; url: any }) {
	const filePath = path.join(getBaseDirectory(), params.file);
	const files = await walkdir(getBaseDirectory(), 3);

	function generateErrorResponse(error: Error) {
		return {
			body: {
				files: files,
				error: error.message
			}
		};
	}

	if (!existsSync(filePath)) {
		return generateErrorResponse(new Error('Path does not exist.'));
	}

	let stats: Stats;

	try {
		stats = await stat(filePath);
	} catch (err: any) {
		return generateErrorResponse(err);
	}

	if (stats.isDirectory()) {
		return {
			body: {
				files: files
			}
		};
	}

	const mimeType = getMimeType(filePath);
	const body: { [k: string]: any } = {
		files: files,
		mimeType
	};

	if (
		mimeType.genre === 'audio' ||
		mimeType.genre === 'video' ||
		mimeType.genre === 'image'
	) {
		body.content = '/serve/' + params.file;
		return { body };
	}

	if (mimeType.genre === 'text' || mimeType.genre === 'application') {
		const content = await readFile(filePath, 'utf-8');

		switch (mimeType.specific) {
			case 'markdown':
				body.html = (await compile(content))?.code
					// mdsvex adds {@html `<code>....</code>`} for some reason.
					?.replace('{@html `', '')
					.replace('`}', '')
					.replace(/<img src="([^"]*)"/g, (m, src) => {
						if (src.startsWith('http')) {
							return m;
						}

						const dirname = src.startsWith('/')
							? ''
							: path.dirname(params.file);

						if (dirname === '.') {
							return `<img src="/serve/${src}"`;
						}

						return `<img src="/serve/${path.join(dirname, src)}"`;
					});

				break;
			case 'typescript':
				body.html = highlight(
					content,
					Prism.languages.typescript,
					'typescript'
				);
				break;
			case 'javascript':
				body.html = highlight(content, Prism.languages.js, 'js');
				break;
			case 'json':
				body.html = highlight(content, Prism.languages.json, 'json');
				break;
			case 'x-scss':
				body.html = highlight(content, Prism.languages.scss, 'scss');
				break;
			case 'plain':
				body.content = content;
				break;
			case 'plain-code':
				body.html = `<pre><code>${escape(content)}</code></pre>`;
				break;
			default:
				if (mimeType.genre === 'application') {
					body.unknownMimeType = true;
					return { body };
				}

				const grammer = Prism.languages[mimeType.specific];

				if (!grammer) {
					body.content = content;
					break;
				}

				try {
					body.html = highlight(content, grammer, mimeType.specific);
				} catch (err) {
					body.content = content;
				}

				break;
		}

		return { body };
	}

	body.unknownMimeType = true;

	return {
		body
	};
}
