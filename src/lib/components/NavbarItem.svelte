<script context="module" lang="ts">
	let activeTag: HTMLAnchorElement | undefined;

	// todo: prob better ways to do these two functions
	function switchActive(ev: Event) {
		if (
			!(ev.target instanceof HTMLElement) &&
			!(ev.target instanceof SVGElement)
		) {
			return ev.preventDefault();
		}

		const a = ev.target.closest('a');

		if (!a) {
			return ev.preventDefault();
		}

		if (!activeTag) {
			activeTag = document.getElementsByClassName('active')[0] as
				| HTMLAnchorElement
				| undefined;
		}

		if (activeTag) {
			activeTag.classList.remove('active');
		}

		a.classList.add('active');
		activeTag = a;
	}
</script>

<script lang="ts">
	import Icon from './Icon.svelte';
	import { page } from '$app/stores';
	import { files } from '../../stores';

	import { getWalkdirItem } from '../../get-walkdir-item';
	import type { WalkDirItem } from '../../mem-fs';

	export let item: WalkDirItem;
	export let parentPath: string;

	const href = parentPath + '/' + item.name;
	const isActive = '/preview/' + $page.params.file === href;

	let shouldCollapse = true;
	let liElement: HTMLLIElement;

	const filesInPageParam = $page.params.file.split('/');
	const filesInHref = href.split('/').slice(1);

	// prob a better/faster way to do this
	// if a folder has already been collapsed, obv it's siblings can't be collapsed
	// originally had $page.params.file.split('/').includes(name) but that's in accurate
	for (let i = 0; i < filesInHref.length && shouldCollapse; i++) {
		if (filesInHref[i] !== filesInPageParam[i]) {
			shouldCollapse = false;
		}
	}

	async function collapseDirectory(ev: Event) {
		liElement.classList.toggle('collapse');

		const dataHref = liElement
			.getAttribute('data-href')
			?.replace('/preview/', '');

		if (!dataHref) {
			return;
		}

		const res = await fetch(`/info?dir=${dataHref}/&depth=1`);
		const json = await res.json();

		const paths = dataHref.split('/');
		const current = getWalkdirItem(paths, $files);

		if (current.name === item.name) {
			current.children = json.files.children;
		}

		files.set($files);
		liElement.setAttribute('data-href', '');
	}
</script>

<li
	bind:this={liElement}
	class:collapse={shouldCollapse}
	data-href={item.isDirectory && item.children && item.children.length === 0
		? href
		: null}
>
	{#if item.isDirectory}
		<button on:click={collapseDirectory}>
			<Icon name="folder" />
			<span>{item.name}</span>
		</button>
	{:else}
		<a on:click={switchActive} class:active={isActive} {href}>
			<Icon name="file" />
			<span>{item.name}</span>
		</a>
	{/if}
	{#if item.children}
		<ul>
			{#each item.children as child (child.name)}
				<svelte:self item={child} parentPath={href} />
			{/each}
		</ul>
	{/if}
</li>

<style>
	ul {
		margin-left: 10px;
		list-style-type: none;
	}

	li {
		padding: 5px;
		max-width: 400px;
	}

	a,
	button {
		color: inherit;
		display: flex;
		gap: 8px;
		align-items: center;
	}

	button {
		background-color: transparent;
		width: 100%;
		border: none;
		font-size: inherit;
	}

	button:hover {
		text-decoration: underline;
	}

	span {
		overflow: hidden;
		text-overflow: '..';
		white-space: nowrap;
	}
</style>
