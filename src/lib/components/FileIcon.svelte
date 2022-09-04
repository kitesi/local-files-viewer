<script lang="ts">
	import { getFileIcon } from '../../get-file-icon';
	import Icon from './Icon.svelte';

	export let fileName: string;
	export let size: string;

	const fileIconContents = getFileIcon(fileName);
</script>

{#if fileIconContents}
	{#if typeof fileIconContents === 'string'}
		<Icon name={fileIconContents} />
	{:else}
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
	{/if}
{:else}
	<Icon name="file" />
{/if}

<style>
	svg {
		display: inline-block;
		overflow: visible;
	}
</style>
