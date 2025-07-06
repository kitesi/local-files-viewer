<script lang="ts">
	import CollapsableSidebarSection from './CollapsableSidebarSection.svelte';
	import SidebarOutlineItem from './SidebarOutlineItem.svelte';
	import SidebarFileItem from './SidebarFileItem.svelte';
	import { formatBytes } from '$lib/client-utils/format-bytes';
	import { baseDirectory, files, isSidebarOpen, theme } from '$lib/stores/index';
	import { OUTLINE_OPEN_DEFAULT_STATUS } from '../config';
	import { Sun, Moon } from '@lucide/svelte';

	import { browser } from '$app/environment';

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
	class="toggle-sidebar absolute border-none p-4 z-30 md:opacity-0 md:invisible md:pointer-events-none"
	style="inset: 7px 0 auto auto;"
>
	<ui-button variant="ghost" size="icon">
		<span class="block relative w-8 h-0.5 bg-sidebar-foreground transition-all duration-150 ease-in-out before:content-[''] before:absolute before:left-0 before:w-8 before:h-0.5 before:bg-sidebar-foreground before:transition-all before:duration-200 before:linear before:top-2 after:content-[''] after:absolute after:left-0 after:w-8 after:h-0.5 after:bg-sidebar-foreground after:transition-all after:duration-200 after:linear after:bottom-2"></span>
	</ui-button>
</button>

<section 
	bind:this={sidebarElement} 
	class="absolute bg-sidebar text-sidebar-foreground top-0 left-0 max-w-[80vw] w-[80vw] h-full -translate-x-full transition-transform duration-100 linear z-20 overflow-auto md:static md:translate-x-0 md:shadow-none md:w-[300px] md:min-w-[250px]"
	id="sidebar"
	class:resizing={isResizing}
>
	<div class="flex flex-col h-full">
		<div class="flow-root relative overflow-auto flex-1 scrollbar-none">
		<!-- TODO: fix this -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="resizer fixed top-0 right-0 bottom-0 w-[0.3em] bg-transparent border-l border-r border-sidebar-border border-l-transparent cursor-ew-resize hover:bg-sidebar-accent hover:border-sidebar-accent"
			on:mousedown|preventDefault={() => (isResizing = true)}
			aria-label="resize sidebar"
		>
		</div>
		<CollapsableSidebarSection
			name={getLastDirectory($baseDirectory)}
			open={true}
			icon="folder"
		>
			<ul class="list-none">
				{#if $files.children && $files.children.length > 0}
					{#each $files.children as child (child.name)}
						<SidebarFileItem item={child} parentPath="" />
					{/each}
				{:else}
					<p class="pl-1.5 my-1.5"><b>No files</b></p>
				{/if}
			</ul>
		</CollapsableSidebarSection>

		<CollapsableSidebarSection
			name="outline"
			open={OUTLINE_OPEN_DEFAULT_STATUS}
			icon="outline"
		>
			<ul class="ml-4 list-none mb-5">
				{#if stats.size}
					<li class="pl-1.5 first:mt-2.5">Size: {formatBytes(stats.size)}</li>
				{/if}
				{#if stats.chars}
					<li class="pl-1.5 first:mt-2.5">Characters: {stats.chars}</li>
				{/if}
				{#if stats.words}
					<li class="pl-1.5 first:mt-2.5">Words: {stats.words}</li>
				{/if}
				{#if stats.lines}
					<li class="pl-1.5 first:mt-2.5">Lines: {stats.lines}</li>
				{/if}
				{#if outlineHeadings && outlineHeadings.length !== 0}
					{#each transformOutlineHeadings(outlineHeadings).children as heading (heading.id)}
						<SidebarOutlineItem item={heading} />
					{/each}
				{/if}
			</ul>
		</CollapsableSidebarSection>
		</div>

		<!-- Theme Toggle Button -->
		<div class="mt-auto p-0 border-t border-sidebar-border h-12 w-full">
			<button
				on:click={() => theme.toggle()}
				class="w-full h-full flex items-center justify-center rounded-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors relative"
				aria-label="Toggle theme"
			>
				<span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex">
					<Sun 
						size={20} 
						class="h-5 w-5 transition-all duration-200 dark:-rotate-90 dark:scale-0 rotate-0 scale-100" 
					/>
					<Moon 
						size={20} 
						class="h-5 w-5 transition-all duration-200 dark:rotate-0 dark:scale-100 rotate-90 scale-0" 
					/>
				</span>
				<span class="sr-only">Toggle theme</span>
			</button>
		</div>
	</div>
</section>

<style>
	/* Custom styles that can't be easily converted to Tailwind */
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
		transform: rotate(90deg) translateX(7px);
	}

	/* Hamburger menu styles */
	.toggle-sidebar span,
	.toggle-sidebar span::before,
	.toggle-sidebar span::after {
		width: 2em;
		height: 3px;
		background-color: white;
		transition: transform 150ms ease-in-out, opacity 200ms linear;
	}

	.toggle-sidebar span::before,
	.toggle-sidebar span::after {
		content: '';
		position: absolute;
		left: 0;
	}

	.toggle-sidebar span::before {
		top: 7px;
	}

	.toggle-sidebar span::after {
		bottom: 7px;
	}

	/* Hover effects for resizer */
	@media (hover: hover) {
		.resizing .resizer {
			background-color: #0080d9;
			border-inline-color: #0080d9;
		}
	}

	/* Desktop responsive behavior */
	@media screen and (min-width: 800px) {
		section,
		.toggle-sidebar[aria-pressed='true'] ~ section {
			position: static;
			transform: translateX(0);
			box-shadow: none;
			-webkit-box-shadow: none;
			-moz-box-shadow: none;
			width: 300px;
			min-width: 250px;
		}

		.toggle-sidebar {
			opacity: 0;
			visibility: hidden;
			pointer-events: none;
		}
	}

	#sidebar:global li:not(.is-collapsed) > ul {
		display: none;
	}

</style>
