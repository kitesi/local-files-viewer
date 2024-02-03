#!/usr/bin/env node
// @ts-check

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const folder = process.argv[2];

if (folder) {
	process.env.LFV_DEFAULT_FOLDER = folder;
}

console.log('Previewing Folder: ' + process.env.LFV_DEFAULT_FOLDER);

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn('npm', ['run', 'preview'], { cwd: projectDirectory });

child.stderr.on('data', (b) => console.log(b + ''));
child.stdout.on('data', (b) => console.log(b + ''));
