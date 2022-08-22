<script lang="ts">
	import { toasts } from '../../stores';
</script>

<section>
	{#each $toasts as error}
		<div>
			<p>{error.msg}</p>
		</div>
	{/each}
</section>

<style>
	section {
		position: absolute;
		bottom: 0px;
		right: 0px;
		margin: 10px;
	}

	div {
		padding: 10px 15px;
		background-color: #ce4547;
		border-radius: 5px;
		margin-top: 10px;
	}
</style>
