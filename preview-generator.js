/**
 *  This is a script to automate screenshots of the ui
 *  Won't work unless you have the same setup as me since it uses specific directories.
 */

// @ts-check
import path from 'path';
import os from 'os';
import { firefox } from 'playwright';
import { exec } from 'child_process';

/** @param {number} ms */
function sleep(ms) {
	return new Promise((res) => {
		setTimeout(res, ms);
	});
}

(async () => {
	// this is assuming no ports are using 5173, prob should parse the url
	// stdout from the exec()
	const previewPath = 'http://localhost:5173/preview';
	let controller = new AbortController();

	/** @param {string} dir */
	async function newBaseDirectory(dir) {
		console.log('New directory: ' + dir);

		process.env.LFV_DEFAULT_FOLDER = dir;
		await sleep(100);
		controller.abort();
		controller = new AbortController();

		exec('npx vite dev', { signal: controller.signal });
		await sleep(2000);
	}

	await newBaseDirectory(path.join(os.homedir(), 'code', 'scoped-sort'));

	let browser = await firefox.launch({
		// headless: false
	});
	let page = await browser.newPage();

	console.log('Getting markdown.png');
	await page.goto(`${previewPath}/README.md`);

	const outlineButton = page.locator(
		'main section > div > button:nth-of-type(2)'
	);
	await outlineButton.click();

	await page.screenshot({ path: `assets/markdown.png` });

	console.log('Getting javascript.png');
	await page.goto(`${previewPath}/previews.js`);
	await sleep(1000);
	await page.screenshot({ path: `assets/javascript.png` });

	console.log('Getting plain-image-file.png');
	await page.goto(`${previewPath}/vscode/assets/command-preview.gif`);
	await page.screenshot({ path: `assets/plain-image-file.png` });

	console.log('getting folder-picker.png');
	await page.keyboard.press('Control+o');
	const form = await page.locator('form');
	await form.screenshot({ path: 'assets/folder-picker.png' });

	console.log('getting font.png');
	await newBaseDirectory('/' + path.join('usr', 'share', 'fonts', 'truetype'));
	await page.setViewportSize({
		width: 1000,
		height: 700
	});
	await page.goto(`${previewPath}/CascadiaCode/CascadiaCode.ttf`);
	await page.screenshot({
		path: 'assets/font.png'
	});

	console.log('Getting html.png');
	await newBaseDirectory(path.join(os.homedir(), 'code', 'html-preview-test'));
	await page.setViewportSize({
		width: 1100,
		height: 1000
	});
	await page.goto(`${previewPath}/index.html`);
	await sleep(1000);
	await page.screenshot({
		path: 'assets/html.png'
	});

	await browser.close();
	process.exit(1);
})();
