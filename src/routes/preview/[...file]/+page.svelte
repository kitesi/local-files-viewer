<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import FilePalette from '$lib/components/FilePalette.svelte';
	import SearchPalette from '$lib/components/SearchPalette.svelte';
	import ErrorTray from '$lib/components/ErrorTray.svelte';
	import * as stores from '$lib/stores/index';
	import mappings from '$lib/client-utils/key-mappings';
	import { getWalkdirItem } from '$lib/client-utils/get-walkdir-item';
	import { apiClient } from '$lib/client-utils/api-client';
	import { formatBytes } from '$lib/client-utils/format-bytes';
	import { HTML_SANDBOX_ATTR, PDF_SANDBOX_ATTR } from '$lib/config';

	import { get as getStore } from 'svelte/store';

	import { browser, dev } from '$app/environment';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import '$lib/styles/github-doc.css';
	import '$lib/styles/shiki.css';

	import type { PageData } from './$types';
	import { onMount, tick } from 'svelte';
	import type { FileContentResponse } from '../../api/file-content/+server';

	import type { MimeType } from '$lib/server-utils/get-mime-types';
	const { data } = $props<{ data: PageData }>();

	const fontCharacters =
		'abcdefghijklmnoqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789()-_=+~`!@#$%^&*[]{}\\|;:\'",.<>/?'.split(
			''
		);

	let { files } = data;

	let mimeType = $state<MimeType | undefined>(data.mimeType);
	let error = $state<string | undefined>(data.error);
	let html = $state<string | undefined>('');
	let content = $state<string | undefined>('');
	let maximizeCodeBlockWidth = $state<boolean | undefined>(false);
	let outlineHeadings = $state<NodeListOf<Element> | null>(null);
	let stats = $state<FileContentResponse['stats'] & { size: number }>({
		size: data.size
	});

	let prevFileParam = page.params.file;

	const servePath = $derived('/serve/' + page.params.file);

	$effect(() => {
		stores.baseDirectory.set(data.baseDirectory);
	});

	onMount(() => {
		fetchContent();
		// Set up SSE connection for file watching
		if (browser) {
			const fileWatcherEventSource = new EventSource('/api/file-watcher');

			fileWatcherEventSource.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (data.type === 'file-changed') {
					console.log('File change detected via SSE');

					// Trigger content refresh
					html = '';
					content = '';
					maximizeCodeBlockWidth = false;
					stats = { size: data.size };
					fetchContent();
				}
			};

			fileWatcherEventSource.onerror = (error) => {
				console.error('SSE connection error:', error);
			};

			// Set up cursor tracking SSE
			const cursorEventSource = new EventSource('/api/cursor-watcher');

			cursorEventSource.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (data.type === 'cursor-changed') {
					// update the url to #LXY
					const line = data.line;
					const hash = `#L${line}`;
					window.history.pushState({}, '', hash);
					const el = document.getElementById(hash.slice(1));
					el?.scrollIntoView();
				}
			};

			cursorEventSource.onerror = (error) => {
				console.error('Cursor SSE connection error:', error);
			};

			// Clean up on component unmount
			return () => {
				fileWatcherEventSource.close();
				cursorEventSource.close();
			};
		}
	});

	// need this for when changing files, bc for some reason the onMount event does
	// not reoccur when changing files (ig because of its a glob [...file])
	$effect(() => {
		if (page.params.file === '' || page.params.file === prevFileParam) {
			return;
		}

		prevFileParam = page.params.file;

		error = '';
		html = '';
		content = '';
		maximizeCodeBlockWidth = false;
		stats = { size: data.size };

		if (!browser) {
			return;
		}

		fetchContent();

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

	stores.files.set(files);

	$effect(() => {
		console.log(
			html,
			content,
			maximizeCodeBlockWidth,
			stats,
			files,
			page.params.file,
			servePath,
			mimeType,
			error
		);
	});

	async function fetchContent() {
		if (error) {
			return;
		}

		stores.abortController.set(new AbortController());

		try {
			const fileContent = await apiClient.getFileContents(page.params.file);

			if (fileContent.error) {
				error = fileContent.error;
				return;
			}

			mimeType = fileContent.mimeType;

			stats.chars = fileContent.stats?.chars;
			stats.lines = fileContent.stats?.lines;
			stats.words = fileContent.stats?.words;

			content = fileContent.content;
			maximizeCodeBlockWidth = fileContent.maximizeCodeBlockWidth;

			if (!fileContent.needsHighlighting) {
				html = fileContent.html;
				return;
			}

			const syntaxHighlighting = await apiClient.getSyntaxHighlighting(
				page.params.file,
				getStore(stores.abortController).signal
			);

			html = syntaxHighlighting || fileContent.html;
		} catch (err) {
			// if aborted, skip
			if (err instanceof Error && err.name === 'AbortError') {
				return;
			}

			error =
				err instanceof Error ? err.message : 'Error: Internal server error';
		}
	}

	function handleKey(ev: KeyboardEvent) {
		if (mappings.notOpened.shouldOpenFilePalette(ev)) {
			ev.preventDefault();
			stores.modalState.set(
				getStore(stores.modalState) === 'choose-file' ? '' : 'choose-file'
			);
			return;
		}

		if (mappings.notOpened.shouldOpenDirectoryPalette(ev)) {
			ev.preventDefault();
			stores.modalState.set(
				getStore(stores.modalState) === 'choose-directory'
					? ''
					: 'choose-directory'
			);
			return;
		}

		if (mappings.notOpened.shouldOpenSearchPalette(ev)) {
			ev.preventDefault();
			stores.modalState.set(
				getStore(stores.modalState) === 'search' ? '' : 'search'
			);
			return;
		}

		if (ev.key !== 'h' && ev.key !== 'l') {
			return;
		}

		const paths = page.params.file.split('/');
		const file = paths.pop();

		const itemChildren = getWalkdirItem(
			paths,
			getStore(stores.files)
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

	$effect(() => {
		if (!html) {
			return;
		}

		tick().then(() => {
			outlineHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
		});
	});
</script>

<svelte:window on:keydown={handleKey} />

<FilePalette />
<SearchPalette />

<svelte:head>
	<link
		rel="stylesheet"
		href={'/api/font-stylesheet?file=' + page.params.file}
		type="text/css"
	/>
</svelte:head>

<main
	class="h-full w-full csmall:grid csmall:grid-cols-[auto_1fr] bg-background text-foreground"
>
	<Sidebar {outlineHeadings} {stats} />
	<section
		class="bg-transparent p-5 h-full w-full overflow-auto scroll-smooth markdown-body prose-ul:list-disc"
	>
		{#if error}
			<h1>{error}</h1>
			{#if stats.size}
				<h2>Size: {formatBytes(stats.size)}</h2>
			{/if}
		{:else if html}
			{#if maximizeCodeBlockWidth}
				{@html html}
			{:else}
				<div
					class="max-w-[90ch] mx-auto py-[min(100px,calc((100%-90ch)/2))] markdown-body"
				>
					{@html html}
				</div>
			{/if}
		{:else if mimeType?.genre === 'font'}
			<div
				class="flex flex-wrap font-['placeholder',Arial] content-center h-full max-w-[60ch] mx-auto"
			>
				{#each fontCharacters as char}
					<p class="p-1.5 text-3xl">{char}</p>
				{/each}
			</div>
		{:else if mimeType?.genre === 'image'}
			<div class="grid place-items-center h-full overflow-auto">
				<img src={servePath} alt="" />
			</div>
		{:else if mimeType?.genre === 'audio'}
			{#key servePath}
				<audio controls class="w-full">
					<source src={servePath} />
					Your browser does not support the audio element.
				</audio>
			{/key}
		{:else if mimeType?.genre === 'video'}
			{#key servePath}
				<video controls class="w-full">
					<source src={servePath} />
					<track kind="captions" />
					Your browser does not support the audio element. track
				</video>
			{/key}
		{:else if content}
			<p
				class="whitespace-pre-wrap max-w-[80ch] text-lg mx-auto py-[min(100px,calc((100%-80ch)/2))]"
			>
				{#each content.split('\n') as line, lineNumber}
					<span id="L{lineNumber + 1}">
						{line}
					</span>
					<br />
				{/each}
			</p>
		{/if}
		{#if mimeType?.specific === 'html' || mimeType?.specific === 'pdf'}
			<iframe
				title=""
				src={servePath}
				frameborder="0"
				class="w-full h-full"
				sandbox={mimeType?.specific === 'html'
					? HTML_SANDBOX_ATTR
					: PDF_SANDBOX_ATTR}
			></iframe>
		{/if}
	</section>
</main>

<ErrorTray />

<style>
	/* Global styles for code blocks and root font size */
	@media screen and (min-width: 800px) {
		:global(pre code) {
			font-size: 1.1rem;
		}
	}

	@media screen and (min-width: 1100px) {
		:root {
			font-size: 18px;
		}
	}
</style>
