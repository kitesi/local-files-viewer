<script lang="ts">
	import { toasts } from '../stores';
	import { AlertCircle } from '@lucide/svelte';

	// Group toasts by message and count duplicates
	$: groupedToasts = $toasts.reduce(
		(acc, toast) => {
			const existing = acc.find((t) => t.msg === toast.msg);
			if (existing) {
				existing.count = (existing.count || 1) + 1;
				existing.ids = [...(existing.ids || [existing.id]), toast.id];
			} else {
				acc.push({ ...toast, count: 1, ids: [toast.id] });
			}
			return acc;
		},
		[] as Array<(typeof $toasts)[0] & { count: number; ids: string[] }>
	);
</script>

<section class="fixed bottom-4 right-4 z-50 space-y-3">
	{#each groupedToasts as toast (toast.ids[0])}
		<div
			class="bg-red-700/90 text-white px-4 py-3 rounded-lg shadow-lg border border-red-800/50 max-w-sm animate-in slide-in-from-right-2 duration-300 backdrop-blur-sm"
		>
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0 w-5 h-5 mt-0.5">
					<AlertCircle class="w-5 h-5" />
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex items-center justify-between">
						<p class="text-sm font-medium leading-5">{toast.msg}</p>
						{#if toast.count > 1}
							<span
								class="bg-red-800/70 text-xs font-medium px-2 py-1 rounded-full ml-2"
							>
								{toast.count}
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/each}
</section>
