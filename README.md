# pi-thinking-hotkeys

Codex-style directional hotkeys for changing [pi](https://github.com/badlogic/pi-mono)'s active reasoning level.

| Shortcut | Action |
|---|---|
| `Alt+,` | Decrease thinking effort |
| `Alt+.` | Increase thinking effort |

On macOS, `Alt` is the `Option` (⌥) key.

## Install

```bash
pi install git:github.com/masonc15/pi-thinking-hotkeys
```

Verify with `/help` — the shortcuts appear under Extensions.

## Usage

Press the shortcut while the editor is focused. Levels move along:

```
off → minimal → low → medium → high → xhigh
```

- Levels the active model doesn't support are skipped.
- At a bound, the shortcut is a no-op and pi shows a notification.
- Non-reasoning models stay at `off`.

Pi's model display continues to show the current level.

## Terminal support

The shortcuts need Kitty keyboard protocol or xterm `modifyOtherKeys`, both of which pi enables when the terminal supports them. Some terminals and tmux setups instead send the legacy `ESC ,` / `ESC .` sequences, which pi's key parser does not currently decode as `alt+,` / `alt+.`. To check what your setup sends:

```bash
npm run check:keys
```

## Development

```bash
npm install
npm run check        # typecheck + tests
pi --no-extensions -e .
```

## License

MIT
