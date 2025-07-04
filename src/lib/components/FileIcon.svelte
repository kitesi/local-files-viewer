<script lang="ts">
	import { getFileIcon } from '../../get-file-icon';
	import { File } from '@lucide/svelte';

	export let fileName: string;
	export let size: string;

	const fileIconContents = getFileIcon(fileName);
</script>

{#if fileIconContents}
	<svg
		role="img"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill={fileIconContents.styles.fill}
		style="width: {size}; height: {size}"
	>
		<title>{fileIconContents.simpleIcon.title}</title>
		<path d={fileIconContents.simpleIcon.path} />
	</svg>
{:else}
	<File size={size} />
{/if}

<style>
	svg {
		display: inline-block;
		overflow: visible;
	}
</style>
