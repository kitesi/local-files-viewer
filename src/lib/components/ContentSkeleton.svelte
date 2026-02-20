<script lang="ts">
	type SkeletonVariant = 'prose' | 'code' | 'plain' | 'media';

	export let variant: SkeletonVariant = 'prose';

	const skeletonClass = 'animate-pulse rounded bg-sidebar-accent';
</script>

{#if variant === 'prose'}
	<div
		class="max-w-[90ch] mx-auto py-[min(100px,calc((100%-90ch)/2))] space-y-4"
	>
		<div class="{skeletonClass} h-8 w-3/4 max-w-md"></div>
		<div class="space-y-2">
			<div class="{skeletonClass} h-4 w-full"></div>
			<div class="{skeletonClass} h-4 w-full"></div>
			<div class="{skeletonClass} h-4 w-5/6"></div>
		</div>
		<div class="{skeletonClass} h-6 w-1/2 max-w-xs"></div>
		<div class="space-y-2">
			<div class="{skeletonClass} h-4 w-full"></div>
			<div class="{skeletonClass} h-4 w-4/5"></div>
		</div>
		<div class="{skeletonClass} h-40 w-full rounded-lg mt-4"></div>
		<div class="space-y-2">
			<div class="{skeletonClass} h-4 w-full"></div>
			<div class="{skeletonClass} h-4 w-3/4"></div>
		</div>
	</div>
{:else if variant === 'code'}
	<div class="max-w-full px-2">
		<div
			class="{skeletonClass} h-80 w-full rounded-lg max-w-[90ch] mx-auto py-[min(100px,calc((100%-90ch)/2))]"
		></div>
	</div>
{:else if variant === 'plain'}
	<div
		class="max-w-[80ch] mx-auto py-[min(100px,calc((100%-80ch)/2))] space-y-1.5 text-lg"
	>
		{#each [95, 88, 70, 100, 82, 65, 90, 75, 98, 80, 72, 85, 78, 92] as pct}
			<div class="{skeletonClass} h-5" style="width: {pct}%"></div>
		{/each}
	</div>
{:else if variant === 'media'}
	<div class="grid place-items-center h-full min-h-[200px]">
		<div class="{skeletonClass} h-64 w-96 max-w-full rounded-lg"></div>
	</div>
{/if}
