import path from 'path';

import { readFile } from '../../mem-fs';
import { getMimeType } from '../../get-mime-types';

let baseDirectory: string = '';

if (process.env.LFV_DEFAULT_FOLDER) {
	baseDirectory = process.env.LFV_DEFAULT_FOLDER;
} else {
	throw new Error('No base directory provided.');
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params, url }: { params: any; url: URL }) {
	const filePath = path.join(baseDirectory, params.file);

	const mimeType = getMimeType(filePath);

	return {
		headers: {
			'Content-Type': mimeType.full
		},
		body: await readFile(filePath, null)
	};
}
