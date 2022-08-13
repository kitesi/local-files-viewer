<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Prism from 'prismjs';

	import type { WalkDirItem } from 'src/mem-fs';
	import '../doc.scss';

	export let error: any;
	export let markdownHTML: string;
	export let content: string;
	export let mimeType: string | false;
	export let unknownMimeType: boolean;
	export let files: WalkDirItem;

	const imageMimeTypes = ['image/webp', 'image/jpeg', 'image/png'];
	const audioMimeTypes = ['audio/mp4', 'audio/mpeg'];

	const languages: { [k: string]: string } = {
		json: 'json',
		'x-sh': 'shell',
		javascript: 'js',
		css: 'css',
		html: 'html'
	};

	let stripedLanguage = '';
	let isProgrammingFile = false;

	$: stripedLanguage =
		(mimeType && mimeType.replace(/(text|application)\//, '')) || '';
	$: isProgrammingFile = stripedLanguage in languages;
</script>

<main>
	<Navbar {files} />
	<section class="markdown-body">
		{#if error}
			<h1>{error}</h1>
		{:else if markdownHTML}
			{@html markdownHTML}
		{:else if mimeType && imageMimeTypes.includes(mimeType)}
			<div>
				<img src={content} alt="" />
			</div>
		{:else if mimeType && audioMimeTypes.includes(mimeType)}
			<audio controls>
				<source src={content} />
				Your browser does not support the audio element.
			</audio>
		{:else if isProgrammingFile}
			<pre><code class={'language-' + languages[stripedLanguage]}
					>{content}</code
				></pre>
		{:else if content !== undefined}
			<p>{content}</p>
		{:else if unknownMimeType}
			<h1>
				Could not handle mime type of: {mimeType}
			</h1>
		{:else}
			<h1>In Directory.</h1>
		{/if}
	</section>
</main>

<style lang="scss">
	@use '../variables.scss' as *;

	main {
		height: 100%;
		width: 100%;
	}

	p {
		white-space: pre-wrap;
		max-width: 90ch;
		font-size: 1.1rem;
	}

	main {
		height: 100%;
	}

	audio {
		width: 100%;
	}

	section {
		padding: 20px;
		height: 100%;
		width: 100%;
		overflow: auto;
		scroll-behavior: smooth;
	}

	div {
		display: grid;
		place-items: center;
		min-height: 100%;
		overflow: auto;
	}

	@media screen and (min-width: $size-1) {
		main {
			display: flex;
		}

		:global(pre code) {
			font-size: 1.1rem;
		}
	}

	@media screen and (min-width: $size-2) {
		:root {
			font-size: 18px;
		}
	}
</style>
