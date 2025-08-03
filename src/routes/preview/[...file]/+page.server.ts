import path from 'path';
import { stat, walkdir, type WalkDirItem } from '$lib/server-utils/mem-fs';
import { getBaseDirectory } from '$lib/server-utils/directory-variables';
import {
	INITIAL_FOLDER_LOAD_DEPTH,
	MAX_FILE_SIZE_MEGABYTES
} from '$lib/config';

import { existsSync } from 'fs';
import type { Stats } from 'fs';
import type { PageServerLoad } from './$types';
import { getMimeType, type MimeType } from '$/lib/server-utils/get-mime-types';

interface PageData {
	files: WalkDirItem;
	baseDirectory: string;
	error?: string;
	size: number;
	mimeType?: MimeType;
	[k: string]: any;
}

export const load: PageServerLoad = async function ({ params }) {
	const filePath = path.join(getBaseDirectory(), params.file);

	if (!filePath.startsWith(getBaseDirectory())) {
		return generateErrorResponse('Path is not in the base directory.');
	}

	const files = await walkdir(getBaseDirectory(), INITIAL_FOLDER_LOAD_DEPTH);

	function generateErrorResponse(error: string, stats?: Stats) {
		return {
			files: files,
			error: error,
			baseDirectory: getBaseDirectory(),
			size: stats?.size || 0
		} as PageData;
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

	const body: PageData = {
		files: files,
		baseDirectory: getBaseDirectory(),
		size: stats.size,
		mimeType: getMimeType(filePath)
	};

	return body;
};
