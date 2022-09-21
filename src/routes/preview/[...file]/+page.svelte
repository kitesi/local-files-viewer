<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import FilePallete from '$lib/components/FilePallete.svelte';
	import ErrorTray from '$lib/components/ErrorTray.svelte';
	import * as stores from '../../../stores';
	import * as mappings from '../../../key-mappings';
	import { getWalkdirItem } from '../../../get-walkdir-item';
	import { formatBytes } from '../../../format-bytes';

	import { afterUpdate } from 'svelte';
	import { get } from 'svelte/store';

	import { dev } from '$app/env';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import '$lib/styles/github-doc.scss';
	import '$lib/styles/shiki.css';
	import '$lib/styles/doc.scss';

	import type { PageData } from './$types';

	export let data: PageData;

	let { error, files, html, content, mimeType, maximizeCodeBlockWidth, stats } =
		data;

	$: {
		({ files, html, content, mimeType, error, maximizeCodeBlockWidth, stats } =
			data);
		stores.baseDirectory.set(data.baseDirectory);
	}

	stores.files.set(files);

	function handleKey(ev: KeyboardEvent) {
		if (ev.key === 'p' && ev.ctrlKey) {
			ev.preventDefault();
			stores.modalState.update((u) =>
				u !== 'choose-file' ? 'choose-file' : ''
			);

			return;
		}

		if (ev.key === 'o' && ev.ctrlKey) {
			ev.preventDefault();
			stores.modalState.update((u) =>
				u !== 'choose-directory' ? 'choose-directory' : ''
			);

			return;
		}

		if (!mappings.single.includes(ev.key)) {
			return;
		}

		const paths = $page.params.file.split('/');
		const file = paths.pop();

		const itemChildren = getWalkdirItem(
			paths,
			get(stores.files)
		).children?.filter((e) => !e.isDirectory);

		if (!itemChildren) {
			return;
		}

		let index = itemChildren.findIndex((e) => e.name === file);

		if (index === -1) {
			return;
		}

		if (ev.key === 'h') {
			if (index - 1 < 0) {
				index = itemChildren.length - 1;
			} else {
				index -= 1;
			}
		} else if (ev.key === 'l') {
			if (index + 1 > itemChildren.length - 1) {
				index = 0;
			} else {
				index += 1;
			}
		}

		let path = '/preview/' + paths.join('/');

		if (paths.length > 0) {
			path += '/';
		}

		path += itemChildren[index].name;
		const active = document.getElementsByClassName('active')[0];
		const currentATag = document.querySelector(`a[href="${path}"]`);

		active?.classList.remove('active');
		currentATag?.classList.add('active');

		goto(path);
	}

	const fontCharacters =
		'abcdefghijklmnoqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789()-_=+~`!@#$%^&*[]{}\\|;:\'",.<>/?'.split(
			''
		);

	let outlineHeadings: NodeListOf<Element> | null;

	afterUpdate(() => {
		outlineHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

		// sveltekit has hot refresh development, although
		// when you are in a section in the page with the #fragments (<a href="#section"></a>),
		// and you save some changes, the website is reloaded without
		// taking the hash into consideration. This scrolls it back
		// to the right position, but the element does not get the :target attribute
		if (dev) {
			const hash = window.location.hash;
			const el = hash && document.getElementById(hash.slice(1));

			if (el) {
				el.scrollIntoView();
			}
		}
	});
</script>

<svelte:window on:keydown={handleKey} />

<FilePallete />

<svelte:head>
	<link
		rel="stylesheet"
		href={'/info?action=get-font-stylesheet&file=' + $page.params.file}
		type="text/css"
	/>
</svelte:head>

<main>
	<Sidebar {outlineHeadings} {stats} />
	<section class="markdown-body">
		{#if error}
			<h1>{error}</h1>
			{#if stats.size}
				<h2>Size: {formatBytes(stats.size)}</h2>
			{/if}
		{:else if html}
			{#if maximizeCodeBlockWidth}
				{@html html}
			{:else}
				<div class="markdown-content">
					{@html html}
				</div>
			{/if}

			{#if mimeType?.specific === 'html'}
				<iframe title="" src={'/serve/' + $page.params.file} frameborder="0" />
			{/if}
		{:else if mimeType?.genre === 'font'}
			<div class="font-container">
				{#each fontCharacters as char}
					<p>{char}</p>
				{/each}
			</div>
		{:else if mimeType?.genre === 'image'}
			<div class="center">
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
		{/if}
	</section>
</main>

<ErrorTray />

<style lang="scss">
	@use '../../../lib/styles/variables.scss' as *;
	.font-container {
		display: flex;
		flex-wrap: wrap;
		font-family: 'placeholder', Arial;
		align-content: center;
		height: 100%;
		max-width: 60ch;
		margin: auto;
	}

	.font-container p {
		padding: 5px;
		font-size: 2rem;
	}

	main {
		height: 100%;
		width: 100%;
	}

	p {
		white-space: pre-wrap;
		max-width: 80ch;
		font-size: 1.1rem;
		margin-inline: auto;
		padding-block: min(100px, calc((100% - 80ch) / 2));
	}

	iframe {
		width: 100%;
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

	.markdown-content {
		--max-width: 90ch;
		max-width: var(--max-width);
		margin-inline: auto;
		padding-block: min(100px, calc((100% - var(--max-width)) / 2));
	}

	.center {
		display: grid;
		place-items: center;
		height: 100%;
		overflow: auto;
	}

	@media screen and (min-width: $size-1) {
		main {
			display: grid;
			grid-template-columns: auto 1fr;
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
