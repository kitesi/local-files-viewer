<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import XIcon from "@lucide/svelte/icons/x";
	import type { Snippet } from "svelte";
	import * as Dialog from "./index.js";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		showCloseButton = true,
		position = "default",
		size = "default",
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: DialogPrimitive.PortalProps;
		children: Snippet;
		showCloseButton?: boolean;
		position?: "default" | "top" | "bottom-left" | "bottom-center" | "bottom-right";
		size?: "default" | "sm" | "md" | "lg" | "xl" | "fullscreen" | "none";
	} = $props();

	function dialogVariants(position: string, size: string) {
		const positionClasses = {
			default: "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
			top: "left-[50%] top-8 translate-x-[-50%] data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4",
			"bottom-left": "left-6 bottom-6 data-[state=closed]:slide-out-to-bottom-16 data-[state=open]:slide-in-from-bottom-16",
			"bottom-center": "left-[50%] bottom-6 translate-x-[-50%] data-[state=closed]:slide-out-to-bottom-16 data-[state=open]:slide-in-from-bottom-16",
			"bottom-right": "right-6 bottom-6 data-[state=closed]:slide-out-to-bottom-16 data-[state=open]:slide-in-from-bottom-16"
		};

		const sizeClasses = {
			default: "max-w-lg",
			sm: "max-w-md",
			md: "max-w-lg", 
			lg: "max-w-xl",
			xl: "max-w-2xl",
			fullscreen: "w-screen h-screen",
			none: ""
		};

		return cn(
			"fixed z-50 grid w-full gap-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-lg border bg-background p-6",
			positionClasses[position as keyof typeof positionClasses] || positionClasses.default,
			sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default
		);
	}
</script>

<Dialog.Portal {...portalProps}>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn(dialogVariants(position, size), className)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<DialogPrimitive.Close
				class="ring-offset-background focus:ring-ring rounded-xs focus:outline-hidden absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
			>
				<XIcon />
				<span class="sr-only">Close</span>
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</Dialog.Portal>
