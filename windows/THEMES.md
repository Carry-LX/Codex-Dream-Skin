# Codex Theme Library

The Windows theme library is intentionally manual: Codex starts normally, then the user opens the library and applies one theme to the current window. Closing Codex clears every injected theme.

## Open the library

The already-running Codex process must expose a loopback CDP port. After starting it with `--remote-debugging-address=127.0.0.1 --remote-debugging-port=9335`, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File windows/scripts/open-theme-library.ps1
```

The script validates that the endpoint belongs to the currently registered Store package before it injects the library control. It does not apply any theme itself.

Click the `主题库` chip to open or close the panel. Drag the chip to move it; its local position is remembered and the panel automatically opens toward the visible part of the screen.

## Built-in public samples

The public catalog currently contains twelve CSS-only samples. They are deliberately split across very different visual directions so users can evaluate layout density, contrast, and visual tone before creating an image theme.

| Direction | Public samples |
|---|---|
| Dark focus | Aurora Deep Sea, Terminal Green, Monochrome Studio |
| Dark atmosphere | Violet Grid, Forest Mist, Retro Wave |
| Light calm | Ink Paper Study, Ocean Glass, Solarized Desk |
| Light expressive | Sunset Film, Rose Garden, Coffeehouse |

| Theme | Direction | Best for |
|---|---|---|
| 极光深海 | midnight blue, cyan and violet glow | late-night focus and long coding sessions |
| 墨纸书房 | warm paper, ink green, muted brass | reading, writing and research |
| 终端绿幕 | obsidian, phosphor green | terminal-heavy development |
| 落日胶片 | cream, coral and amber | design, brainstorming and creative tasks |
| 紫电网格 | violet, electric blue, subtle grid | cyber/futurist workspaces |

All twelve samples are CSS-only. They are safe to redistribute and demonstrate the expected palette, contrast, surface and accent fields for a theme.

## Personal image themes

Image themes are local-only by default. Do not commit character art, photographs, logos, or other media unless you own the redistribution rights.

For a good working UI, use a two-image composition when matching artwork is available: the primary image becomes the real central-workspace background, while the second image decorates the lower sidebar. The text column, composer, dialogs, and output cards retain themed surfaces for contrast.

| Source image shape | Recommended role | Keep readable by |
|---|---|---|
| Vertical portrait / close-up | centered in the right half of the work surface | reserving a solid reading gradient on the left |
| Wide character key art | central workspace background | placing the subject toward the middle, not flush on the right edge |
| Busy collage | horizontal lower-sidebar layer | sizing to the sidebar width (`100% auto`) instead of vertical stretching |
| Cartoon illustration | full central background plus matching sidebar image | using neutral cards and a low-opacity sidebar layer for menu readability |

The repository ignores `windows/assets/personal/` and `windows/assets/lisiya-*.png`. This keeps locally installed personal themes out of Git by default. When these three legacy image files exist locally, the library offers the `李诗雅 · 晴空` card; a clean clone simply omits it.

## Local image-theme catalog

The repository also ignores every real asset under `assets/local-examples/`, while keeping [`themes.example.json`](./assets/local-examples/themes.example.json) as a safe, redistributable template. Copy that file to `themes.json`, add the image named by `image`, then open the library again.

The current local examples use three visual roles:

| Visual role | Theme examples | Layout behavior |
|---|---|---|
| Portrait | 黑瞳蓝眸 | a centered right-half work-surface background with a protected reading area on the left |
| Key art / collage | 赤金舞台 | a dual-image composition: central key art plus a horizontal sidebar collage |
| Cartoon pair | 猫鼠放映室, 阳光小龙, 鸿运小猪 | primary art in the work surface and the matching second image in the lower sidebar |

Only `id`, `image`, `imageMode`, `scheme`, and the palette need to be changed for a new local card. `secondaryImage` is optional, but recommended when a matching second image is available: `image` becomes the actual central-workspace background, while `secondaryImage` becomes the sidebar background. `imageMode` must be `portrait`, `wide`, or `sticker`. Keep image filenames ASCII and use `.png`, `.jpg`, `.jpeg`, or `.webp`; the loader rejects anything else before it reads a local file.

The library sends image bytes only to the already-running local Codex renderer through its loopback debugging port. It does not upload the image, and the image node is removed when another theme or Official appearance is selected.

## Add a public CSS sample

Edit [`assets/theme-catalog.mjs`](./assets/theme-catalog.mjs). Every entry needs a stable ASCII `id`, Chinese/English display text as appropriate, `light` or `dark` scheme, and a complete palette. `buildGenericThemeCss` scopes all rules under `html.codex-library-generic-theme`; preserve that scope so a theme can be removed without touching the official app.

Before opening a pull request, run:

```powershell
node windows/tests/theme-catalog.test.mjs
node windows/tests/renderer-inject.test.mjs
node --check windows/scripts/injector.mjs
```

Then use the manual library to test the theme on a real Codex home screen and an active task. Check text contrast, the composer, side navigation, dialogs, code blocks, narrow windows, and removal back to Official appearance.
