<!-- inspired by vscode's file/command pallete -->
<script lang="ts">
	import Icon from './Icon.svelte';
	import FileIcon from './FileIcon.svelte';
	import Fuse from 'fuse.js';
	import { modalState, files, addToastError } from '../../stores';
	import * as mappings from '../../key-mappings';
	import { browser } from '$app/env';
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
			`/info?action=new-base-dir-search&query=` + query.replaceAll('/', '\\')
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
			.filter((e) => e.name.startsWith(normalizedQuery));

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
			const res = await fetch(
				'/info?dir=/&depth=Infinity&action=complete-search'
			);
			const json = await res.json();

			if (json.error) {
				return;
			}

			files.set(json.files);
			json.files.name = '';

			flattenedResults = addToFlattenedArr(json.files, '', [])
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
					query = completion;
				} else {
					query = query.replace(/\/[^/]*$/, '/' + completion);
				}

				return;
			}
		}

		if (isNormalTab || (ev.ctrlKey && ev.key === 'j')) {
			const nextElement = currentSelected?.nextElementSibling;
			return changeSelected(nextElement);
		}

		if (isShiftTab || (ev.ctrlKey && ev.key === 'k')) {
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
					addToastError(err.message, 2000);
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
						addToastError(json.error, 2000);
					} else {
						window.location.href = '/preview';
					}
				});
		}

		modalState.set('');
	}

	async function handleInput() {
		if ($modalState === 'choose-directory') {
			return setFilteredDirectoryResults().catch((err) => console.error(err));
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

<dialog open={!!$modalState} on:click|self={() => modalState.set('')}>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="input-container">
			<div>
				<label for="query"
					>{$modalState === 'choose-directory' ? 'Folder:' : 'File:'}</label
				>
				<input
					type="text"
					id="query"
					autocomplete="off"
					autocapitalize="off"
					autocorrect="off"
					bind:this={input}
					bind:value={query}
					on:keydown={handleKeydown}
					on:input={handleInput}
				/>
			</div>
		</div>

		<div class="button-container" tabindex="-1">
			{#if filteredResults.length > 0}
				{#each filteredResults as file, i}
					<button
						data-href={file.parents + '/' + file.name}
						class:selected={$modalState === 'choose-file' && i === 0}
					>
						{#if $modalState === 'choose-file'}
							<FileIcon fileName={file.name} size="20px" />
						{:else}
							<Icon name="folder" />
						{/if}
						<span class="specific">{file.name}</span>
						<span class="parent">{file.parents}</span>
					</button>
				{/each}
			{:else}
				<p>No matching results.</p>
			{/if}
		</div>
	</form>
</dialog>

<style lang="scss">
	@use '../styles/variables.scss' as *;

	dialog {
		position: absolute;
		background-color: transparent;
		height: 100%;
		width: 100%;
		border: none;
		z-index: 3;
	}

	form {
		background-color: lighten($c-black-3, 2%);
		border: 2px solid $c-black-4;
		// box-shadow: 4px 7px 20px 8px rgba(0, 0, 0, 0.1);
		box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.4);
		margin: 10px auto;
		width: 800px;
		max-width: 90%;
	}

	.button-container {
		max-height: 60vh;
		overflow: auto;
	}

	.input-container {
		padding: 5px;
		color: white;
	}

	.input-container div {
		display: flex;
		align-items: center;
		background-color: darken($c-black-2, 3%);
		padding-left: 5px;
	}

	.input-container div:focus-within {
		outline: 2px solid $c-blue-2;
	}

	input {
		height: 100%;
		padding: 5px;
		width: 100%;
		border: none;
		color: white;
		background-color: transparent;
		font-size: 0.8rem;
	}

	input:focus {
		outline: none;
	}

	button {
		display: flex;
		align-items: center;
		gap: 5px;
		width: 100%;
		text-align: start;
		background-color: transparent;
		color: white;
		padding: 2px 10px;
		border: none;
		font-size: 1rem;
	}

	p {
		color: white;
		padding: 5px 10px;
	}

	.selected {
		outline: none;
		background-color: $c-black-2;
	}

	button:hover {
		background-color: darken($c-black-2, 5%);
	}

	.parent {
		color: rgb(180, 180, 180);
	}
</style>
