import assert from "node:assert/strict";
import { buildImageThemeCss } from "../assets/theme-catalog.mjs";

const theme = {
  id: "layout-test", label: "Layout Test", description: "Test fixture", family: "Test", scheme: "dark", swatch: "#000",
  background: "#101010", sidebar: "#151515", main: "#202020", surface: "rgba(32,32,32,.94)", text: "#ffffff", muted: "#bbbbbb",
  border: "#555555", accent: "#99ccff", accentStrong: "#6688ff", glow: "rgba(80,140,255,.2)", imageMode: "portrait",
};

const css = buildImageThemeCss(theme, "data:image/png;base64,primary", "data:image/png;base64,secondary");
assert.match(css, /main\.main-surface/, "Image themes must use the central work surface as the primary background.");
assert.match(css, /url\("data:image\/png;base64,primary"\)/, "Primary artwork must be used in the work surface.");
assert.match(css, /72% center/, "Portrait art should extend toward the center, not sit flush on the right edge.");
assert.match(css, /aside\.app-shell-left-panel::after/, "A second image needs a dedicated sidebar background layer.");
assert.match(css, /url\("data:image\/png;base64,secondary"\)/, "Secondary artwork must be used by the sidebar.");
assert.match(css, /background-size: 100% auto/, "Sidebar art must adapt horizontally without vertical stretching.");
assert.doesNotMatch(css, /codex-library-image-art/, "Image themes must not fall back to a foreground sticker layer.");

console.log("PASS: validated central and horizontal-sidebar image-theme layout.");
