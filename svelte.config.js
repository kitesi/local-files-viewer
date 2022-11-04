// @ts-check
import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 */

import { visit } from 'unist-util-visit';

const find = /\\\n/g;

/**
 * remark has escaped breaks built into change to <br>, but mdsvex is using an older version I belive
 * temp solution for now, stolen from: https://github.com/remarkjs/remark-breaks
 */
/**
 * @type {import('unified').Plugin<void[], Root>}
 */
function remarkEscapedBreaks() {
	return (tree) => {
		visit(tree, 'text', (node, index, parent) => {
			/** @type {PhrasingContent[]} */
			const result = [];
			let start = 0;

			find.lastIndex = 0;

			let match = find.exec(node.value);

			while (match) {
				const position = match.index;

				if (start !== position) {
					result.push({
						type: 'text',
						value: node.value.slice(start, position)
					});
				}

				result.push({ type: 'break' });
				start = position + match[0].length;
				match = find.exec(node.value);
			}

			if (result.length > 0 && parent && typeof index === 'number') {
				if (start < node.value.length) {
					result.push({ type: 'text', value: node.value.slice(start) });
				}

				parent.children.splice(index, 1, ...result);
				return index + result.length;
			}
		});
	};
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	extensions: ['.svelte'],
	preprocess: [preprocess()],
	kit: {
		adapter: adapter()
	}
};

export default config;
