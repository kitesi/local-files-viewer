let baseDirectory = '';

if (process.env.LFV_DEFAULT_FOLDER) {
	baseDirectory = process.env.LFV_DEFAULT_FOLDER;
} else {
	throw new Error('No base directory provided.');
}

export function getBaseDirectory() {
	return baseDirectory;
}
