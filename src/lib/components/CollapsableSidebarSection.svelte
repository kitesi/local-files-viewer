<script lang="ts">
	import Icon from './Icon.svelte';
	export let name: string;
	export let open: boolean;
</script>

<button 
	class="bg-transparent flex items-center gap-1.5 p-1.5 pl-5 whitespace-nowrap text-ellipsis overflow-auto text-white border-none border-y-2 border-black-4 shadow-lg mt-1.5 text-base w-full cursor-pointer transition-transform duration-2000"
	class:open={open} 
	on:click={() => (open = !open)}
>
	<Icon name={open ? 'arrow-down' : 'arrow-right'} />
	<b>{name}</b>
</button>

<div class={open ? 'block' : 'hidden'}>
	<slot />
</div>


