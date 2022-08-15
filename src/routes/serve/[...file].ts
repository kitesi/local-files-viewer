import path from 'path';

import { readFile } from '../../mem-fs';
import { getMimeType } from '../../get-mime-types';
import { getBaseDirectory } from '../../base-directory';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params, url }: { params: any; url: URL }) {
	const filePath = path.join(getBaseDirectory(), params.file);

	const mimeType = getMimeType(filePath);

	return {
		headers: {
			'Content-Type': mimeType.full
		},
		body: await readFile(filePath, null)
	};
}
