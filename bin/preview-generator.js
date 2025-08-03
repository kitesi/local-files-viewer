/**
 *  This is a script to automate screenshots of the ui
 *  Won't work unless you have the same setup as me since it uses specific directories.
 */

// @ts-check
import path from 'path';
import os from 'os';
import { firefox } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');

/** @param {number} ms */
function sleep(ms) {
	return new Promise((res) => {
		setTimeout(res, ms);
	});
}

/** @param {string} image */
function getImagePath(image) {
	return path.join(assetsDir, image);
}

let viteProcess = null;
/** @param {string} dir */
async function newBaseDirectory(dir) {
	if (viteProcess) {
		viteProcess.kill();
		viteProcess = null;
	}
	console.log('Starting vite preview with LFV_DEFAULT_FOLDER=' + dir);

	// spawn vite preview with env including LFV_DEFAULT_FOLDER
	viteProcess = spawn('pnpx', ['vite', 'preview'], {
		env: { ...process.env, LFV_DEFAULT_FOLDER: dir },
		stdio: 'inherit'
	});

	// wait a bit for vite preview to start up
	await new Promise((resolve) => setTimeout(resolve, 2000));
}

(async () => {
	console.log(
		'Make sure you have built the project & are not running anything on 4173'
	);
	// this is assuming no ports are using 4173, prob should parse the url
	// stdout from the exec()
	const previewPath = 'http://localhost:4173/preview';

	await newBaseDirectory(path.join(os.homedir(), 'code', 'scoped-sort'));

	let browser = await firefox.launch({
		headless: false
	});
	let page = await browser.newPage();

	console.log('Getting markdown.png');
	await page.goto(`${previewPath}/README.md`);

	const outlineButton = page.locator(
		'main section > div > div  > button:nth-of-type(2)'
	);
	await outlineButton.click();

	await sleep(1000);
	await page.screenshot({ path: getImagePath(`markdown.png`) });

	console.log('Getting javascript.png');
	await page.goto(`${previewPath}/test-utils.js`);
	await sleep(1000);
	await page.screenshot({ path: getImagePath(`javascript.png`) });

	console.log('Getting plain-image-file.png');
	await page.goto(`${previewPath}/assets/command-preview.gif`);
	await page.screenshot({ path: getImagePath(`plain-image-file.png`) });

	console.log('getting folder-picker.png');
	await page.keyboard.press('Control+o');
	const form = page.locator('div[role="dialog"]');
	await form.screenshot({ path: getImagePath('folder-picker.png') });

	console.log('getting font.png');
	await newBaseDirectory(path.join(__dirname, '..'));
	await page.setViewportSize({
		width: 1000,
		height: 700
	});
	await page.goto(`${previewPath}/assets/CascadiaCode.ttf`);
	await page.screenshot({
		path: getImagePath('font.png')
	});

	console.log('Getting html.png');
	await page.setViewportSize({
		width: 1100,
		height: 1000
	});
	await page.goto(`${previewPath}/index.html`);
	await page.goto(`${previewPath}/assets/index.html`);
	await sleep(1000);
	await page.screenshot({
		path: getImagePath('html.png')
	});

	await browser.close();
	process.exit(1);
})();
