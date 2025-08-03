import path from 'path';

import { readFile } from '../../../lib/server-utils/mem-fs';
import { getMimeType } from '../../../lib/server-utils/get-mime-types';
import { resolveUserPathWithinRoot } from '$/lib/server-utils/resolve-user-path';

export const GET = async function ({ params }: { params: any }) {
	let filePath = resolveUserPathWithinRoot(params.file, false);
	const mimeType = getMimeType(filePath);

	return new Response(await readFile(filePath, null), {
		headers: {
			'Content-Type': mimeType.full
		}
	});
};
