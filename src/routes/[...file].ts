import path from 'path';
import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/index';
import mime from 'mime-types';
import { compile } from 'mdsvex';
import { escape } from 'html-escaper';
import { stat, walkdir, readFile } from '../mem-fs';

import { existsSync } from 'fs';

import type { Stats } from 'fs';

let baseDirectory: string = '';

loadLanguages();

if (process.env.LFV_DEFAULT_FOLDER) {
	baseDirectory = process.env.LFV_DEFAULT_FOLDER;
} else {
	throw new Error('No base directory provided.');
}

export type Genre =
	| 'text'
	| 'application'
	| 'video'
	| 'x-conference'
	| 'model'
	| 'font'
	| 'chemical'
	| 'audio'
	| 'image'
	| 'messsage'
	| 'unknown';

function getMimeType(file: string): {
	genre: Genre;
	specific: string;
} {
	if (file.endsWith('.ts') || file.endsWith('.d.ts')) {
		return { genre: 'text', specific: 'typescript' };
	}

	const plains = [
		'.npmrc',
		'.prettierrc',
		'.prettierignore',
		'.gitignore',
		'.svelte'
	];

	if (plains.some((p) => file.endsWith(p))) {
		return { genre: 'text', specific: 'plain-code' };
	}

	const mimeType = mime.lookup(file);
	let genre: Genre = 'unknown';
	let specific = 'unknown';

	if (mimeType) {
		const splitContent = mimeType.split('/');
		genre = splitContent[0] as Genre;
		specific = splitContent[1];
	}

	return { genre, specific };
}

function highlight(code: string, grammar: Prism.Grammar, language: string) {
	return `<pre class="language-${language}"><code>${Prism.highlight(
		code,
		grammar,
		language
	)}</code></pre>`;
}

export async function GET({ params, url }: { params: any; url: any }) {
	const allFiles = await walkdir(baseDirectory);

	function generateErrorResponse(error: Error) {
		return {
			body: {
				files: allFiles,
				error: error.message
			}
		};
	}

	const filePath = path.join(baseDirectory, params.file);

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
				files: allFiles
			}
		};
	}

	const mimeType = getMimeType(filePath);
	const fullMimeType = mimeType.genre + '/' + mimeType.specific;
	const body: { [k: string]: any } = {
		files: allFiles,
		mimeType,
		fullMimeType: fullMimeType,
		mimeTypeGenre: mimeType.genre
	};

	if (
		mimeType.genre === 'audio' ||
		mimeType.genre === 'video' ||
		mimeType.genre === 'image'
	) {
		body.content =
			'data:' +
			fullMimeType +
			';base64,' +
			(await readFile(filePath, 'base64'));
		return { body };
	}

	if (mimeType.genre === 'text' || mimeType.genre === 'application') {
		const content = await readFile(filePath);

		switch (mimeType.specific) {
			case 'markdown':
				// mdsvex adds {@html `<code>....</code>`} for some reason.
				body.html = (await compile(content))?.code
					?.replace('{@html `', '')
					.replace('`}', '');

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
