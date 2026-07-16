import assert from "node:assert/strict";
import { BUILT_IN_THEMES, buildGenericThemeCss } from "../assets/theme-catalog.mjs";

assert.ok(BUILT_IN_THEMES.length >= 12, "The public catalog needs at least twelve varied sample themes.");
assert.equal(new Set(BUILT_IN_THEMES.map((theme) => theme.id)).size, BUILT_IN_THEMES.length,
  "Theme IDs must be unique.");

for (const theme of BUILT_IN_THEMES) {
  for (const key of ["id", "label", "description", "family", "scheme", "swatch", "background", "sidebar", "main", "surface", "text", "muted", "border", "accent", "accentStrong", "glow"]) {
    assert.ok(typeof theme[key] === "string" && theme[key].trim(), `Missing ${key} in ${theme.id}`);
  }
  assert.ok(["light", "dark"].includes(theme.scheme), `Invalid color scheme in ${theme.id}`);
  const css = buildGenericThemeCss(theme);
  assert.match(css, /html\.codex-library-generic-theme body/, `${theme.id} must scope its body styles.`);
  assert.match(css, /main\.main-surface/, `${theme.id} must theme the primary work surface.`);
  assert.match(css, /composer-surface-chrome/, `${theme.id} must theme the composer.`);
}

assert.ok(new Set(BUILT_IN_THEMES.map((theme) => theme.family)).size >= 8,
  "The public catalog should cover multiple visual directions, not palette variants of one style.");

console.log(`PASS: validated ${BUILT_IN_THEMES.length} scoped public sample themes.`);
