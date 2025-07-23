// how many levels of items should be auto collapsed in outline
export const OUTLINE_HEADING_LEVEL_AUTO_COLLAPSE = 3;
// how many folders should be recursively read through on initial load
// can set to Infinity aswell
export const INITIAL_FOLDER_LOAD_DEPTH = 1;

export const MAX_FILE_SIZE_MEGABYTES = 10;

export const DEFAULT_ERROR_MESSAGE_TIMEOUT = 2000;

// iframe sandbox attributes to use
export const HTML_SANDBOX_ATTR = '';

// iframe sandbox attributes to use, if null, there is no sandbox
export const PDF_SANDBOX_ATTR = 'allow-scripts';

export const OUTLINE_OPEN_DEFAULT_STATUS = true;

// Search configuration
export const SEARCH_STRATEGIES = {
	// Use ripgrep (rg) for fast file content search
	USE_RIPGREP: true,
	// Use find command for file name search (fallback)
	USE_FIND: true,
	// Use in-memory search as last resort
	USE_MEMORY_SEARCH: true,
	// Maximum files to search in memory before falling back to external tools
	MAX_MEMORY_SEARCH_FILES: 10000,
	// Search timeout in milliseconds
	SEARCH_TIMEOUT: 10000
} as const;
