import type { FileContentResponse } from '$/routes/api/file-content/+server';
import type { CompleteSearchResponse } from '$/routes/api/complete-search/+server';
import type { NewBaseDirSearchResponse } from '$/routes/api/new-base-dir-search/+server';
import type { GrepResponse } from '$/routes/api/grep/+server';

async function extractErrorMessage(
	response: Response,
	fallbackMessage: string
): Promise<string> {
	try {
		const contentType = response.headers.get('content-type');
		if (contentType?.includes('application/json')) {
			const json = await response.json();
			return json.error || json.message || fallbackMessage;
		} else {
			return fallbackMessage;
		}
	} catch {
		return fallbackMessage;
	}
}

enum ResponseType {
	JSON = 'json',
	TEXT = 'text'
}

async function fetchWithErrorHandling<T>(
	url: string,
	fallbackMessage: string,
	fetchOptions?: RequestInit,
	responseType: ResponseType = ResponseType.TEXT
): Promise<T> {
	const response = await fetch(url, fetchOptions);

	if (!response.ok) {
		const errorMessage = await extractErrorMessage(response, fallbackMessage);
		throw new Error(errorMessage);
	}

	if (responseType === ResponseType.TEXT) {
		return response.text() as T;
	} else {
		return response.json() as T;
	}
}

export class ApiClient {
	private baseUrl: string;

	constructor(baseUrl = '') {
		this.baseUrl = baseUrl;
	}

	/**
	 * Get file contents with syntax highlighting info
	 */
	async getFileContents(
		file: string,
		signal?: AbortSignal
	): Promise<FileContentResponse> {
		return await fetchWithErrorHandling<FileContentResponse>(
			`${this.baseUrl}/api/file-content?file=${encodeURIComponent(file)}`,
			'Error: unable to get file contents',
			{ signal },
			ResponseType.JSON
		);
	}

	/**
	 * Get syntax highlighting for a file
	 */
	async getSyntaxHighlighting(
		file: string,
		signal?: AbortSignal
	): Promise<string> {
		return await fetchWithErrorHandling<string>(
			`${this.baseUrl}/api/syntax-highlighting?file=${encodeURIComponent(file)}`,
			'Error: unable to get syntax highlighting',
			{ signal },
			ResponseType.TEXT
		);
	}

	/**
	 * Search for directories (used in file palette)
	 */
	async searchDirectories(query: string): Promise<NewBaseDirSearchResponse> {
		return await fetchWithErrorHandling<NewBaseDirSearchResponse>(
			`${this.baseUrl}/api/new-base-dir-search?query=${encodeURIComponent(query)}`,
			'Error: unable to search directories',
			{},
			ResponseType.JSON
		);
	}

	/**
	 * Complete search for directory contents (used in sidebar collapse)
	 */
	async completeSearch(
		dir: string,
		depth: number = 1
	): Promise<CompleteSearchResponse> {
		return await fetchWithErrorHandling<CompleteSearchResponse>(
			`${this.baseUrl}/api/complete-search?dir=${encodeURIComponent(dir)}&depth=${depth}`,
			'Error: unable to complete search',
			{},
			ResponseType.JSON
		);
	}

	/**
	 * Set new base directory
	 */
	async setNewBaseDir(dir: string): Promise<void> {
		await fetchWithErrorHandling<void>(
			`${this.baseUrl}/api/new-base-dir`,
			'Error: unable to set new base directory',
			{
				method: 'POST',
				body: JSON.stringify({ dir }),
				headers: {
					'Content-Type': 'application/json'
				}
			},
			ResponseType.TEXT
		);
	}

	/**
	 * Get font stylesheet for a file
	 */
	async getFontStylesheet(file: string): Promise<string> {
		return await fetchWithErrorHandling<string>(
			`${this.baseUrl}/api/font-stylesheet?file=${encodeURIComponent(file)}`,
			'Error: unable to get font stylesheet',
			{},
			ResponseType.TEXT
		);
	}

	/**
	 * Search through files using ripgrep
	 */
	async searchFiles(query: string, dir?: string): Promise<GrepResponse> {
		const params = new URLSearchParams({ q: query });
		if (dir) {
			params.append('dir', dir);
		}

		return await fetchWithErrorHandling<GrepResponse>(
			`${this.baseUrl}/api/grep?${params.toString()}`,
			'Error: unable to search files',
			{},
			ResponseType.JSON
		);
	}
}

// Create a singleton instance
export const apiClient = new ApiClient();
