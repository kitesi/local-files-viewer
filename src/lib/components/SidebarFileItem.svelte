<script context="module" lang="ts">
	// todo: prob better ways to do these two functions
	function switchActive(ev: Event) {
		closeSidebar();
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

		let activeTag = document.getElementById('active') as
			| HTMLAnchorElement
			| undefined;

		if (activeTag) {
			activeTag.id = '';
		}

		a.id = 'active';
		activeTag = a;
	}

	function closeSidebar() {
		isSidebarOpen.set(false);
	}
</script>

<script lang="ts">
	import FileIcon from './FileIcon.svelte';
	import { Folder } from '@lucide/svelte';
	import { files, isSidebarOpen, abortController } from '$lib/stores/index';

	import { page } from '$app/stores';

	import { getWalkdirItem } from '$lib/client-utils/get-walkdir-item';
	import type { WalkDirItem } from '$lib/server-utils/mem-fs';
	import { cn } from '$lib/utils';

	export let item: WalkDirItem;
	export let parentPath: string;

	const href = parentPath + '/' + item.name;
	$: isActive = '/' + $page.params.file === href;

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

	async function collapseDirectory() {
		liElement.classList.toggle('is-collapsed');

		const dataHref = liElement.getAttribute('data-href');

		if (!dataHref) {
			return;
		}

		const res = await fetch(
			`/api/complete-search?dir=${dataHref}/&depth=1`
		);
		const json = await res.json();

		const paths = dataHref.split('/').slice(1);
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
	class={cn("my-2.5", isActive && "bg-sidebar-accent")}
	class:is-collapsed={shouldCollapse}
	data-href={item.isDirectory && item.children && item.children.length === 0
		? href
		: null}

>
	{#if item.isDirectory}
		<button 
			class="bg-transparent w-full border-none text-base hover:underline flex gap-2 items-center px-4"
			on:click={collapseDirectory}
		>
			<Folder />
			<span class="overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
		</button>
	{:else}
		<!-- could have id set to the actual expression in isActive and remove switchActive(ev), not sure which is move preformant -->
		<a
			class={
				cn(
					"text-inherit flex gap-2 items-center overflow-hidden text-ellipsis whitespace-nowrap px-4",
				)
			}
			on:click={(ev) => {
				$abortController.abort();
				switchActive(ev);
			}}
			id={isActive ? 'active' : null}
			href={'/preview' + href}
		>
			<FileIcon fileName={item.name} size="20px" />
			<span>{item.name}</span>
		</a>
	{/if}
	{#if item.children}
		<ul class="ml-2.5 list-none">
			{#each item.children as child (child.name)}
				<svelte:self item={child} parentPath={href} />
			{/each}
		</ul>
	{/if}
</li>
