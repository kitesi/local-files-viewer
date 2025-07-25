<script lang="ts">
	import {
		ChevronDown,
		ChevronRight,
		FolderOpen,
		FileText
	} from '@lucide/svelte';
	export let name: string;
	export let open: boolean;
	export let icon: 'folder' | 'outline' = 'folder';
</script>

<button
	class="flex mt-2 items-center gap-2 p-2 pl-4 whitespace-nowrap text-ellipsis overflow-hidden border-t border-b border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent w-full cursor-pointer font-semibold uppercase tracking-wide text-xs"
	class:open
	on:click={() => (open = !open)}
>
	{#if icon === 'folder'}
		<FolderOpen class="w-4 h-4 text-sidebar-foreground" />
	{:else if icon === 'outline'}
		<FileText class="w-4 h-4 text-sidebar-foreground" />
	{/if}
	<span class="font-medium">{name}</span>
	{#if open}
		<ChevronDown class="w-4 h-4 ml-auto text-sidebar-foreground" />
	{:else}
		<ChevronRight class="w-4 h-4 ml-auto text-sidebar-foreground" />
	{/if}
</button>

<div class={open ? 'block' : 'hidden'}>
	<slot />
</div>
