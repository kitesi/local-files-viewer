<script lang="ts">
	import { page } from '$app/stores';
	console.error($page.error);
</script>

<section>
	<div>
		<h1>{$page.status}</h1>
		<h2>
			{#if $page.status === 404}
				This page does not exist.
			{:else}
				{$page.error?.message}
			{/if}
		</h2>
	</div>
</section>

<style>
	h1 {
		font-size: 5rem;
	}

	h2 {
		max-width: 80ch;
	}

	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100%;
	}

	div {
		margin-left: 10%;
	}
</style>
