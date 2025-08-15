<!-- inspired by vscode's file/command palette -->
<!-- TODO: after it reaches half way, the view is always at the middle as you go down. this is not intended-->
<script lang="ts">
	import FileIcon from './FileIcon.svelte';
	import mappings from '$lib/client-utils/key-mappings';
	import { modalState, files, addToastError } from '$lib/stores/index';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { Search, Folder } from '@lucide/svelte';

	import type { WalkDirItem } from '$lib/server-utils/mem-fs';
	import { cn } from '$lib/utils';
	import { apiClient } from '$lib/client-utils/api-client';
	import { onDestroy } from 'svelte';

	interface File {
		parents: string;
		name: string;
	}

	interface WalkDirItemWithParent extends WalkDirItem {
		parents: string;
	}

	let flattenedResults: File[] = [];
	let filteredResults: File[] = [];
	let query = '';
	let input: HTMLInputElement;
	let throttleTimer: ReturnType<typeof setTimeout> | null = null;
	const THROTTLE_DELAY = 200;
	let lastExecuted = 0;
	let currentAbortController: AbortController | null = null;

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
		try {
			// Abort previous request if it exists
			if (currentAbortController) {
				currentAbortController.abort();
			}
			currentAbortController = new AbortController();

			const res = await apiClient.searchDirectories(
				query,
				currentAbortController.signal
			);

			let normalizedQuery = query.replace(/(?<!\\)~/, res.homedir);
			let pathsOfQuery = normalizedQuery.match(/\/?[^/]*$/);

			if (pathsOfQuery && pathsOfQuery[0]) {
				normalizedQuery = pathsOfQuery[0];

				if (normalizedQuery.startsWith('/')) {
					normalizedQuery = normalizedQuery.slice(1);
				}
			}

			filteredResults = res.files
				.map((e) => {
					if (e.endsWith('/')) {
						e = e.slice(0, -1);
					}

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
		} catch (e) {
			// Don't show error if request was aborted
			if (e instanceof Error && e.name === 'AbortError') {
				return;
			}

			console.error('error setting filtered directory results', e);
			addToastError('Error: unable to search directories');
		}
	}

	async function setFilteredFileResults() {
		try {
			// Abort previous request if it exists
			if (currentAbortController) {
				currentAbortController.abort();
			}
			currentAbortController = new AbortController();

			const res = await apiClient.searchFilesEnhanced(
				query,
				'filename',
				undefined,
				currentAbortController.signal
			);
			filteredResults = res.results.map((r) => {
				const lastSlash = r.path.lastIndexOf('/');
				return {
					name: r.file,
					parents: lastSlash !== -1 ? r.path.slice(0, lastSlash) : ''
				};
			});
		} catch (e) {
			// Don't show error if request was aborted
			if (e instanceof Error && e.name === 'AbortError') {
				return;
			}
			console.error('error setting filtered file results', e);
			addToastError('Error: unable to search files');
		}
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
		}

		if ($modalState === 'choose-directory') {
			flattenedResults = [];
			filteredResults = [];
			setFilteredDirectoryResults().catch(console.error);
		}
	}

	function changeSelected(direction: 'next' | 'prev') {
		const currentSelected = document.querySelector('button.selected');
		const nextElement =
			direction === 'next'
				? currentSelected?.nextElementSibling
				: currentSelected?.previousElementSibling;

		if (currentSelected && nextElement) {
			currentSelected.classList.remove('selected');
			nextElement.classList.add('selected');
			nextElement.scrollIntoView({ block: 'center' });
		}
	}

	async function handleKeydown(ev: KeyboardEvent) {
		ev.stopPropagation();

		if (mappings.opened.shouldClosePalette(ev)) {
			modalState.set('');
			return;
		}

		if (mappings.opened.shouldSubmitItem(ev)) {
			handleItemSubmission(
				document.querySelector('button.selected')?.getAttribute('data-href') ||
					''
			);
		}

		const isNormalTab = ev.key === 'Tab' && !ev.shiftKey;
		const isShiftTab = ev.key === 'Tab' && ev.shiftKey;

		if ($modalState === 'choose-directory') {
			if (mappings.opened.shouldNavigateNext(ev)) {
				changeSelected('next');
				return;
			}

			if (mappings.opened.shouldNavigatePrevious(ev)) {
				changeSelected('prev');
				return;
			}

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

		if (isNormalTab || mappings.opened.shouldNavigateNext(ev)) {
			return changeSelected('next');
		}

		if (isShiftTab || mappings.opened.shouldNavigatePrevious(ev)) {
			return changeSelected('prev');
		}
	}

	function handleItemSubmission(href: string) {
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
			apiClient
				.setNewBaseDir(href)
				.then(() => {
					goto('/preview')
						.then(() => {
							window.location.reload();
						})
						.catch((err) => {
							console.error('error navigating to preview', err);
							if (err.message) {
								addToastError(err.message);
							}
						});
				})
				.catch((err) => {
					console.error('error setting new base dir', err);
					if (err.message) {
						addToastError(err.message);
					}
				})
				.finally(() => {
					modalState.set('');
				});
		}
	}

	async function executeSearch() {
		if ($modalState === 'choose-directory') {
			await setFilteredDirectoryResults().catch(console.error);
		} else {
			if (!query) {
				filteredResults = flattenedResults;
			} else {
				await setFilteredFileResults();
			}
		}
	}

	async function handleInput(_: Event) {
		const now = Date.now();

		if (now - lastExecuted >= THROTTLE_DELAY) {
			executeSearch();
			lastExecuted = now;
		} else {
			if (throttleTimer) clearTimeout(throttleTimer);
			throttleTimer = setTimeout(
				() => {
					executeSearch();
					lastExecuted = now;
				},
				THROTTLE_DELAY - (now - lastExecuted)
			);
		}
	}

	onDestroy(() => {
		if (throttleTimer) clearTimeout(throttleTimer);
		if (currentAbortController) {
			currentAbortController.abort();
		}
	});

	function getPreviewPath(path: string) {
		if ($modalState === 'choose-file') {
			return '/preview/' + path.replace(/^\.?\//, '').replace(/\\/g, '/');
		}

		return path;
	}

	function getOpenState() {
		return $modalState === 'choose-file' || $modalState === 'choose-directory';
	}

	function setOpenState(state: boolean) {
		modalState.set(state ? 'choose-file' : '');
	}
</script>

<Dialog bind:open={getOpenState, setOpenState}>
	<DialogContent
		position="top"
		class="bg-popover text-popover-foreground border-1 border-popover-border shadow-lg rounded-lg w-full max-w-lg mx-4 p-0 overflow-x-hidden"
		onkeydown={handleKeydown}
		oninput={handleInput}
	>
		<div class="w-full">
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
				</div>
			</div>
			<div class="max-h-[60vh] overflow-auto overflow-x-hidden" tabindex="-1">
				{#if filteredResults.length > 0}
					{#each filteredResults as file, i (file.parents + '/' + file.name)}
						{@const href = getPreviewPath(file.parents + '/' + file.name)}
						<button
							type="button"
							data-href={href}
							class={cn(
								'flex items-center gap-1.5 w-full text-left bg-transparent text-popover-foreground p-0.5 px-2.5 border-none text-base hover:bg-sidebar-accent-hover',
								i == filteredResults.length - 1 && 'rounded-sm'
							)}
							class:selected={i === 0}
							onclick={() => handleItemSubmission(href)}
						>
							{#if $modalState === 'choose-file'}
								<FileIcon fileName={file.name} size="20px" />
							{:else}
								<Folder />
							{/if}
							<span class="whitespace-nowrap overflow-hidden text-ellipsis"
								>{file.name}</span
							>
							<span
								class="whitespace-nowrap overflow-hidden text-ellipsis text-muted-foreground"
								>{file.parents}</span
							>
						</button>
					{/each}
				{:else}
					<p class="text-popover-foreground p-1.5 px-2.5">
						No matching results.
					</p>
				{/if}
			</div>
		</div>
	</DialogContent>
</Dialog>

<style>
	.selected {
		outline: none;
		background-color: var(--sidebar-accent);
		color: var(--sidebar-accent-foreground);
	}
</style>
