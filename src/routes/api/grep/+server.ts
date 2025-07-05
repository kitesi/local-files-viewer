import { getBaseDirectory } from '$lib/server-utils/base-directory';
import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import path from 'path';

export const GET: RequestHandler = async function ({ url }) {
	const query = url.searchParams.get('q');
	const dir = url.searchParams.get('dir') || getBaseDirectory();

	if (!query) {
		return error(400, 'Missing search query');
	}

	const searchDir = path.isAbsolute(dir)
		? dir
		: path.join(getBaseDirectory(), dir);

	return new Promise((resolve) => {
		const rg = spawn('rg', ['--json', query, searchDir]);
		let results: any[] = [];
		let errorOutput = '';

		rg.stdout.on('data', (data) => {
			const lines = data.toString().split('\n').filter(Boolean);
			for (const line of lines) {
				try {
					const obj = JSON.parse(line);
					if (obj.type === 'match') {
						results.push({
							file: obj.data.path.text
								.replace(getBaseDirectory() + '/', '')
								.replace(getBaseDirectory(), ''),
							line: obj.data.line_number,
							text: obj.data.lines.text
						});
					}
				} catch (e) {
					// ignore parse errors
				}
			}
		});

		rg.stderr.on('data', (data) => {
			errorOutput += data.toString();
		});

		rg.on('close', (code) => {
			if (code !== 0 && !results.length) {
				resolve(error(500, errorOutput || 'ripgrep failed'));
			} else {
				resolve(json({ results }));
			}
		});
	});
};
