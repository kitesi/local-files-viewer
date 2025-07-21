import path from 'path';
let baseDirectory = '';

// the user should not be able to navigate outside of this directory
let rootDirectory = '';

if (process.env.LFV_DEFAULT_FOLDER) {
	baseDirectory = path.resolve(process.env.LFV_DEFAULT_FOLDER);
} else {
	throw new Error('No base directory provided.');
}

if (process.env.LFV_ROOT_FOLDER) {
	rootDirectory = path.resolve(process.env.LFV_ROOT_FOLDER);
} else {
	rootDirectory = baseDirectory;
}

if (!baseDirectory.startsWith(rootDirectory)) {
	throw new Error(
		`Base directory ${baseDirectory} is not inside the root directory ${rootDirectory}.`
	);
}

export function getBaseDirectory() {
	return baseDirectory;
}

export function setBaseDirectory(dir: string) {
	baseDirectory = dir;
}

export function getRootDirectory() {
	return rootDirectory;
}
