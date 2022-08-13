<script context="module" lang="ts">
	let activeTag: HTMLAnchorElement | undefined;

	function handleClick(ev: Event) {
		const a = (ev.target as HTMLElement).parentElement;

		if (!a || !(a instanceof HTMLAnchorElement)) {
			return;
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

		if (!a.parentElement?.classList.contains('has-children')) {
			return;
		}

		a.parentElement!.classList.toggle('collapse');
	}
</script>

<script lang="ts">
	import type { WalkDirItem } from 'src/mem-fs';
	import Icon from './Icon.svelte';
	import { page } from '$app/stores';

	export let name: string;
	export let children: WalkDirItem[] | undefined;
	export let basePath: string;

	const hasChildren = children && children.length > 0;
	const href = basePath + '/' + name;
	const isActive = '/' + $page.params.file === href;
	let shouldCollapse = true;

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
</script>

<li
	class:has-children={hasChildren}
	class:active={isActive}
	class:collapse={shouldCollapse}
>
	<a on:click={handleClick} {href}>
		<Icon name={hasChildren ? 'folder' : 'file'} />
		<span>{name}</span>
	</a>
	{#if children}
		<ul>
			{#each children as child (child.name)}
				<svelte:self {...child} basePath={href} />
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

	a {
		color: inherit;
		display: flex;
		gap: 8px;
		align-items: center;
	}

	a span {
		overflow: hidden;
		text-overflow: '..';
		white-space: nowrap;
	}
</style>
