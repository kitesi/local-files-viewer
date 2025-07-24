function shouldClosePalette(ev: KeyboardEvent) {
	return (
		ev.key === 'Escape' ||
		(ev.ctrlKey && ev.key === 'y') ||
		(ev.ctrlKey && ev.key === '[') ||
		(ev.ctrlKey && ev.key === 'p') ||
		(ev.ctrlKey && ev.key === 'o')
	);
}

function shouldSubmitItem(ev: KeyboardEvent) {
	return ev.key === 'Enter' || (ev.key === 'm' && ev.ctrlKey);
}

function shouldNavigateNext(ev: KeyboardEvent) {
	return ev.key === 'ArrowDown' || (ev.key === 'j' && ev.ctrlKey);
}
function shouldNavigatePrevious(ev: KeyboardEvent) {
	return ev.key === 'ArrowUp' || (ev.key === 'k' && ev.ctrlKey);
}

function shouldOpenFilePalette(ev: KeyboardEvent) {
	return ev.key === 'p' && ev.ctrlKey;
}
function shouldOpenDirectoryPalette(ev: KeyboardEvent) {
	return ev.key === 'o' && ev.ctrlKey;
}

function shouldOpenSearchPalette(ev: KeyboardEvent) {
	return ev.key === 'y' && ev.ctrlKey;
}

export default {
	opened: {
		shouldClosePalette,
		shouldSubmitItem,
		shouldNavigateNext,
		shouldNavigatePrevious
	},
	notOpened: {
		shouldOpenFilePalette,
		shouldOpenDirectoryPalette,
		shouldOpenSearchPalette
	}
};
