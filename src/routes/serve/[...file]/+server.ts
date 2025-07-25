import path from 'path';

import { readFile } from '../../../lib/server-utils/mem-fs';
import { getMimeType } from '../../../lib/server-utils/get-mime-types';
import { getBaseDirectory } from '../../../lib/server-utils/directory-variables';

export const GET = async function ({ params }: { params: any }) {
	const filePath = path.join(getBaseDirectory(), params.file);

	const mimeType = getMimeType(filePath);

	return new Response(await readFile(filePath, null), {
		headers: {
			'Content-Type': mimeType.full
		}
	});
};
