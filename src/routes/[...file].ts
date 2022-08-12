import path from 'path';

import { compile } from 'mdsvex';
import { stat, walkdir, readdir, readFile, type WalkDirItem } from '../mem-fs';

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
		let current: WalkDirItem | undefined = allFiles;

		for (const file of params.file.split(path.sep)) {
			current = current?.children?.find((i) => i.name === file);
		}

		const readMeNames = ['readme.md', 'index.md'];
		const filesInDirectory = await readdir(filePath);

		const readMeFile = filesInDirectory.find((f) =>
			readMeNames.includes(f.toLowerCase())
		);

		return {
			body: {
				files: allFiles,
				markdownHTML:
					readMeFile &&
					(await compile(await readFile(path.join(filePath, readMeFile))))?.code
			}
		};
	}

	let content = await readFile(filePath);
	let markdownHTML: string | undefined = '';

	if (filePath.endsWith('.md')) {
		markdownHTML = (await compile(content))?.code;
		// mdsvex adds {@html `<code>....</code>`} for some reason.
		markdownHTML = markdownHTML?.replace('{@html `', '').replace('`}', '');
	}

	return {
		body: {
			content,
			markdownHTML,
			files: allFiles
		}
	};
}
