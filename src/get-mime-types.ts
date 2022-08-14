import mime from 'mime-types';

type Genre =
	| 'text'
	| 'application'
	| 'video'
	| 'x-conference'
	| 'model'
	| 'font'
	| 'chemical'
	| 'audio'
	| 'image'
	| 'messsage'
	| 'unknown';

export interface MimeType {
	genre: Genre;
	specific: string;
	full: string;
}

export function getMimeType(file: string): MimeType {
	if (file.endsWith('.ts') || file.endsWith('.d.ts')) {
		return { genre: 'text', specific: 'typescript', full: 'text/typescript' };
	}

	const plains = [
		'.npmrc',
		'.prettierrc',
		'.prettierignore',
		'.gitignore',
		'.svelte'
	];

	if (plains.some((p) => file.endsWith(p))) {
		return { genre: 'text', specific: 'plain-code', full: 'text/plain-code' };
	}

	const mimeType = mime.lookup(file);
	let genre: Genre = 'unknown';
	let specific = 'unknown';

	if (mimeType) {
		const splitContent = mimeType.split('/');
		genre = splitContent[0] as Genre;
		specific = splitContent[1];
	}

	return { genre, specific, full: genre + '/' + specific };
}
