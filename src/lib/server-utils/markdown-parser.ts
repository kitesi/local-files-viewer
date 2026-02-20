/**
 * Lazy-loaded markdown parser. Only the first markdown request pays the cost of
 * loading unified/remark/rehype/Shiki. Shiki is configured with a small set of
 * initial languages and lazy: true so other languages load on demand (avoids
 * loading 100+ grammars up front).
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGemoji from 'remark-gemoji';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import rehypeShiki from '@shikijs/rehype';
import type { RehypeShikiOptions } from '@shikijs/rehype';
import { transformerMetaHighlight } from '@shikijs/transformers';
import path from 'path';

function rehypeAddLineNumbers() {
	return (tree: any) => {
		visit(tree, (node: any) => {
			if (
				node.position &&
				node.properties &&
				typeof node.position.start?.line === 'number'
			) {
				node.properties['data-line'] = node.position.start.line;
				node.properties['id'] = `L${node.position.start.line}`;
			}
		});
	};
}

// Load only common langs upfront; others load on demand (lazy: true)
const shikiOptions: RehypeShikiOptions = {
	theme: 'github-dark',
	defaultLanguage: 'plaintext',
	transformers: [transformerMetaHighlight()],
	langs: [
		'markdown',
		'md',
		'javascript',
		'js',
		'typescript',
		'ts',
		'json',
		'html',
		'css',
		'scss',
		'bash',
		'shell',
		'sh',
		'yaml',
		'yml',
		'xml',
		'plaintext'
	] as RehypeShikiOptions['langs'],
	lazy: true
};

let parserPromise: Promise<ReturnType<typeof buildParser>> | null = null;

function buildParser() {
	return unified()
		.use(remarkParse)
		.use(remarkGemoji)
		.use(remarkGfm)
		.use(remarkMath)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeShiki, shikiOptions)
		.use(rehypeRaw)
		.use(rehypeSlug)
		.use(rehypeKatex)
		.use(rehypeStringify)
		.use(rehypeAddLineNumbers);
}

async function getParser() {
	if (!parserPromise) {
		parserPromise = Promise.resolve(buildParser());
	}
	return parserPromise;
}

export async function parseMarkdownToHtml(
	content: string,
	filePathParam: string
): Promise<string> {
	const parser = await getParser();
	const vfile = await parser.process(content);
	let html = String(vfile);
	// Rewrite relative image src to /serve/...
	html = html.replace(
		/<img src="([^"]*)"/g,
		(m: string, src: string) => {
			if (src.startsWith('http')) return m;
			const dirname = src.startsWith('/') ? '' : path.dirname(filePathParam);
			if (dirname === '.') return `<img src="/serve/${src}"`;
			return `<img src="/serve/${path.join(dirname, src)}"`;
		}
	);
	return html;
}
