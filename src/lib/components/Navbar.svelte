<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	import type { WalkDirItem } from '../../mem-fs';
	export let files: WalkDirItem;

	let isChecked = false;

	// function removeChecked(ev: Event) {
	// 	isChecked = false;
	// }

	let html = '';
	let level = 1;

	function addLiElement(item: WalkDirItem, basePath: string) {
		const hasChildren = item.children && item.children.length > 0;
		const href = basePath + '/' + item.name;
		const active = '/' + $page.params.file === href;

		html += `<li class="level-${level}${hasChildren ? ' has-children' : ''}${
			active ? ' active' : ''
		}"><a href="${href}">${item.name}</a>`;
	}

	function addUlElement(items: WalkDirItem[], basePath: string) {
		html += '<ul>';

		for (const item of items) {
			addLiElement(item, basePath);

			if (item.children) {
				level++;
				addUlElement(item.children, basePath + '/' + item.name);
				level--;
			}

			html += '</li>';
		}

		html += '</ul>';
	}

	addUlElement(files.children!, '');

	onMount(() => {
		const aTagsOfLiParent = document.querySelectorAll('li.has-children a');
		const aTags = document.getElementsByTagName('a');
		let activeTag = document.querySelector('.active');

		function toggleCollapse(ev: Event) {
			const aTag = ev.target;

			if (!aTag || !(aTag instanceof HTMLAnchorElement)) {
				return;
			}

			aTag.parentElement!.classList.toggle('collapse');
		}

		function setActiveClass(ev: Event) {
			activeTag?.classList.remove('active');

			const aTag = ev.target;

			if (!aTag || !(aTag instanceof HTMLAnchorElement)) {
				return;
			}

			aTag.parentElement!.classList.add('active');
			activeTag = aTag.parentElement!;
		}

		for (const aTag of [...aTagsOfLiParent]) {
			aTag.addEventListener('click', toggleCollapse);
		}

		for (const aTag of aTags) {
			aTag.addEventListener('click', setActiveClass);
		}
	});
</script>

<input
	aria-label={isChecked ? 'Close' : 'Open'}
	type="checkbox"
	id="menu-toggle"
	bind:checked={isChecked}
/>
<label for="menu-toggle">
	<span class="top" />
	<span class="middle" />
	<span class="bottom" />
</label>

<div>
	{@html html}
</div>

<style lang="scss">
	@use '../../variables.scss' as *;

	input {
		opacity: 0;
		position: absolute;
	}

	div {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		max-width: 10rem;
		min-width: 280px;
		height: 100%;
		background-color: darken($c-black-2, 5%);
		transform: translateX(-100%);
		transition: 100ms linear;
		padding: 15px;
		z-index: 2;
		overflow: auto;
	}

	div:global {
		ul {
			margin-left: 10px;
			list-style-type: none;
		}

		li {
			padding: 5px;
			max-width: 90%;
		}

		li.has-children::before {
			content: '🗀 ';
		}

		li.has-children.collapse::before {
			content: '🗁 ';
		}

		li.level-1 {
			font-weight: 700;
		}

		.active {
			color: #76ec94;
		}

		.active ul {
			color: white;
		}

		a {
			color: inherit;
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
		}
	}
</style>
