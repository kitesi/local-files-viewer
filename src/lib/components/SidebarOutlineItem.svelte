<!-- 
	yes this is repeated code from SidebarFileItem.svelte.
	I tries modularizing it to a SidebarItem.svelte file, but
	due to some differences like the outline's href (doesn't care about parent) vs 
	the file's href (cares about parent)

	one possible solution for that would be to include the href calculation in the api
	when retrieving files
-->
<script lang="ts">
	import { OUTLINE_HEADING_LEVEL_AUTO_COLLAPSE } from '$lib/config';
	import type { OutlineItem } from './outline-item';
	import { ChevronDown, ChevronRight, Hash } from '@lucide/svelte';

	export let item: OutlineItem;

	let collapse = item.level < OUTLINE_HEADING_LEVEL_AUTO_COLLAPSE;

	function collapseParent(ev: Event) {
		const target = ev.target as HTMLElement;

		if (!target) return;

		collapse = !collapse;
	}
</script>

<li 
	class="m-1.5"
	class:collapse={collapse}
	class:has-children={item.children.length > 0}
>
	{#if item.children.length > 0}
		<div class="flex items-center gap-1.5">
			<button 
				class="bg-transparent border-none text-inherit text-base hover:underline hover:text-white"
				on:click={collapseParent}
			>
				{#if collapse}
					<ChevronDown />
				{:else}
					<ChevronRight />
				{/if}
			</button>
			<a 
				href="#{item.id}"
				class="text-inherit flex gap-2 items-center hover:text-white overflow-hidden text-ellipsis whitespace-nowrap"
			>
				<span>{item.name}</span>
			</a>
		</div>
	{:else}
		<a 
			href="#{item.id}"
			class="text-inherit flex gap-2 items-center hover:text-white overflow-hidden text-ellipsis whitespace-nowrap"
		>
			<Hash />
			<span>{item.name}</span>
		</a>
	{/if}

	{#if item.children}
		<ul class="ml-2.5 list-none">
			{#each item.children as child (child.name)}
				<svelte:self item={child} />
			{/each}
		</ul>
	{/if}
</li>


