<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import * as stores from '../../stores';

	import '$lib/styles/doc.scss';
	import '$lib/styles/prism.css';
	import type { MimeType } from '../../get-mime-types';
	import type { WalkDirItem } from '../../mem-fs';

	export let error: any;
	export let html: string;
	export let content: string;
	export let mimeType: MimeType | undefined;
	export let unknownMimeType: boolean;

	export let files: WalkDirItem;

	stores.files.set(files);
</script>

<main>
	<Navbar />
	<section class="markdown-body">
		{#if error}
			<h1>{error}</h1>
		{:else if html}
			{@html html}
		{:else if mimeType?.genre === 'image'}
			<div>
				<img src={content} alt="" />
			</div>
		{:else if mimeType?.genre === 'audio'}
			<audio controls>
				<source src={content} />
				Your browser does not support the audio element.
			</audio>
		{:else if mimeType?.genre === 'video'}
			<video controls>
				<source src={content} />
				<track kind="captions" />
				Your browser does not support the audio element. track
			</video>
		{:else if content !== undefined}
			<p>{content}</p>
		{:else if unknownMimeType}
			<h1>
				Could not handle mime type of: {mimeType?.full}
			</h1>
		{:else}
			<h1>In Directory.</h1>
		{/if}
	</section>
</main>

<style lang="scss">
	@use '../../lib/styles/variables.scss' as *;

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
