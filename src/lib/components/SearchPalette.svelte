<script lang="ts">
	import { Search, FileText } from '@lucide/svelte';
	import { modalState, addToastError } from '$lib/stores/index';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { apiClient } from '$lib/client-utils/api-client';
	import { cn } from '$lib/utils';
	import mappings from '$lib/client-utils/key-mappings';

	interface SearchResult {
		file: string;
		line: number;
		text: string;
	}

	let query = '';
	let results: SearchResult[] = [];
	let isLoading = false;
	let errorText = '';

	let input: HTMLInputElement;
	let selectedIndex = 0;
	let previewLines: string[] = [];
	let previewLoading = false;
	let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

	// Reactive statement that runs immediately when modalState changes
	$: if ($modalState === 'search' && browser) {
		// Focus input immediately when modal opens
		if (input) {
			input.focus();
		}
		query = '';
		results = [];
		selectedIndex = 0;
		previewLines = [];
	}

	async function performSearch() {
		if (query.length < 3) {
			results = [];
			previewLines = [];
			return;
		}
		isLoading = true;
		try {
			const response = await apiClient.searchFilesEnhanced(query, 'content');
			// Only keep the first match per file (deduplicate by file)
			const seen = new Set();
			results = response.results
				.filter((r) => {
					if (seen.has(r.file)) return false;
					seen.add(r.file);
					return true;
				})
				.map((r) => ({
					file: r.path || r.file,
					line: r.line || 1,
					text: r.text || ''
				}));
			selectedIndex = 0;
			if (results.length > 0) {
				await loadPreview(results[0]);
			} else {
				previewLines = [];
			}
		} catch (error) {
			if (error instanceof Error) {
				errorText = error.message;
			} else {
				errorText = 'Search failed';
			}

			results = [];
			previewLines = [];
		} finally {
			isLoading = false;
		}
	}

	async function loadPreview(result: SearchResult) {
		previewLoading = true;
		previewLines = [];
		try {
			const filePath = result.file;
			const fileContent = await apiClient.getFileContents(filePath);
			const lines = (fileContent.content || fileContent.html || '').split('\n');
			const start = Math.max(0, result.line - 4);
			const end = Math.min(lines.length, result.line + 3);
			previewLines = lines.slice(start, end);
		} catch (e) {
			previewLines = ['(Could not load preview)'];
		} finally {
			previewLoading = false;
		}
	}

	function handleKeydown(ev: KeyboardEvent) {
		ev.stopPropagation();

		if (mappings.opened.shouldClosePalette(ev)) {
			ev.preventDefault();
			modalState.set('');
			return;
		}

		if (mappings.opened.shouldSubmitItem(ev)) {
			ev.preventDefault();
			if (
				results.length > 0 &&
				selectedIndex >= 0 &&
				selectedIndex < results.length
			) {
				handleResultClick(results[selectedIndex]);
			}
			return;
		}

		const isNormalTab = ev.key === 'Tab' && !ev.shiftKey;
		const isShiftTab = ev.key === 'Tab' && ev.shiftKey;

		if (isNormalTab || mappings.opened.shouldNavigateNext(ev)) {
			ev.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
			if (results[selectedIndex]) loadPreview(results[selectedIndex]);
			return;
		}

		if (isShiftTab || mappings.opened.shouldNavigatePrevious(ev)) {
			ev.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			if (results[selectedIndex]) loadPreview(results[selectedIndex]);
			return;
		}
	}

	function handleInput() {
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			if (query.length < 3) {
				results = [];
				previewLines = [];
				return;
			}
			performSearch();
		}, 300);
	}

	function handleResultClick(result: SearchResult) {
		modalState.set('');
		const filePath = result.file.replace(/^\.\//, '');
		goto(`/preview/${filePath}#L${result.line}`).catch((err) => {
			if (err.message) {
				addToastError(err.message);
			}
		});
	}
</script>

<Dialog open={$modalState === 'search'}>
	<DialogContent
		position="top"
		class="bg-popover text-popover-foreground border-1 border-popover-border shadow-lg rounded-lg p-0 font-mono max-w-[90vw] lg:max-w-5xl overflow-hidden w-full"
		size="none"
		onkeydown={handleKeydown}
	>
		<div class="w-full h-[70vh] flex flex-col">
			<div
				class="flex items-center border-b border-border bg-popover px-4 py-2 text-base min-w-0"
			>
				<Search class="w-5 h-5 text-muted-foreground mr-2" />
				<input
					id="search-input"
					class="flex-1 bg-transparent outline-none border-none text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0"
					type="text"
					placeholder="Search through files..."
					bind:value={query}
					autocomplete="off"
					autocapitalize="off"
					autocorrect="off"
					onkeydown={handleKeydown}
					oninput={handleInput}
					bind:this={input}
				/>
			</div>
			<div class="grid grid-cols-[40%_60%] flex-1 h-0 rounded-lg min-w-0">
				<div
					class="border-r border-border overflow-y-auto overflow-x-hidden scrollbar-none"
				>
					{#if query.length < 3}
						<div class="py-8 text-center text-muted-foreground text-base">
							Type at least 3 characters to search…
						</div>
					{:else if isLoading}
						<div class="py-8 text-center text-muted-foreground text-base">
							Searching...
						</div>
					{:else if results.length > 0}
						{#each results as result, i (result.file + result.line)}
							<button
								type="button"
								class={cn(
									'grid grid-cols-[1fr_auto] items-center w-full text-left bg-transparent p-2 border-none text-base font-mono',
									i === selectedIndex
										? 'bg-sidebar-accent text-sidebar-accent-foreground'
										: 'hover:bg-sidebar-accent-hover hover:text-sidebar-accent-foreground'
								)}
								onclick={() => handleResultClick(result)}
								onmouseenter={() => {
									selectedIndex = i;
									loadPreview(result);
								}}
							>
								<span class="flex items-center gap-2">
									<FileText class="w-4 h-4 flex-shrink-0  mr-1" />
									<span class="text-xs truncate"
										>{result.file}:L{result.line} {result.text.trim()}</span
									>
								</span>
							</button>
						{/each}
					{:else if query && !isLoading}
						<div class="py-8 text-center text-muted-foreground text-base">
							No results found for "{query}"
						</div>
					{/if}
				</div>
				<div
					class="bg-background px-6 py-4 overflow-y-auto border-l border-border flex flex-col"
				>
					{#if results[selectedIndex]}
						<div
							class="sticky top-0 z-10 bg-background border-b border-border pb-2 mb-2 flex items-center gap-2"
						>
							<FileText class="w-4 h-4 text-muted-foreground" />
							<span class="font-semibold text-base truncate"
								>{results[selectedIndex].file}</span
							>
							<span class="text-xs text-muted-foreground"
								>Line {results[selectedIndex].line}</span
							>
						</div>
					{/if}
					{#if previewLoading}
						<div class="text-muted-foreground text-base py-8 text-center">
							Loading preview...
						</div>
					{:else if previewLines.length > 0}
						<pre class="text-base font-mono leading-snug whitespace-pre-wrap">
							{#each previewLines as line, idx}
								<span
									class={idx +
										(results[selectedIndex]?.line
											? Math.max(0, results[selectedIndex].line - 4)
											: 0) +
										1 ===
									results[selectedIndex]?.line
										? 'bg-accent text-accent-foreground rounded px-1'
										: ''}>{line}</span
								>
								{#if idx < previewLines.length - 1}
									<br />
								{/if}
							{/each}
						</pre>
					{:else if errorText}
						<div class="text-muted-foreground text-base py-8 text-center">
							{errorText}
						</div>
					{:else}
						<div class="text-muted-foreground text-base py-8 text-center">
							No preview
						</div>
					{/if}
				</div>
			</div>
		</div>
	</DialogContent>
</Dialog>
