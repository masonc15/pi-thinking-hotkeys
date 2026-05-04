# Pi Thinking Hotkeys

Adds Codex CLI-style directional thinking/reasoning shortcuts to Pi:

- `Alt+,` decreases thinking effort
- `Alt+.` increases thinking effort

The extension uses public Pi extension APIs only. It registers shortcuts with `pi.registerShortcut()`, reads the current level with `pi.getThinkingLevel()`, sets a requested level with `pi.setThinkingLevel()`, and reads the effective level back because Pi clamps requested levels to the active model's capabilities.

## Develop

```bash
cd /Users/colin/workspace/pi-thinking-hotkeys
npm install
npm run check
pi -e ./index.ts
```

Inside Pi, run `/help` and confirm the extension shortcuts appear under Extensions.

## Install globally

```bash
mkdir -p ~/.pi/agent/extensions/pi-thinking-hotkeys
cp /Users/colin/workspace/pi-thinking-hotkeys/index.ts ~/.pi/agent/extensions/pi-thinking-hotkeys/index.ts
cp /Users/colin/workspace/pi-thinking-hotkeys/thinking-levels.ts ~/.pi/agent/extensions/pi-thinking-hotkeys/thinking-levels.ts
```

Then start Pi normally.

## Terminal caveat

`Alt+,` and `Alt+.` work when the terminal sends Kitty keyboard protocol or xterm `modifyOtherKeys` sequences. Some legacy terminals send raw `ESC ,` or `ESC .`; current Pi TUI does not parse those as `alt+,` or `alt+.`. Run this diagnostic:

```bash
npm run check:keys
```

If the diagnostic shows legacy `ESC` symbol sequences failing, the fix belongs in `@mariozechner/pi-tui`, not in this extension.

## Manual terminal check

Run this outside Pi:

```bash
cat -v
```

Press `Alt+,` and `Alt+.`.

If you see `^[,` or `^[.`, your terminal is sending raw legacy ESC-symbol sequences. Current Pi TUI does not parse those as `alt+,` or `alt+.`.

If you see sequences like `^[[27;3;44~`, `^[[27;3;46~`, `^[[44;3u`, or `^[[46;3u`, Pi should parse the shortcuts.

## Installed copy

The validated source files can be copied to:

```text
~/.pi/agent/extensions/pi-thinking-hotkeys/
```

Pi auto-discovers the extension from that directory. After updating the source repo, copy `index.ts` and `thinking-levels.ts` again.
