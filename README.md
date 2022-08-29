# Local Files Viewer

Simple program to view files in your browser. Text files, markdown, html, images, videos, audios, and fonts all work.

## Installation

```
git clone https://github.com/sixskys/local-files-viewer.git
cd local-files-viewer
npm i
```

## Previews

Markdown:

![markdown](assets/markdown.png)

For more previews, visit [previews.md](previews.md)

## Usage

This program currently works by opening up a folder: your env variable of `LFV_DEFAULT_FOLDER`.
You can use this program two ways:

a. going to this project directory changing your env variable and running `npm run dev`: `LFV_DEFAULT_FOLDER=~/Downloads/ npm run dev`
b. Use the helper script below, usage: `lfv <folder>`

```sh
#!/bin/sh

if [ ! "$1" = "" ]; then
    OLD_LFV=$LFV_DEFAULT_FOLDER
    LFV_DEFAULT_FOLDER="$(cd "$1" && pwd -P)"
fi

echo $LFV_DEFAULT_FOLDER

cd ~/code/local-files-viewer/
npm run dev

LFV_DEFAULT_FOLDER=$OLD_LFV
```

## Keybindings

`h` => go to previous file

`l` => go to next file

`ctrl+p` => toggle file finder

`ctrl+o` => toggle directory (allows you to change the base directory)

pallete mode:

(file mode) `ctrl+j`, `tab` => next item

(file mode) `ctrl+k`, `shift+tab` => previous item

(directory mode) `tab`=> completion

(directory mode) `shift+tab` => nothing

`ctrl+m`, `enter` => select item

`ctrl+[`, `Escape` => close pallete

## Future

- More optimizations, more modularization
- Editing files? Doubtful
- Handle large directorys mor gracefully. Originally the idea was to load x amount deep, then when the user requests
  load more, but with the file picker I switched it back to loading recurisively as much as needed.
- Error handling
  - On error page, be able to change base directory
