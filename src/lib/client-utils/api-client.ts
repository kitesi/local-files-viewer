// API Client for handling all server requests
export interface FileContentResponse {
	content?: string;
	html?: string;
	error?: string;
	stats?: {
		chars?: number;
		lines?: number;
		words?: number;
	};
	needsHighlighting?: boolean;
	maximizeCodeBlockWidth?: boolean;
}

export interface DirectorySearchResponse {
	files: string[];
	homedir: string;
}

export interface CompleteSearchResponse {
	files: {
		name: string;
		isDirectory: boolean;
		children?: any[];
	};
}

export interface NewBaseDirResponse {
	error?: string;
	success?: boolean;
}

export interface SearchResponse {
	results: Array<{
		file: string;
		line: number;
		text: string;
	}>;
}

// Helper function to extract error message from response
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

// Generic fetch with proper error handling
async function fetchWithErrorHandling<T>(
	url: string,
	fallbackMessage: string,
	options?: RequestInit & {
		signal?: AbortSignal;
		responseType?: 'json' | 'text';
	}
): Promise<T> {
	const response = await fetch(url, options);

	if (!response.ok) {
		const errorMessage = await extractErrorMessage(response, fallbackMessage);
		throw new Error(errorMessage);
	}

	const responseType = options?.responseType || 'json';

	if (responseType === 'text') {
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
			{ signal, responseType: 'json' }
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
			{ signal, responseType: 'text' }
		);
	}

	/**
	 * Search for directories (used in file palette)
	 */
	async searchDirectories(query: string): Promise<DirectorySearchResponse> {
		return await fetchWithErrorHandling<DirectorySearchResponse>(
			`${this.baseUrl}/api/new-base-dir-search?query=${encodeURIComponent(query)}`,
			'Error: unable to search directories',
			{ responseType: 'json' }
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
			{ responseType: 'json' }
		);
	}

	/**
	 * Set new base directory
	 */
	async setNewBaseDir(dir: string): Promise<NewBaseDirResponse> {
		return await fetchWithErrorHandling<NewBaseDirResponse>(
			`${this.baseUrl}/api/new-base-dir`,
			'Error: unable to set new base directory',
			{
				method: 'POST',
				body: JSON.stringify({ dir }),
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json'
			}
		);
	}

	/**
	 * Get font stylesheet for a file
	 */
	async getFontStylesheet(file: string): Promise<string> {
		return await fetchWithErrorHandling<string>(
			`${this.baseUrl}/api/font-stylesheet?file=${encodeURIComponent(file)}`,
			'Error: unable to get font stylesheet',
			{ responseType: 'text' }
		);
	}

	/**
	 * Search through files using ripgrep
	 */
	async searchFiles(query: string, dir?: string): Promise<SearchResponse> {
		const params = new URLSearchParams({ q: query });
		if (dir) {
			params.append('dir', dir);
		}

		return await fetchWithErrorHandling<SearchResponse>(
			`${this.baseUrl}/api/grep?${params.toString()}`,
			'Error: unable to search files',
			{ responseType: 'json' }
		);
	}
}

// Create a singleton instance
export const apiClient = new ApiClient();
