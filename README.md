# Local Files Viewer

A simple program to view files in your browser including text files, markdown,
HTML, PDFs, images, videos, audio, and fonts. You can use it as a self-hosted
knowledge base where the knowledge is stored in files.

Does not currently handle creating, renaming, or deleting files. Check out
[filebrowser](https://filebrowser.org/installation), which might better suit
your needs.

## Previews

Markdown:

![markdown](assets/markdown.png)

For more previews, visit [previews.md](previews.md)

### Security Note

This program uses the web browser's provided API for images, videos, audios, fonts, and
iframes to display HTML & PDF content. It uses node's `fs.readFile` to read the
file contents.

Do not open up any folders that include files you do not trust.

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

This program works off of two environment variables: `LFV_DEFAULT_FOLDER` and `LFV_ROOT_FOLDER`.

- `LFV_DEFAULT_FOLDER`: The folder that is being opened to examine
- `LFV_ROOT_FOLDER`: The root directory that the program is allowed to traverse. For example if `LFV_ROOT_FOLDER=/home/user` then the user is allowed to traverse through `/home/user/`, `/home/user/code`, and `/home/user/Downloads` but not `/home`. If this environment variable is unset, it will default to `LFV_DEFAULT_FOLDER`.

This program provides a script (in `./bin/lfv.js`) to run the program and set
the `LFV_DEFAULT_FOLDER` variable temporarily.

If you installed this package globally hopefully `lfv` is available to you. If you installed it locally you will have to do `npm link`.

To use the script you can just call `lfv [folder]`. If no folder is provided, it will default to your env variable of `LFV_DEFAULT_FOLDER`.

## Keybindings

`h` => go to previous file

`l` => go to next file

`ctrl+p` => toggle file finder

`ctrl+o` => toggle directory picker (allows you to change the base directory)

`ctrl+y` => directory search (with ripgrep or grep)

palette mode:

(file mode) `ctrl+j`, `tab` => next item

(file mode) `ctrl+k`, `shift+tab` => previous item

(directory mode) `tab`=> completion

(directory mode) `shift+tab` => nothing

`ctrl+m`, `enter` => select item

`ctrl+[`, `Escape` => close palette

## Live View & Neovim Integration

This program automatically reloads the content when the current file is changed. If you would like to sync up the cursor position of neovim to the program then you can use the following configuration:

```lua
local uv = vim.loop

function OpenLfv()
	local current_dir = vim.fn.getcwd()
	local buffer_file = vim.fn.expand("%:p")
	local buffer_dir = vim.fn.fnamemodify(buffer_file, ":h")
	local target_dir = vim.fn.isdirectory(current_dir) == 1 and current_dir or buffer_dir

	if vim.fn.isdirectory(target_dir) == 1 then
		vim.cmd("tabnew | terminal lfv " .. vim.fn.shellescape(target_dir))

		local relative_path = vim.fn.fnamemodify(buffer_file, ":~:.")
		if relative_path:sub(1, #target_dir) == target_dir then
			relative_path = relative_path:sub(#target_dir + 2)
		end

		-- Launch browser after delay
		vim.fn.jobstart("sleep 2", {
			on_exit = function()
				local url = "http://localhost:4173/preview/" .. relative_path
				vim.fn.jobstart({ "xdg-open", url }, { detach = true })
			end,
		})

		-- Create autocmd to track cursor movements
		local debounce_timer = nil
		local group = vim.api.nvim_create_augroup("LfvLineSync", { clear = true })

		vim.api.nvim_create_autocmd({ "CursorMoved", "CursorMovedI" }, {
			group = group,
			callback = function()
				if debounce_timer then
					debounce_timer:stop()
					debounce_timer:close()
				end

				debounce_timer = vim.loop.new_timer()
				debounce_timer:start(
					150,
					0,
					vim.schedule_wrap(function()
						local line = vim.fn.line(".")
						local payload = string.format('{"file": "%s", "line": %d}', relative_path, line)

						vim.fn.jobstart({
							"curl",
							"-X",
							"POST",
							"-H",
							"Content-Type: application/json",
							"-d",
							payload,
							"http://localhost:4173/api/cursor-watcher",
						}, { detach = true })
					end)
				)
			end,
		})
	else
		print("No valid directory found.")
	end
end
vim.cmd("command! Lfv lua OpenLfv()")
```
