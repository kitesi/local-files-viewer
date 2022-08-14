<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import { escape, unescape } from 'html-escaper';

	import type { WalkDirItem } from 'src/mem-fs';
	import '../doc.scss';
	import '../prism.css';
	import type { Genre } from './[...file]';

	export let error: any;
	export let html: string;
	export let content: string;
	export let fullMimeType: string;
	export let mimeTypeGenre: Genre;
	export let unknownMimeType: boolean;
	export let files: WalkDirItem;
</script>

<main>
	<Navbar {files} />
	<section class="markdown-body">
		{#if error}
			<h1>{error}</h1>
		{:else if html}
			{@html html}
		{:else if mimeTypeGenre === 'image'}
			<div>
				<img src={content} alt="" />
			</div>
		{:else if mimeTypeGenre === 'audio'}
			<audio controls>
				<source src={content} />
				Your browser does not support the audio element.
			</audio>
		{:else if mimeTypeGenre === 'video'}
			<video controls>
				<source src={content} />
				<track kind="captions" />
				Your browser does not support the audio element. track
			</video>
		{:else if content !== undefined}
			<p>{content}</p>
		{:else if unknownMimeType}
			<h1>
				Could not handle mime type of: {fullMimeType}
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
