import path from 'path';

import { readFile } from '../../../mem-fs';
import { getMimeType } from '../../../get-mime-types';
import { getBaseDirectory } from '../../../base-directory';

export const GET = async function ({ params }: { params: any }) {
	const filePath = path.join(getBaseDirectory(), params.file);

	const mimeType = getMimeType(filePath);

	return new Response(await readFile(filePath, null), {
		headers: {
			'Content-Type': mimeType.full
		}
	});
};
