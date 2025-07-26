import { getBaseDirectory } from '$lib/server-utils/directory-variables';
import { walkdir } from '$lib/server-utils/mem-fs';
import { SEARCH_STRATEGIES } from '$lib/config';
import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

export interface FileSearchResponse {
	results: {
		file: string;
		path: string;
		isDirectory: boolean;
		matchType: 'filename' | 'content' | 'path';
		line?: number;
		text?: string;
	}[];
	searchStrategy: string;
	totalResults: number;
}

// Check if a command is available
async function commandExists(command: string): Promise<boolean> {
	return new Promise((resolve) => {
		const check = spawn('which', [command]);
		check.on('close', (code) => resolve(code === 0));
	});
}

// Search using ripgrep (fastest for content search)
async function searchWithRipgrep(
	query: string,
	searchDir: string
): Promise<FileSearchResponse['results']> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			rg.kill();
			reject(new Error('Search timeout'));
		}, SEARCH_STRATEGIES.SEARCH_TIMEOUT);

		const rg = spawn('rg', ['--json', query, searchDir]);

		let results: FileSearchResponse['results'] = [];
		let errorOutput = '';
		rg.stdout.on('data', (data) => {
			const lines = data.toString().split('\n').filter(Boolean);
			for (const line of lines) {
				try {
					const obj = JSON.parse(line);
					if (obj.type === 'match') {
						results.push({
							file: path.basename(obj.data.path.text),
							path: obj.data.path.text.replace(searchDir, ''),
							isDirectory: false,
							matchType: 'content',
							line: obj.data.line_number,
							text: obj.data.lines.text.trim()
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
			clearTimeout(timeout);
			if (code !== 0 && !results.length) {
				reject(new Error(errorOutput || 'ripgrep failed'));
			} else {
				resolve(results);
			}
		});
	});
}

// Search using find command (good for filename search)
async function searchWithFind(
	query: string,
	searchDir: string
): Promise<FileSearchResponse['results']> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			find.kill();
			reject(new Error('Search timeout'));
		}, SEARCH_STRATEGIES.SEARCH_TIMEOUT);

		const find = spawn('find', [
			searchDir,
			'-iname',
			`*${query}*`,
			'-type',
			'f',
			'-printf',
			'%P\n'
		]);

		let results: FileSearchResponse['results'] = [];
		let errorOutput = '';

		find.stdout.on('data', (data) => {
			const files = data.toString().split('\n').filter(Boolean);
			results.push(
				...files.map((file: string) => ({
					file: path.basename(file),
					path: file.replace(searchDir + '/', ''),
					isDirectory: false,
					matchType: 'filename'
				}))
			);
		});

		find.stderr.on('data', (data) => {
			errorOutput += data.toString();
		});

		find.on('close', (code) => {
			clearTimeout(timeout);
			if (code !== 0 && !results.length) {
				reject(new Error(errorOutput || 'find failed'));
			} else {
				resolve(results);
			}
		});
	});
}

// Search in memory (fallback when external tools aren't available)
async function searchInMemory(
	query: string,
	searchDir: string
): Promise<FileSearchResponse['results']> {
	const files = await walkdir(searchDir, Infinity);
	const results: FileSearchResponse['results'] = [];
	const timeout = setTimeout(() => {
		throw new Error('Search timeout');
	}, SEARCH_STRATEGIES.SEARCH_TIMEOUT);

	function searchRecursive(item: any, currentPath: string = '') {
		const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

		// Check filename match
		if (item.name.toLowerCase().includes(query.toLowerCase())) {
			results.push({
				file: item.name,
				path: itemPath,
				isDirectory: item.isDirectory,
				matchType: 'filename'
			});
		}

		// Recursively search children
		if (item.children) {
			for (const child of item.children) {
				searchRecursive(child, itemPath);
			}
		}
	}

	searchRecursive(files);
	clearTimeout(timeout);
	return results;
}

export const GET: RequestHandler = async function ({ url }) {
	const query = url.searchParams.get('q');
	const searchType = url.searchParams.get('type'); // 'filename' or 'content'
	const dir = url.searchParams.get('dir') || getBaseDirectory();

	if (!query) {
		return error(400, 'Missing search query');
	}

	if (searchType !== 'filename' && searchType !== 'content') {
		return error(400, "Search type must be 'filename' or 'content'");
	}

	const searchDir = path.isAbsolute(dir)
		? dir
		: path.join(getBaseDirectory(), dir);

	if (!existsSync(searchDir)) {
		return error(400, 'Search directory does not exist');
	}

	let results: FileSearchResponse['results'] = [];
	let searchStrategy = '';

	try {
		// Strategy 1: Use ripgrep for content search
		if (searchType === 'content' && SEARCH_STRATEGIES.USE_RIPGREP) {
			const ripgrepAvailable = await commandExists('rg');
			if (ripgrepAvailable) {
				try {
					const ripgrepResults = await searchWithRipgrep(query, searchDir);
					results.push(...ripgrepResults);
					searchStrategy = 'ripgrep';
				} catch (e) {
					console.warn('Ripgrep search failed', e);

					if (searchType === 'content') {
						throw new Error('Ripgrep search failed');
					}
				}
			} else {
				if (searchType === 'content') {
					throw new Error('ripgrep is not installed');
				}
			}
		}

		// Strategy 2: Use find for filename search
		if (searchType === 'filename' && SEARCH_STRATEGIES.USE_FIND) {
			const findAvailable = await commandExists('find');
			if (findAvailable) {
				try {
					const findResults = await searchWithFind(query, searchDir);
					results.push(...findResults);
					searchStrategy = 'find';
				} catch (e) {
					console.warn('Find search failed, falling back to memory search:', e);
				}
			}
		}

		// Strategy 3: Fallback to in-memory search
		if (
			SEARCH_STRATEGIES.USE_MEMORY_SEARCH &&
			searchType === 'filename' &&
			results.length === 0
		) {
			try {
				const memoryResults = await searchInMemory(query, searchDir);
				results.push(...memoryResults);
				searchStrategy = 'memory';
			} catch (e) {
				console.error('Memory search failed:', e);
				throw new Error('All search strategies failed');
			}
		}

		// Remove duplicates and limit results
		const uniqueResults = results
			.filter(
				(result, index, self) =>
					index === self.findIndex((r) => r.path === result.path)
			)
			.slice(0, 100); // Limit to 100 results

		return json({
			results: uniqueResults,
			searchStrategy,
			totalResults: uniqueResults.length
		});
	} catch (err) {
		if (err instanceof Error) {
			return error(500, err.message);
		} else {
			return error(500, 'Search failed');
		}
	}
};
