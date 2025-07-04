<!-- inspired by vscode's file/command palette -->
<!-- TODO: after it reaches half way, the view is always at the middle as you go down. this is not intended-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import FileIcon from './FileIcon.svelte';
	import Fuse from 'fuse.js';
	import * as mappings from '../../key-mappings';
	import { modalState, files, addToastError } from '../../stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { Dialog, DialogContent, DialogOverlay } from './ui/dialog';
	import { Button } from './ui/button';
	import { Search, X } from '@lucide/svelte';

	import type { WalkDirItem } from '../../mem-fs';
	import { cn } from '$lib/utils';
	interface File {
		parents: string;
		name: string;
	}

	interface WalkDirItemWithParent extends WalkDirItem {
		parents: string;
	}

	let flattenedResults: File[] = [];
	let filteredResults: File[] = [];
	let fuse: Fuse<string>;
	let query = '';
	let input: HTMLInputElement;

	function addToFlattenedArr(
		item: WalkDirItem,
		directParent: string,
		arr: WalkDirItemWithParent[]
	) {
		let nextPath = '';

		if (directParent && directParent !== '/') {
			nextPath = directParent + '/' + item.name;
		} else {
			nextPath = item.name;
		}

		if (nextPath) {
			arr.push({
				...item,
				parents: directParent
			});
		}

		if (item.children) {
			for (const child of item.children) {
				addToFlattenedArr(child, nextPath, arr);
			}
		}

		return arr;
	}

	async function setFilteredDirectoryResults() {
		const res = await fetch(
			// vite has some weird thing where if a query=../.. it will try to parse it ig
			`/info?action=new-base-dir-search&query=` + encodeURIComponent(query)
		);

		const json = (await res.json()) as { files: string[]; homedir: string };

		let normalizedQuery = query.replace(/(?<!\\)~/, json.homedir);
		let pathsOfQuery = normalizedQuery.match(/\/?[^/]*$/);

		if (pathsOfQuery && pathsOfQuery[0]) {
			normalizedQuery = pathsOfQuery[0];

			if (normalizedQuery.startsWith('/')) {
				normalizedQuery = normalizedQuery.slice(1);
			}
		}

		filteredResults = json.files
			.map((e) => {
				const paths = e.split('/');
				let name = '';

				if (paths.length > 1) {
					name = paths.pop()!;
				}

				return { name, parents: paths.join('/') };
			})
			.filter((e) => {
				if (normalizedQuery.toLowerCase() === normalizedQuery) {
					return e.name.toLowerCase().startsWith(normalizedQuery);
				}

				return e.name.startsWith(normalizedQuery);
			});

		return;
	}

	// Reactive statement that runs immediately when modalState changes
	$: if ($modalState && browser) {
		// Focus input immediately when modal opens
		if (input) {
			input.focus();
		}

		query = '';

		if ($modalState === 'choose-file') {
			$files.name = '.';
			flattenedResults = addToFlattenedArr($files, '', [])
				.filter((e) => !e.isDirectory)
				.map(({ name, parents }) => {
					return {
						name,
						parents
					};
				});

			filteredResults = flattenedResults;
			fuse = new Fuse(flattenedResults.map((e) => e.parents + '/' + e.name));
		}

		if ($modalState === 'choose-directory') {
			flattenedResults = [];
			filteredResults = [];
			setFilteredDirectoryResults().catch(console.error);
		}
	}

	function changeSelected(direction: 'next' | 'prev') {
		const currentSelected = document.querySelector('button.selected');
		const nextElement = direction === 'next' ? currentSelected?.nextElementSibling : currentSelected?.previousElementSibling;
		
		if (currentSelected && nextElement) {
			currentSelected.classList.remove('selected');
			nextElement.classList.add('selected');
			nextElement.scrollIntoView({ block: 'center' });
		}
	}

	async function handleKeydown(ev: KeyboardEvent) {
		ev.stopPropagation();

		if (
			ev.key === 'Escape' ||
			ev.key === 'Tab' ||
			(mappings.ctrl.includes(ev.key) && ev.ctrlKey)
		) {
			ev.preventDefault();
		}


		if (
			ev.key === 'Escape' ||
			(ev.ctrlKey && (ev.key === 'p' || ev.key === 'o' || ev.key === '['))
		) {
			modalState.set('');
			return;
		}

		if (ev.key === 'm' && ev.ctrlKey) {
			handleSubmit(ev);
		}

		const isNormalTab = ev.key === 'Tab' && !ev.shiftKey;
		const isShiftTab = ev.key === 'Tab' && ev.shiftKey;

		if ($modalState === 'choose-directory') {
			if (isShiftTab) {
				return;
			}

			if (isNormalTab) {
				if (filteredResults.length !== 1) {
					return;
				}

				const completion = filteredResults[0].name;

				if (!query.includes('/')) {
					query = completion + '/';
				} else {
					query = query.replace(/\/[^/]*$/, '/' + completion) + '/';
				}

				setFilteredDirectoryResults().catch(console.error);
			}

				return;
		}


		if (
			isNormalTab ||
			ev.key === 'ArrowDown' ||
			(ev.ctrlKey && ev.key === 'j')
		) {
			return changeSelected('next');
		}

		if (isShiftTab || ev.key === 'ArrowUp' || (ev.ctrlKey && ev.key === 'k')) {
			return changeSelected('prev');
		}
	}

	function handleSubmit(ev: Event) {
		ev.preventDefault();

		let href =
			$modalState === 'choose-directory'
				? query
				: document.querySelector('button.selected')?.getAttribute('data-href');

		if (!href) {
			return;
		}

		if ($modalState === 'choose-file') {
			modalState.set('');
			goto(href).catch((err) => {
				if (err.message) {
					addToastError(err.message);
				}
			});
		} else {
			fetch('/info', {
				method: 'POST',
				body: JSON.stringify({ action: 'new-base-dir', dir: href }),
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then((res) => res.json())
				.then((json) => {
					if (json.error) {
						addToastError(json.error + ` (${query})`);
					} else {
						window.location.href = '/preview';
					}
				});
		}
	}

	async function handleInput(ev: Event) {
		if ($modalState === 'choose-directory') {
			return setFilteredDirectoryResults().catch(console.error);
		}

		if (!query) {
			filteredResults = flattenedResults;
		} else {
			filteredResults = fuse.search(query).map((e) => {
				return flattenedResults![e.refIndex];
			});
		}
	}

	function getPreviewPath(path: string) {
		return '/preview/' + path.replace(/^\.\//, '');
	}
</script>

	<Dialog open={!!$modalState}>
	<!-- <DialogOverlay /> -->
	<DialogContent position="top" class="bg-popover text-popover-foreground border-2 border-border shadow-lg rounded-lg w-full max-w-lg mx-4 p-0" onkeydown={handleKeydown} oninput={handleInput}>
		<form 
			class="w-full"
			onsubmit={(ev) => handleSubmit(ev)}
		>
			<div class="p-1.5 text-popover-foreground">
				<div class="flex items-center bg-popover pl-1.5">
					<label for="palette-search" class="sr-only">Search files</label>
					<Search class="w-5 h-5 text-muted-foreground mr-2" />
					<input
						id="palette-search"
						class="flex-1 bg-transparent outline-none border-none text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0"
						type="text"
						placeholder="Type to search..."
						bind:value={query}
						autocomplete="off"
						autocapitalize="off"
						autocorrect="off"
						onkeydown={handleKeydown}
						oninput={handleInput}
						bind:this={input}
					/>
					<Button type="button" variant="ghost" size="icon" onclick={() => modalState.set('')}
						class="ml-2">
						<X class="w-5 h-5" />
					</Button>
				</div>
			</div>
			<div class="max-h-[60vh] overflow-auto" tabindex="-1">
				{#if filteredResults.length > 0}
					{#each filteredResults as file, i (file.parents + '/' + file.name)}
						<button
							data-href={getPreviewPath(file.parents + '/' + file.name)}
							class={
							cn(
								"flex items-center gap-1.5 w-full text-left bg-transparent text-popover-foreground p-0.5 px-2.5 border-none text-base hover:bg-popover hover:text-popover-foreground",
								i == filteredResults.length - 1 && 'rounded-sm'
							)}
							class:selected={$modalState === 'choose-file' && i === 0}
						>
							{#if $modalState === 'choose-file'}
								<FileIcon fileName={file.name} size="20px" />
							{:else}
								<Icon name="folder" />
							{/if}
							<span class="whitespace-nowrap overflow-hidden text-ellipsis">{file.name}</span>
							<span class="whitespace-nowrap overflow-hidden text-ellipsis text-muted-foreground">{file.parents}</span>
						</button>
					{/each}
				{:else}
					<p class="text-popover-foreground p-1.5 px-2.5">No matching results.</p>
				{/if}
			</div>
		</form>
	</DialogContent>
</Dialog>

<style>
	/* Custom styles for selected state */
	.selected {
		outline: none;
		background-color: #1e2328;
		color: white;
	}
</style>
