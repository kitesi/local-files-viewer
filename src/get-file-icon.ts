import {
	siJavascript,
	siMarkdown,
	siCss3,
	siHtml5,
	siTypescript,
	siJson,
	siPython,
	siGit,
	siSvg,
	siSass,
	siPrettier,
	siNpm,
	siSvelte
} from 'simple-icons/icons';
import type { SimpleIcon } from 'simple-icons';

interface Style {
	fill?: string;
}

function addStylesProp(
	simpleIcon: SimpleIcon,
	styles: Style = { fill: 'currentColor' }
) {
	return {
		simpleIcon,
		styles
	};
}

export function getFileIcon(file: string) {
	const extMatches = file.match(/\.[^.]+$/);

	if (!extMatches || !extMatches[0]) {
		return;
	}

	switch (extMatches[0].toLowerCase()) {
		case '.js':
		case '.cjs':
		case '.mjs':
			return addStylesProp(siJavascript, { fill: '#F7DF1E' });
		case '.md':
		case '.markdown':
			return addStylesProp(siMarkdown);
		case '.css':
			return addStylesProp(siCss3, { fill: '#1572B6' });
		case '.html':
			return addStylesProp(siHtml5, { fill: '#E34F26' });
		case '.ts':
			return addStylesProp(siTypescript, { fill: '#007ACC' });
		case '.json':
			return addStylesProp(siJson);
		case '.py':
			return addStylesProp(siPython);
		case '.gitignore':
			return addStylesProp(siGit);
		case '.svg':
			return addStylesProp(siSvg);
		case '.sass':
		case '.scss':
			return addStylesProp(siSass, { fill: '#CC6699' });
		case '.prettierignore':
		case '.prettierrc':
			return addStylesProp(siPrettier);
		case '.svelte':
			return addStylesProp(siSvelte, { fill: '#FF3E00' });
		case '.npmrc':
			return addStylesProp(siNpm, { fill: '#CB3837' });
		case '.png':
		case '.jpeg':
		case '.jpg':
		case '.gif':
		case '.webp':
		case '.tiff':
			return;
		// return 'image';
		case '.mov':
		case '.mp4':
		case '.avi':
		case '.flv':
		case '.wmf':
		case '.webm':
			return;
		// return 'video';
	}
}
