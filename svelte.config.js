// @ts-check
import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';
import rehypeSlug from 'rehype-slug';
import { mdsvex } from 'mdsvex';
import { highlighterWrapper } from './highlight.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	extensions: ['.svelte', '.md'],
	preprocess: [
		preprocess(),
		mdsvex({
			extensions: ['.md'],
			rehypePlugins: [rehypeSlug],
			highlight: {
				highlighter: highlighterWrapper
			}
		})
	],
	kit: {
		adapter: adapter()
	}
};

export default config;
