import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	optimizeDeps: {
		// Pre-bundle heavy deps so first markdown/code request isn't slow
		include: [
			'shiki',
			'unified',
			'remark-parse',
			'remark-gfm',
			'remark-math',
			'remark-rehype',
			'rehype-stringify',
			'rehype-raw',
			'rehype-slug',
			'rehype-katex',
			'@shikijs/rehype',
			'@shikijs/transformers',
			'unist-util-visit'
		]
	}
});
