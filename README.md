# pi-thinking-hotkeys

Codex-style directional thinking controls for [Pi](https://github.com/badlogic/pi-mono).

Adds the missing muscle-memory shortcuts for changing Pi's active reasoning level.

| Shortcut | Action |
|---|---|
| `Alt+,` | Decrease thinking effort |
| `Alt+.` | Increase thinking effort |

## Installation

From git:

```bash
pi install git:github.com/masonc15/pi-thinking-hotkeys
```

From a local checkout:

```bash
pi install /Users/colin/workspace/pi-thinking-hotkeys
```

To try it for one Pi run without installing:

```bash
pi -e /Users/colin/workspace/pi-thinking-hotkeys
```

If you previously copied the extension manually to `~/.pi/agent/extensions/pi-thinking-hotkeys`, remove that copy before installing as a package to avoid duplicate shortcut registrations.

## Usage

Start Pi and press the shortcuts while the editor is focused.

- `Alt+.` moves upward: `off → minimal → low → medium → high → xhigh`
- `Alt+,` moves downward: `xhigh → high → medium → low → minimal → off`
- Unsupported model levels are skipped.
- At the minimum or maximum, the shortcut is a no-op and Pi shows a short notification.
- Non-reasoning models stay at `off`.

Use `/help` in Pi to confirm the shortcuts are loaded under Extensions.

## How it works

The extension uses public Pi APIs only:

- `pi.registerShortcut()` registers `Alt+,` and `Alt+.`.
- `pi.getThinkingLevel()` reads the current level.
- `pi.setThinkingLevel()` requests the next level.

Pi clamps requested thinking levels to the active model's capabilities. After setting a level, the extension reads the effective level back and reports if Pi clamped it.

Pi's built-in model display continues to show the active reasoning level.

## Terminal support

`Alt+,` and `Alt+.` work when your terminal sends Kitty keyboard protocol or xterm `modifyOtherKeys` sequences. Pi enables those protocols on startup when the terminal supports them.

Some terminals or tmux setups send raw legacy sequences instead:

```text
ESC ,
ESC .
```

Current Pi TUI does not parse those as `alt+,` or `alt+.`. That limitation is in Pi's key parser, not this extension.

Check what Pi's key parser supports locally:

```bash
npm run check:keys
```

For a real terminal check, run:

```bash
cat -v
```

Then press `Alt+,` and `Alt+.`. If you see `^[,` or `^[.`, your terminal is sending legacy ESC-symbol input.

## Development

```bash
npm install
npm run check
npm run check:keys
pi --no-extensions -e .
```

The package is installable by Pi because `package.json` includes:

```json
{
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./index.ts"]
  }
}
```

## License

MIT
