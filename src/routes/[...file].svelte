<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import type { WalkDirItem } from 'src/mem-fs';
	import '../doc.scss';

	export let error: any;
	export let markdownHTML: string;
	export let content: string;
	export let files: WalkDirItem;
</script>

<main>
	<Navbar {files} />
	<section class="markdown-body">
		{#if error}
			<h1>{error}</h1>
		{:else if markdownHTML}
			{@html markdownHTML}
		{:else if content}
			<p>{content}</p>
		{:else}
			<h1>No entry file for this folder.</h1>
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
		max-width: 80ch;
	}

	main {
		height: 100%;
	}

	section {
		padding: 20px;
		height: 100%;
		width: 100%;
		overflow: auto;
		scroll-behavior: smooth;
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
