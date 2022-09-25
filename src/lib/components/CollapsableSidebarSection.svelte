<script lang="ts">
	import Icon from './Icon.svelte';
	export let name: string;
	export let open: boolean;
</script>

<button class:open on:click={() => (open = !open)}>
	<Icon name={open ? 'arrow-down' : 'arrow-right'} />
	<b>{name}</b>
</button>

<div>
	<slot />
</div>

<style lang="scss">
	@use '../styles/variables.scss' as *;

	button {
		background-color: transparent;
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px;
		padding-left: 20px;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: auto;
		color: $sidebar-collapasable-button-text-color;
		border: none;
		border-block: 2px solid $sidebar-collapasable-button-border-color;
		box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.14),
			0px 3px 1px -2px rgba(0, 0, 0, 0.12), 0px 1px 5px 0px rgba(0, 0, 0, 0.2);
		margin-top: 5px;
		font-size: 1rem;
		width: 100%;
		cursor: pointer;
		transition: transform 2000ms;
	}

	:not(.open) + div {
		display: none;
	}
</style>
