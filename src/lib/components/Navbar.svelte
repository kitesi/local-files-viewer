<script lang="ts">
	import NavbarItem from './NavbarItem.svelte';
	import { baseDirectory, files, isSidebarOpen } from '../../stores';

	function getLastDirectory(dir: string) {
		const paths = dir.split('/');
		return dir.endsWith('/')
			? paths[paths.length - 2]
			: paths[paths.length - 1];
	}
</script>

<input
	aria-label={$isSidebarOpen ? 'Close' : 'Open'}
	type="checkbox"
	id="menu-toggle"
	bind:checked={$isSidebarOpen}
/>
<label for="menu-toggle">
	<span class="top" />
	<span class="middle" />
	<span class="bottom" />
</label>

<div>
	<p class="base-dir"><b>{getLastDirectory($baseDirectory)}</b></p>
	<ul>
		{#if $files.children && $files.children.length > 0}
			{#each $files.children as child (child.name)}
				<NavbarItem item={child} parentPath="/preview" />
			{/each}
		{:else}
			<p><b>No files</b></p>
		{/if}
	</ul>
</div>

<style lang="scss">
	@use '../../lib/styles/variables.scss' as *;

	.base-dir {
		padding: 5px;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: auto;
		margin-left: 15px;
		margin-top: 5px;
		color: white;
	}

	input {
		opacity: 0;
		position: absolute;
	}

	div {
		position: absolute;
		background-color: $c-black-3;
		color: #858383;
		top: 0;
		left: 0;
		width: 100%;
		max-width: 10rem;
		min-width: 280px;
		height: 100%;
		border-right: 1px solid $c-black-4;
		transform: translateX(-100%);
		transition: 100ms linear;
		z-index: 2;
		overflow: auto;
		scrollbar-width: none;
	}

	ul {
		margin-left: 15px;
		list-style-type: none;
	}

	div:global {
		.active {
			color: $c-yellow-1;
		}

		li:not(.collapse) > ul {
			display: none;
		}
	}

	input:checked ~ div {
		transform: translateX(0);
		box-shadow: 27px 0px 43px -3px rgba(0, 0, 0, 0.27);
		-webkit-box-shadow: 27px 0px 43px -3px rgba(0, 0, 0, 0.27);
		-moz-box-shadow: 27px 0px 43px -3px rgba(0, 0, 0, 0.27);
	}

	span {
		display: block;
		top: 20px;
		right: 0px;
	}

	span {
		display: block;
		width: 1.8rem;
		height: 2px;
		background-color: white;
		transition-duration: 100ms;
	}

	label {
		display: flex;
		position: absolute;
		right: 20px;
		top: 20px;
		flex-direction: column;
		justify-content: space-between;
		height: 16px;
		z-index: 1;
		cursor: pointer;
	}

	input:checked ~ label .middle {
		opacity: 0;
	}

	input:checked ~ label .top {
		transform: rotate(45deg);
	}

	input:checked ~ label .bottom {
		transform: rotate(135deg) translate(-10px, 10px);
	}

	@media screen and (min-width: $size-1) {
		div,
		input:checked ~ div {
			position: static;
			transform: translateX(0);
			box-shadow: none;
			-webkit-box-shadow: none;
			-moz-box-shadow: none;
		}

		label {
			opacity: 0;
			visibility: hidden;
		}
	}
</style>
