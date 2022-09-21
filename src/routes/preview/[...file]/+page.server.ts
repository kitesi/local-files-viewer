import path from 'path';
import { escapeSvelte } from 'mdsvex';
import { stat, walkdir, readFile, type WalkDirItem } from '../../../mem-fs';
import { getMimeType, type MimeType } from '../../../get-mime-types';
import { getBaseDirectory } from '../../../base-directory';
import { highlighterWrapper } from '../../../../highlight';
import {
	INITIAL_FOLDER_LOAD_DEPTH,
	MAX_FILE_SIZE_MEGABYTES
} from '../../../config';

import { existsSync } from 'fs';
import type { Stats } from 'fs';
import type { PageServerLoad } from './$types';

interface BodyReturn {
	files: WalkDirItem;
	baseDirectory: string;
	mimeType?: MimeType;
	content?: string;
	html?: string;
	error?: string;
	maximizeCodeBlockWidth?: boolean;
	stats: {
		size: number;
		lines?: number;
		chars?: number;
		words?: number;
	};
	[k: string]: any;
}

export const load: PageServerLoad = async function ({ params }) {
	const filePath = path.join(getBaseDirectory(), params.file);
	const files = await walkdir(getBaseDirectory(), INITIAL_FOLDER_LOAD_DEPTH);

	function generateErrorResponse(error: string, stats?: Stats) {
		return {
			files: files,
			error: error,
			baseDirectory: getBaseDirectory(),
			stats: { size: stats?.size || 0 }
		} as BodyReturn;
	}

	if (!existsSync(filePath)) {
		return generateErrorResponse('Path does not exist.');
	}

	let stats: Stats;

	try {
		stats = await stat(filePath);
	} catch (err: any) {
		return generateErrorResponse(err?.message);
	}

	if (stats.isDirectory()) {
		return generateErrorResponse('In directory.');
	}

	if (stats.size / 1_000_000 > MAX_FILE_SIZE_MEGABYTES) {
		return generateErrorResponse(
			'File exceeds max size of: ' + MAX_FILE_SIZE_MEGABYTES + ' MB.',
			stats
		);
	}

	const mimeType = getMimeType(filePath);
	const body: BodyReturn = {
		files: files,
		mimeType,
		baseDirectory: getBaseDirectory(),
		stats: {
			size: stats.size
		}
	};

	if (
		mimeType.genre === 'audio' ||
		mimeType.genre === 'video' ||
		mimeType.genre === 'image'
	) {
		body.content = '/serve/' + params.file;
		return body;
	}

	if (mimeType.genre === 'font') {
		return body;
	}

	if (mimeType.genre === 'text' || mimeType.genre === 'application') {
		const content = await readFile(filePath, 'utf-8');
		body.stats.lines = content.match(/\n/g)?.length || 0;
		body.stats.words = content.match(/[^\s]+/g)?.length || 0;
		body.stats.chars = content.match(/[^\s]/g)?.length || 0;

		switch (mimeType.specific) {
			case 'markdown':
				try {
					const post = await import(filePath);
					body.html = post.default
						.render()
						.html.replace(/<img src="([^"]*)"/g, (m: string, src: string) => {
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
				} catch (err) {
					// @ts-ignore
					return generateErrorResponse(err?.message, stats);
				}

				break;
			case 'typescript':
			case 'javascript':
			case 'json':
				body.html = highlighterWrapper(content, mimeType.specific);
				body.maximizeCodeBlockWidth = true;
				break;
			case 'x-scss':
				body.html = highlighterWrapper(content, 'sass');
				body.maximizeCodeBlockWidth = true;
				break;
			case 'plain':
				body.content = content;
				break;
			case 'plain-code':
				body.html = `<pre><code>${escapeSvelte(content)}</code></pre>`;
				body.maximizeCodeBlockWidth = true;
				break;
			default:
				if (mimeType.genre === 'application') {
					return generateErrorResponse(
						'Could not handle mime type of: ' + mimeType.full,
						stats
					);
				}

				body.html = highlighterWrapper(content, mimeType.specific);
				body.maximizeCodeBlockWidth = true;

				break;
		}

		return body;
	}

	return generateErrorResponse(
		'Could not handle mime type of: ' + mimeType.full,
		stats
	);
};
