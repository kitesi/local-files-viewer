<script lang="ts">
	import CollapsableSidebarSection from './CollapsableSidebarSection.svelte';
	import SidebarOutlineItem from './SidebarOutlineItem.svelte';
	import SidebarFileItem from './SidebarFileItem.svelte';
	import { formatBytes } from '../../format-bytes';
	import { baseDirectory, files, isSidebarOpen } from '../../stores';

	import { browser } from '$app/env';

	import type { OutlineItem } from './outline-item';
	import type { PageData } from '../../routes/preview/[...file]/$types';

	export let outlineHeadings: NodeListOf<Element> | null;
	export let stats: PageData['stats'];

	function getLastDirectory(dir: string) {
		const paths = dir.split('/');
		return dir.endsWith('/')
			? paths[paths.length - 2]
			: paths[paths.length - 1];
	}

	function getItemFromHeading(heading: Element): OutlineItem {
		return {
			level: Number.parseInt(heading.tagName[1]),
			name: heading.textContent || '',
			id: heading.id,
			children: []
		};
	}

	function searchParent(
		lookThrough: OutlineItem,
		lookFor: OutlineItem
	): OutlineItem | undefined {
		if (lookThrough === lookFor) return;

		for (const heading of lookThrough.children) {
			if (heading === lookFor) {
				return lookThrough;
			}

			const cache = searchParent(heading, lookFor);
			if (cache) return cache;
		}
	}

	function transformOutlineHeadings(headings: NodeListOf<Element>) {
		const outerMostOutlineItem = {
			id: headings[0].id,
			name: headings[0].textContent || '',
			level: -1,
			children: [] as OutlineItem[]
		};

		let history: OutlineItem[] = [outerMostOutlineItem];

		for (const heading of headings) {
			const item = getItemFromHeading(heading);

			if (outerMostOutlineItem.children.length === 0) {
				outerMostOutlineItem.children.push(item);
				history.push(item);
				continue;
			}

			for (let i = history.length - 1; i >= 0; i--) {
				if (item.level > history[i].level) {
					history[i].children.push(item);
					history.push(item);
					break;
				} else if (item.level === history[i].level || i === 1) {
					searchParent(outerMostOutlineItem, history[i])?.children.push(item);
					history.push(item);
					break;
				}
			}
		}

		return outerMostOutlineItem;
	}

	let isResizing = false;
	let sidebarElement: HTMLElement;

	function resize(ev: MouseEvent) {
		if (!isResizing) {
			return;
		}

		sidebarElement.style.width = ev.clientX + 9 + 'px';
	}

	if (browser) {
		window.addEventListener('mousemove', resize);
		window.addEventListener('mouseup', () => (isResizing = false));
	}
</script>

<button
	on:click={() => isSidebarOpen.set(!$isSidebarOpen)}
	aria-pressed={$isSidebarOpen}
	aria-label="toggle sidebar"
	class="toggle-sidebar"
>
	<span />
</button>

<section bind:this={sidebarElement} class:resizing={isResizing}>
	<div>
		<div
			class="resizer"
			on:mousedown|preventDefault={() => (isResizing = true)}
		/>
		<CollapsableSidebarSection
			name={getLastDirectory($baseDirectory)}
			open={true}
		>
			<ul>
				{#if $files.children && $files.children.length > 0}
					{#each $files.children as child (child.name)}
						<SidebarFileItem item={child} parentPath="" />
					{/each}
				{:else}
					<p class="no-files"><b>No files</b></p>
				{/if}
			</ul>
		</CollapsableSidebarSection>

		<CollapsableSidebarSection name="outline" open={false}>
			<ul style="margin-bottom: 20px;">
				{#if stats.size}
					<li>Size: {formatBytes(stats.size)}</li>
				{/if}
				{#if stats.chars}
					<li>Characters: {stats.chars}</li>
				{/if}
				{#if stats.words}
					<li>Words: {stats.words}</li>
				{/if}
				{#if stats.lines}
					<li>Lines: {stats.lines}</li>
				{/if}
				{#if outlineHeadings && outlineHeadings.length !== 0}
					{#each transformOutlineHeadings(outlineHeadings).children as heading (heading.id)}
						<SidebarOutlineItem item={heading} />
					{/each}
				{/if}
			</ul>
		</CollapsableSidebarSection>
	</div>
</section>

<style lang="scss">
	@use '../../lib/styles/variables.scss' as *;

	section > div {
		display: flow-root;
		position: relative;
		overflow: auto;
		height: 100%;
		scrollbar-width: none;
	}

	.resizer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 0.3em;
		background-color: transparent;
		border-inline: 0.1em solid $sidebar-resizer-border-color;
		border-inline-start-color: transparent;
		cursor: ew-resize;
	}

	p {
		padding-left: 5px;
		margin: 5px 0;
	}

	li {
		padding-left: 5px;
	}

	li:first-of-type {
		margin-top: 10px;
	}

	section {
		position: absolute;
		background-color: $sidebar-bg;
		color: $sidebar-inactive-text-color;
		top: 0;
		left: 0;
		max-width: 80vw;
		width: 80vw;
		height: 100%;
		transform: translateX(-100%);
		transition: 100ms linear;
		z-index: 2;
		scrollbar-width: none;
		overflow: auto;
	}

	ul {
		margin-left: 15px;
		list-style-type: none;
	}

	section:global {
		li:not(.collapse) > ul {
			display: none;
		}
	}

	$hamburger-gap: 7px;
	.toggle-sidebar {
		position: absolute;
		background-color: transparent;
		inset: $hamburger-gap 0 auto auto;
		border: none;
		padding: 15px;
		z-index: 3;
	}

	span {
		display: block;
		position: relative;
	}

	span,
	span::before,
	span::after {
		width: 2em;
		height: 3px;
		background-color: white;
		transition: transform 150ms ease-in-out, opacity 200ms linear;
	}

	span::before,
	span::after {
		content: '';
		position: absolute;
		left: 0;
	}

	span::before {
		top: $hamburger-gap;
	}

	span::after {
		bottom: $hamburger-gap;
	}

	.toggle-sidebar[aria-pressed='true'] ~ section {
		transform: translateX(0);
		visibility: visible;
		box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.57);
		-webkit-box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.57);
		-moz-box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.57);
	}

	.toggle-sidebar[aria-pressed='true'] > span {
		transform: rotate(45deg);
	}

	.toggle-sidebar[aria-pressed='true'] > span::before {
		opacity: 0;
	}

	.toggle-sidebar[aria-pressed='true'] > span::after {
		transform: rotate(90deg) translateX($hamburger-gap);
	}

	@media (hover: hover) {
		.resizer:hover,
		.resizing .resizer {
			background-color: darken($c-blue-1, 10%);
			border-inline-color: darken($c-blue-1, 10%);
		}
	}

	@media screen and (min-width: $size-1) {
		section,
		.toggle-sidebar[aria-pressed='true'] ~ section {
			position: static;
			transform: translateX(0);
			box-shadow: none;
			-webkit-box-shadow: none;
			-moz-box-shadow: none;
			width: $sidebar-static-width;
			min-width: $sidebar-min-width;
		}

		.toggle-sidebar {
			opacity: 0;
			visibility: hidden;
			pointer-events: none;
		}
	}
</style>
