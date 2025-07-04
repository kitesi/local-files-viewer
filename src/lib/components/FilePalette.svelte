<!-- inspired by vscode's file/command palette -->
<script lang="ts">
	import Icon from './Icon.svelte';
	import FileIcon from './FileIcon.svelte';
	import Fuse from 'fuse.js';
	import * as mappings from '../../key-mappings';
	import { modalState, files, addToastError } from '../../stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	import type { WalkDirItem } from '../../mem-fs';
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
	let currentSelected: Element | null;

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

	modalState.subscribe(async () => {
		if (!browser) {
			return;
		}

		if ($modalState === '') {
			return;
		}

		if (input) {
			setTimeout(() => input.focus(), 100);
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
	});

	function changeSelected(newSelected?: Element | null) {
		if (newSelected) {
			currentSelected?.classList.remove('selected');
			newSelected?.classList.add('selected');
			currentSelected = newSelected;
			newSelected.scrollIntoView({ block: 'center' });
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

		if (!currentSelected) {
			currentSelected = document.querySelector('.selected');
		}

		if (
			ev.key === 'Escape' ||
			(ev.ctrlKey && (ev.key === 'p' || ev.key === 'o' || ev.key === '['))
		) {
			modalState.set('');
		}

		if (ev.key === 'm' && ev.ctrlKey) {
			handleSubmit();
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
				return;
			}
		}

		if (
			isNormalTab ||
			ev.key === 'ArrowDown' ||
			(ev.ctrlKey && ev.key === 'j')
		) {
			const nextElement = currentSelected?.nextElementSibling;
			return changeSelected(nextElement);
		}

		if (isShiftTab || ev.key === 'ArrowUp' || (ev.ctrlKey && ev.key === 'k')) {
			const prevElement = currentSelected?.previousElementSibling;
			return changeSelected(prevElement);
		}
	}

	function handleSubmit() {
		if (!currentSelected) {
			currentSelected = document.querySelector('.selected');
		}

		const href =
			$modalState === 'choose-directory'
				? query
				: currentSelected?.getAttribute('data-href');

		if (!href) {
			return;
		}

		if ($modalState === 'choose-file') {
			goto('/preview/' + href).catch((err) => {
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

		modalState.set('');
	}

	async function handleInput() {
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

		currentSelected = document.querySelector('.selected');
	}
</script>

<dialog 
	class="absolute bg-transparent h-full w-full border-none z-30" 
	open={!!$modalState} 
	on:click|self={() => modalState.set('')}
	on:keydown={(e) => e.key === 'Escape' && modalState.set('')}
>
	<form 
		class="bg-black-3 text-white border-2 border-black-4 shadow-[0_0_0_100vmax_rgba(0,0,0,0.4)] mx-auto my-2.5 w-[800px] max-w-[90%]"
		on:submit|preventDefault={handleSubmit}
	>
		<div class="p-1.5 text-white">
			<div class="flex items-center bg-black-2 pl-1.5 focus-within:outline-2 focus-within:outline-blue-2">
				<label for="query"
					>{$modalState === 'choose-directory' ? 'Folder:' : 'File:'}</label
				>
				<input
					type="text"
					id="query"
					autocomplete="off"
					autocapitalize="off"
					autocorrect="off"
					class="h-full p-1.5 w-full border-none text-white bg-transparent text-sm focus:outline-none"
					bind:this={input}
					bind:value={query}
					on:keydown={handleKeydown}
					on:input={handleInput}
				/>
			</div>
		</div>

		<div class="max-h-[60vh] overflow-auto" tabindex="-1">
			{#if filteredResults.length > 0}
				{#each filteredResults as file, i (file.parents + '/' + file.name)}
					<button
						data-href={file.parents + '/' + file.name}
						class="flex items-center gap-1.5 w-full text-left bg-transparent text-white p-0.5 px-2.5 border-none text-base hover:bg-black-2 hover:text-white"
						class:selected={$modalState === 'choose-file' && i === 0}
					>
						{#if $modalState === 'choose-file'}
							<FileIcon fileName={file.name} size="20px" />
						{:else}
							<Icon name="folder" />
						{/if}
						<span class="whitespace-nowrap overflow-hidden text-ellipsis">{file.name}</span>
						<span class="whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">{file.parents}</span>
					</button>
				{/each}
			{:else}
				<p class="text-white p-1.5 px-2.5">No matching results.</p>
			{/if}
		</div>
	</form>
</dialog>

<style>
	/* Custom styles for selected state */
	.selected {
		outline: none;
		background-color: #1e2328;
		color: white;
	}
</style>
