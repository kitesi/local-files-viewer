<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import FilePalette from '$lib/components/FilePalette.svelte';
	import ErrorTray from '$lib/components/ErrorTray.svelte';
	import * as stores from '../../../stores';
	import * as mappings from '../../../key-mappings';
	import { getWalkdirItem } from '../../../get-walkdir-item';
	import { formatBytes } from '../../../format-bytes';
	import { HTML_SANDBOX_ATTR, PDF_SANDBOX_ATTR } from '../../../config';

	import { get as getStore } from 'svelte/store';

	import { browser, dev } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import '$lib/styles/github-doc.css';
	import '$lib/styles/shiki.css';
	import '$lib/styles/doc.css';

	import type { PageData } from './$types';
	import type { BodyReturn as GetFileContentBodyReturn } from '../../info/get-file-contents';
	import { onMount } from 'svelte';

	export let data: PageData;

	const fontCharacters =
		'abcdefghijklmnoqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789()-_=+~`!@#$%^&*[]{}\\|;:\'",.<>/?'.split(
			''
		);

	let { error, files, mimeType } = data;
	let servePath = '';
	let html: string | undefined = '';
	let content: string | undefined = '';
	let maximizeCodeBlockWidth: boolean | undefined = false;

	let outlineHeadings: NodeListOf<Element> | null;
	let stats: GetFileContentBodyReturn['stats'] & { size: number } = {
		size: data.size
	};

	let prevFileParam = $page.params.file;

	$: servePath = '/serve/' + $page.params.file;

	$: {
		({ files, mimeType, error } = data);
		stores.baseDirectory.set(data.baseDirectory);
	}

	// initial load
	if (browser) {
		fetchContent().then(
			() =>
				(outlineHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
		);
	}

	stores.fileChanged.subscribe(() => {
		if (!browser || $page.params.file === '') {
			return;
		}

		html = '';
		content = '';
		maximizeCodeBlockWidth = false;
		stats = { size: data.size };

		fetchContent(window.location.host).catch(console.error);
	});

	// need this for when changing files, bc for some reason the onMount event does
	// not reoccur when changing files (ig because of its a glob [...file])
	page.subscribe(async () => {
		if ($page.params.file === '' || $page.params.file === prevFileParam) {
			return;
		}

		prevFileParam = $page.params.file;

		html = '';
		content = '';
		maximizeCodeBlockWidth = false;
		stats = { size: data.size };

		if (!browser) {
			return;
		}

		await fetchContent().catch(console.error);
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

	stores.files.set(files);

	async function fetchContent(urlPrefix = '') {
		if (
			error ||
			mimeType?.genre === 'audio' ||
			mimeType?.genre === 'video' ||
			mimeType?.genre === 'image' ||
			mimeType?.genre === 'font'
		) {
			return;
		}

		stores.abortController.set(new AbortController());

		try {
			const fileContentRes = await fetch(
				urlPrefix +
					'/info?action=file-content&file=' +
					encodeURIComponent($page.params.file)
			);

			const fileContent =
				(await fileContentRes.json()) as GetFileContentBodyReturn;

			if (fileContent.error) {
				error = fileContent.error;
				return;
			}

			stats.chars = fileContent.stats?.chars;
			stats.lines = fileContent.stats?.lines;
			stats.words = fileContent.stats?.words;

			content = fileContent.content;
			maximizeCodeBlockWidth = fileContent.maximizeCodeBlockWidth;

			console.log(content);

			if (!fileContent.needsHighlighting) {
				html = fileContent.html;
				return;
			}

			const syntaxHighlightingRequest = fetch(
				urlPrefix +
					'/info?action=syntax-highlighting&file=' +
					encodeURIComponent($page.params.file),
				{ signal: getStore(stores.abortController).signal }
			)
				.then((res) => res.text())
				.then((text) => (html = text))
				// usually an aborted operation
				.catch((err) => {
					if (err.name === 'AbortError') {
						return;
					}

					stores.addToastError(err.message);
				});

			Promise.race([
				syntaxHighlightingRequest,
				new Promise((res) => {
					// possible memory loss?
					setTimeout(() => res(''), 200);
				}) as Promise<string>
			]).then((value) => {
				if (!html) {
					html = value || fileContent.html;
				}
			});
		} catch (err: any) {
			console.error(err);

			if (err.message) {
				error = err.essage;
			}
		}
	}

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
</script>

<svelte:window on:keydown={handleKey} />

<FilePalette />

<svelte:head>
	<link
		rel="stylesheet"
		href={'/info?action=get-font-stylesheet&file=' + $page.params.file}
		type="text/css"
	/>
</svelte:head>

<main class="h-full w-full csmall:grid csmall:grid-cols-[auto_1fr]">
	<Sidebar {outlineHeadings} {stats} />
	<section class="bg-transparent text-gray-200 p-5 h-full w-full overflow-auto scroll-smooth markdown-body">
		{#if error}
			<h1>{error}</h1>
			{#if stats.size}
				<h2>Size: {formatBytes(stats.size)}</h2>
			{/if}
		{:else if html}
			{#if maximizeCodeBlockWidth}
				{@html html}
			{:else}
				<div class="max-w-[90ch] mx-auto py-[min(100px,calc((100%-90ch)/2))]">
					{@html html}
				</div>
			{/if}
		{:else if mimeType?.genre === 'font'}
			<div class="flex flex-wrap font-['placeholder',Arial] content-center h-full max-w-[60ch] mx-auto">
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
			<p class="whitespace-pre-wrap max-w-[80ch] text-lg mx-auto py-[min(100px,calc((100%-80ch)/2))]">{content}</p>
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
