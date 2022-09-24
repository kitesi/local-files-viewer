import path from 'path';
import { stat, walkdir, type WalkDirItem } from '../../../mem-fs';
import { getMimeType, type MimeType } from '../../../get-mime-types';
import { getBaseDirectory } from '../../../base-directory';
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
	error?: string;
	size: number;
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
			size: stats?.size || 0
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
		size: stats.size
	};

	return body;
};
