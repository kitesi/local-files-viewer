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

	let isCollapsed = item.level < OUTLINE_HEADING_LEVEL_AUTO_COLLAPSE;

	function collapseParent(ev: Event) {
		const target = ev.target as HTMLElement;

		if (!target) return;

		isCollapsed = !isCollapsed;
	}
</script>

<li
	class="m-0.5 hover:bg-transparent"
	class:is-collapsed={isCollapsed}
	class:has-children={item.children.length > 0}
>
	{#if item.children.length > 0}
		<div
			class="flex items-center gap-1.5 hover:bg-sidebar-accent rounded p-1 transition-colors min-w-0"
		>
			<button
				class="bg-transparent border-none hover:bg-sidebar-accent rounded transition-colors flex-shrink-0"
				on:click={collapseParent}
			>
				{#if isCollapsed}
					<ChevronDown class="w-4 h-4 text-sidebar-foreground" />
				{:else}
					<ChevronRight class="w-4 h-4 text-sidebar-foreground" />
				{/if}
			</button>
			<a
				href="#{item.id}"
				class="text-inherit flex gap-2 items-center hover:text-sidebar-foreground hover:no-underline overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1"
			>
				<span class="truncate">{item.name}</span>
			</a>
		</div>
	{:else}
		<div class="hover:bg-sidebar-accent rounded p-1 transition-colors min-w-0">
			<a
				href="#{item.id}"
				class="text-inherit flex gap-2 items-center hover:text-sidebar-foreground hover:no-underline overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1"
			>
				<Hash class="w-4 h-4 text-sidebar-foreground flex-shrink-0" />
				<span class="truncate">{item.name}</span>
			</a>
		</div>
	{/if}

	{#if item.children}
		<ul class="ml-2.5 list-none">
			{#each item.children as child (child.name)}
				<svelte:self item={child} />
			{/each}
		</ul>
	{/if}
</li>
