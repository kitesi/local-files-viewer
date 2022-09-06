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

<button
	on:click={() => isSidebarOpen.set(!$isSidebarOpen)}
	aria-pressed={$isSidebarOpen}
	aria-label="toggle sidebar"
>
	<span />
</button>

<div>
	<p class="base-dir"><b>{getLastDirectory($baseDirectory)}</b></p>
	<ul>
		{#if $files.children && $files.children.length > 0}
			{#each $files.children as child (child.name)}
				<NavbarItem item={child} parentPath="" />
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

	div {
		position: absolute;
		background-color: $c-black-5;
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

	$hamburger-gap: 7px;
	button {
		position: absolute;
		background-color: transparent;
		inset: $hamburger-gap 0 auto auto;
		border: none;
		padding: 15px;
		z-index: 3;
	}

	span {
		display: block;
		position: relative;
	}

	span,
	span::before,
	span::after {
		width: 2em;
		height: 3px;
		background-color: white;
		transition: transform 150ms ease-in-out, opacity 200ms linear;
	}

	span::before,
	span::after {
		content: '';
		position: absolute;
		left: 0;
	}

	span::before {
		top: $hamburger-gap;
	}

	span::after {
		bottom: $hamburger-gap;
	}

	button[aria-pressed='true'] ~ div {
		transform: translateX(0);
		visibility: visible;
		box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.57);
		-webkit-box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.57);
		-moz-box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.57);
	}

	button[aria-pressed='true'] > span {
		transform: rotate(45deg);
	}

	button[aria-pressed='true'] > span::before {
		opacity: 0;
	}

	button[aria-pressed='true'] > span::after {
		transform: rotate(90deg) translateX($hamburger-gap);
	}

	@media screen and (min-width: $size-1) {
		div,
		button[aria-pressed='true'] ~ div {
			position: static;
			transform: translateX(0);
			box-shadow: none;
			-webkit-box-shadow: none;
			-moz-box-shadow: none;
		}

		button {
			opacity: 0;
			visibility: hidden;
			pointer-events: none;
		}
	}
</style>
