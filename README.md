# Local Files Viewer

Simple program to view files in your browser including text files, markdown,
HTML, PDFs, images, videos, audio, and fonts.

Check out [filebrowser](https://filebrowser.org/installation), which might better
suit your needs.

## Previews

Markdown:

![markdown](assets/markdown.png)

For more previews, visit [previews.md](previews.md)

### Security Note

I don't believe this program exposes any additional security threat, but in the
instances of one, I am not responsible for any damages.

It uses the web browser's provided API for images, videos, audios, fonts, and
iframes to display HTML & PDF content. It uses node's `fs.readFile` to read the
file contents.

## Installation

```shell
npm i -g local-files-viewer
```

Or install yourself:

```shell
git clone https://github.com/kitesi/local-files-viewer.git
cd local-files-viewer
npm install
npm run build
npm install -g
```

## Usage

Once you have ths package installed you can just call `lfv [folder]`.
If no folder is provided, it will default to your env variable of `LFV_DEFAULT_FOLDER`.

## Keybindings

`h` => go to previous file

`l` => go to next file

`ctrl+p` => toggle file finder

`ctrl+o` => toggle directory (allows you to change the base directory)

palette mode:

(file mode) `ctrl+j`, `tab` => next item

(file mode) `ctrl+k`, `shift+tab` => previous item

(directory mode) `tab`=> completion

(directory mode) `shift+tab` => nothing

`ctrl+m`, `enter` => select item

`ctrl+[`, `Escape` => close palette

## Technologies / Attribution

- SvelteKit, typescript, scss, etc..
- remark: used to render markdown
- shiki: used for syntax highlighting, mdsvex includes prismjs
  by default, but I don't like how they handle line highlights
- Took some inspiration from vscode ui
- Icons
  - [feather](https://feathericons.com/), only used `hash`, `file`, and `folder`, `arrow-[right|down]`, and
    `chevron-[right|down]`
  - [simple-icons](https://simpleicons.org/), used for language file icons

## Future

- Look into optimizations of reading and showing content
- Handle large directories more gracefully. Originally the idea was to load x amount deep, then when the user
  requests load more, but with the file picker I switched it back to loading
  recursively as much as needed.
- Error handling
  - Remove the need for two states of errors.
  - You should be able to change the base directory on the error page.
