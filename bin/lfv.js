#!/usr/bin/env node
// @ts-check

// if [ ! "$1" = "" ]; then
//     OLD_LFV=$LFV_DEFAULT_FOLDER
//     LFV_DEFAULT_FOLDER="$(cd "$1" && pwd -P)"
// fi

// echo $LFV_DEFAULT_FOLDER

// cd ~/code/local-files-viewer/
// npm run dev

// LFV_DEFAULT_FOLDER=$OLD_LFV

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
