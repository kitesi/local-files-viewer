import path from 'path';
import mime from 'mime-types';
import { compile } from 'mdsvex';
import { stat, walkdir, readFile } from '../mem-fs';

import { existsSync } from 'fs';

import type { Stats } from 'fs';

let baseDirectory: string = '';

if (process.env.LFV_DEFAULT_FOLDER) {
	baseDirectory = process.env.LFV_DEFAULT_FOLDER;
} else {
	throw new Error('No base directory provided.');
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

	const mimeType = mime.lookup(filePath);
	const body: { [k: string]: any } = {
		files: allFiles,
		mimeType
	};

	switch (mimeType) {
		case 'text/plain':
		case 'text/html':
		case 'application/x-sh':
		case 'application/json':
		case 'application/css':
		case 'application/javascript':
		case false:
			body.content = await readFile(filePath);
			break;
		case 'image/webp':
		case 'image/jpeg':
		case 'image/png':
		case 'audio/mpeg':
		case 'audio/mp4':
			body.content =
				'data:' + mimeType + ';base64,' + (await readFile(filePath, 'base64'));
			break;
		case 'text/markdown':
			let markdownHTML = (await compile(await readFile(filePath)))?.code;
			// mdsvex adds {@html `<code>....</code>`} for some reason.
			markdownHTML = markdownHTML?.replace('{@html `', '').replace('`}', '');
			body.markdownHTML = markdownHTML;
			break;
		default:
			body.unknownMimeType = true;
	}

	return {
		body
	};
}
