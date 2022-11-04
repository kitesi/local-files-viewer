// @ts-check
import { createShikiHighlighter, renderCodeToHTML } from 'shiki-twoslash';
import { escape } from 'html-escaper';

const highlighter = await createShikiHighlighter({
	theme: 'github-dark'
});

/**
 *
 * @param {string} code
 * @param {string} lang
 * @param {string} [meta]
 * @returns {string}
 */
export function highlighterWrapper(code, lang = '', meta) {
	// could use npm package: fenceparser, but idk
	const lineHighlightsMatch = meta?.match(/{.+}/);
	/** @type {{[k:string]: true}} */
	const lineHighlights = {};

	if (lineHighlightsMatch && lineHighlightsMatch[0]) {
		for (const innerMatch of lineHighlightsMatch[0].match(/(\d+-?\d*)/g) ||
			[]) {
			lineHighlights[innerMatch] = true;
		}
	}

	// trim end to remove \n at the end that's usually there, might cause some errors
	if (code[code.length - 1] === '\n') {
		code = code.substring(0, code.length - 1);
	}

	const html = renderCodeToHTML(
		code,
		lang,
		{ highlight: lineHighlights },
		// @ts-ignore
		{},
		highlighter
	);

	return escape(html);
}
