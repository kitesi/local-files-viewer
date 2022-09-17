<!-- 
	yes this is repeated code from SidebarFileItem.svelte.
	I tries modularizing it to a SidebarItem.svelte file, but
	due to some differences like the outline's href (doesn't care about parent) vs 
	the file's href (cares about parent)

	one possible solution for that would be to include the href calculation in the api
	when retrieving files
-->
<script lang="ts">
	import { OUTLINE_HEADING_LEVEL_AUTO_COLLAPSE } from '../../config';
	import Icon from './Icon.svelte';
	import type { OutlineItem } from './outline-item';

	export let item: OutlineItem;

	let collapse = item.level < OUTLINE_HEADING_LEVEL_AUTO_COLLAPSE;

	function collapseParent(ev: Event) {
		const target = ev.target as HTMLElement;

		if (!target) return;

		collapse = !collapse;
	}
</script>

<li class:collapse class:has-children={item.children.length > 0}>
	{#if item.children.length > 0}
		<div>
			<button on:click={collapseParent}>
				<Icon name={collapse ? 'chevron-down' : 'chevron-right'} />
			</button>
			<a href="#{item.id}"><span>{item.name}</span></a>
		</div>
	{:else}
		<a href="#{item.id}">
			<Icon name="hash" />
			<span>{item.name}</span>
		</a>
	{/if}

	{#if item.children}
		<ul>
			{#each item.children as child (child.name)}
				<svelte:self item={child} />
			{/each}
		</ul>
	{/if}
</li>

<style>
	ul {
		margin-left: 10px;
		list-style-type: none;
	}

	div {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	li {
		/* uses collapsing margins */
		margin: 5px;
	}

	button,
	a {
		color: inherit;
		display: flex;
		gap: 8px;
		align-items: center;
	}

	button {
		background-color: transparent;
		border: none;
		font-size: inherit;
	}

	button:hover {
		text-decoration: underline;
	}

	a:hover,
	button:hover {
		color: white;
	}

	span,
	a {
		overflow: hidden;
		text-overflow: '..';
		white-space: nowrap;
	}
</style>
