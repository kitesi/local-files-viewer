<!-- inspired by vscode's file/command pallete -->
<script lang="ts">
	import Icon from './Icon.svelte';
	import Fuse from 'fuse.js';
	import { modalState, files } from '../../stores';
	import * as mappings from '../../key-mappings';
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';

	import type { WalkDirItem } from '../../mem-fs';

	interface File {
		parent: string;
		name: string;
	}

	let flattenedFiles: File[] = [];
	let filteredResults: File[] = [];
	let fuse: Fuse<string>;
	let lastQuery = '';
	let query = '';
	let input: HTMLInputElement;
	let currentSelected: Element | null;

	function addToFlattenedArr(item: WalkDirItem, parent: string, arr: string[]) {
		let nextPath = '';

		if (parent && parent !== '/') {
			nextPath = parent + '/' + item.name;
		} else {
			nextPath = item.name;
		}

		if (nextPath && !item.isDirectory) {
			arr.push(nextPath);
		}

		if (item.children) {
			for (const child of item.children) {
				addToFlattenedArr(child, nextPath, arr);
			}
		}

		return arr;
	}

	modalState.subscribe(async () => {
		if (!browser) {
			return;
		}

		if ($modalState !== '') {
			if (input) {
				setTimeout(() => input.focus(), 100);
			}

			if (fuse) {
				return;
			}

			const res = await fetch(
				window.location.origin + '/info?dir=/&depth=Infinity&action=more'
			);
			const json = await res.json();

			if (json.error) {
				return;
			}

			files.set(json.files);
			json.files.name = '';

			let results = addToFlattenedArr(json.files, '', []);
			fuse = new Fuse(results);

			flattenedFiles = results.map((r) => {
				const items = r.split('/');
				const name = items.pop() || '';
				return {
					name,
					parent: items.join('/')
				};
			});
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

	function handleTyping(ev: KeyboardEvent) {
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
			(ev.ctrlKey && (ev.key === 'p' || ev.key === '['))
		) {
			modalState.set('');
		}

		if (ev.key === 'm' && ev.ctrlKey) {
			handleSubmit();
		}

		if ((ev.key === 'Tab' && !ev.shiftKey) || (ev.ctrlKey && ev.key === 'j')) {
			const nextElement = currentSelected?.nextElementSibling;
			return changeSelected(nextElement);
		}

		if ((ev.key === 'Tab' && ev.shiftKey) || (ev.ctrlKey && ev.key === 'k')) {
			const prevElement = currentSelected?.previousElementSibling;
			return changeSelected(prevElement);
		}

		if (query !== lastQuery) {
			filteredResults = fuse.search(query).map((e) => {
				return flattenedFiles[e.refIndex];
			});

			currentSelected = document.querySelector('.selected');
			lastQuery = query;
		}
	}

	function handleSubmit() {
		if (!currentSelected) {
			currentSelected = document.querySelector('.selected');
		}

		const href = currentSelected?.getAttribute('data-href');

		if (href) {
			goto('/preview/' + href);
			modalState.set('');
		}
	}
</script>

<dialog open={!!$modalState} on:click|self={() => modalState.set('')}>
	<form on:submit|preventDefault={handleSubmit}>
		<div class="input-container">
			<input
				type="text"
				bind:this={input}
				bind:value={query}
				on:keydown={handleTyping}
			/>
		</div>

		<div class="button-container" tabindex="-1">
			{#if $modalState === 'choose-file'}
				{#each query ? filteredResults : flattenedFiles as file, i}
					<button
						data-href={file.parent + '/' + file.name}
						class:selected={i === 0}
					>
						<Icon name="file" />
						<span class="specific">{file.name}</span>
						<span class="parent">{file.parent}</span>
					</button>
				{/each}
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
		background-color: darken($c-black-2, 10%);
		box-shadow: 4px 7px 20px 8px rgba(0, 0, 0, 0.1);
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
	input {
		background-color: darken($c-black-2, 3%);
		height: 100%;
		padding: 6px;
		width: 100%;
		border: none;
		color: white;
		font-size: 0.8rem;
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
