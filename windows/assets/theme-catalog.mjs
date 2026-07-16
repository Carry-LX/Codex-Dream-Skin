export const BUILT_IN_THEMES = [
  {
    id: "aurora", label: "Aurora Deep Sea", description: "Cyan aurora over midnight blue", family: "Dark · Atmosphere", scheme: "dark",
    swatch: "linear-gradient(145deg,#07152b,#0e6d77 48%,#c66cff)",
    background: "radial-gradient(circle at 18% -10%,rgba(63,242,199,.28),transparent 32%),radial-gradient(circle at 92% 12%,rgba(180,87,255,.27),transparent 29%),linear-gradient(145deg,#071225,#0b1c36 52%,#101331)",
    sidebar: "linear-gradient(180deg,rgba(8,29,52,.98),rgba(9,20,41,.97))", main: "linear-gradient(145deg,rgba(10,31,57,.98),rgba(13,22,50,.98))", surface: "rgba(17,47,74,.90)", text: "#e7f7ff", muted: "#91b6c7", border: "rgba(93,220,205,.28)", accent: "#55dfc5", accentStrong: "#a771f1", glow: "rgba(58,228,202,.22)",
  },
  {
    id: "ink-paper", label: "Ink Paper Study", description: "Warm paper, ink green, muted brass", family: "Light · Focus", scheme: "light",
    swatch: "linear-gradient(145deg,#faf5e9,#d6e4ce 54%,#2f5b49)",
    background: "radial-gradient(circle at 88% 0%,rgba(212,230,202,.70),transparent 28%),linear-gradient(145deg,#fbf8ef,#f1f3e8 54%,#e7eee1)",
    sidebar: "linear-gradient(180deg,rgba(250,248,239,.98),rgba(232,240,225,.97))", main: "linear-gradient(145deg,rgba(255,253,247,.98),rgba(243,247,237,.98))", surface: "rgba(255,254,249,.93)", text: "#273c34", muted: "#708277", border: "rgba(70,108,83,.25)", accent: "#3f755d", accentStrong: "#aa7e44", glow: "rgba(93,130,92,.13)",
  },
  {
    id: "terminal", label: "Terminal Green", description: "Obsidian base with phosphor-green focus", family: "Dark · Hacker", scheme: "dark",
    swatch: "linear-gradient(145deg,#07100d,#183b27 55%,#b3ff70)",
    background: "radial-gradient(circle at 88% 8%,rgba(121,255,127,.15),transparent 24%),linear-gradient(145deg,#050906,#0b1710 55%,#07150d)",
    sidebar: "linear-gradient(180deg,rgba(5,13,8,.99),rgba(8,22,13,.98))", main: "linear-gradient(145deg,rgba(9,22,13,.99),rgba(7,17,10,.99))", surface: "rgba(12,34,19,.92)", text: "#e4ffdb", muted: "#93b99a", border: "rgba(137,255,141,.25)", accent: "#a8ff66", accentStrong: "#48d597", glow: "rgba(111,255,104,.18)",
  },
  {
    id: "sunset", label: "Sunset Film", description: "Cream, coral and amber for creative work", family: "Light · Creative", scheme: "light",
    swatch: "linear-gradient(145deg,#fff1dd,#f7a177 52%,#8c3654)",
    background: "radial-gradient(circle at 84% 3%,rgba(255,190,117,.55),transparent 27%),radial-gradient(circle at 15% 15%,rgba(247,150,150,.28),transparent 27%),linear-gradient(145deg,#fff9f1,#fff0e4 50%,#f8e2de)",
    sidebar: "linear-gradient(180deg,rgba(255,249,242,.98),rgba(255,231,217,.97))", main: "linear-gradient(145deg,rgba(255,252,247,.99),rgba(255,239,231,.98))", surface: "rgba(255,253,248,.94)", text: "#593646", muted: "#946d70", border: "rgba(193,100,97,.28)", accent: "#c55b55", accentStrong: "#e79a45", glow: "rgba(234,133,83,.18)",
  },
  {
    id: "violet-grid", label: "Violet Grid", description: "Electric blue over a subtle cyber grid", family: "Dark · Cyber", scheme: "dark",
    swatch: "linear-gradient(145deg,#161126,#4c2f99 52%,#56d7ff)",
    background: "linear-gradient(rgba(125,91,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(125,91,255,.07) 1px,transparent 1px),radial-gradient(circle at 88% 0%,rgba(74,212,255,.25),transparent 28%),linear-gradient(145deg,#130f25,#21143c 55%,#16182d)",
    sidebar: "linear-gradient(180deg,rgba(22,15,44,.99),rgba(17,17,38,.98))", main: "linear-gradient(145deg,rgba(31,19,61,.99),rgba(19,21,48,.99))", surface: "rgba(44,31,79,.88)", text: "#f0edff", muted: "#afa6d8", border: "rgba(139,113,255,.32)", accent: "#a886ff", accentStrong: "#4fd6ff", glow: "rgba(111,84,255,.25)",
  },
  {
    id: "monochrome", label: "Monochrome Studio", description: "Quiet graphite with a single cobalt accent", family: "Dark / Minimal", scheme: "dark",
    swatch: "linear-gradient(145deg,#0d0e10,#4e5258 55%,#7ca7ff)",
    background: "linear-gradient(135deg,rgba(255,255,255,.025) 25%,transparent 25%) 0 0/12px 12px,linear-gradient(145deg,#101114,#1b1d22 52%,#111216)",
    sidebar: "linear-gradient(180deg,rgba(15,16,19,.99),rgba(27,29,34,.98))", main: "linear-gradient(145deg,rgba(29,31,36,.99),rgba(18,19,23,.99))", surface: "rgba(42,44,50,.94)", text: "#f2f3f5", muted: "#b1b4ba", border: "rgba(203,207,216,.20)", accent: "#83a8ff", accentStrong: "#c2d1ff", glow: "rgba(110,151,255,.16)",
  },
  {
    id: "forest-mist", label: "Forest Mist", description: "Moss, fern and rain-softened slate", family: "Dark / Nature", scheme: "dark",
    swatch: "linear-gradient(145deg,#0b211b,#2d7659 54%,#b7d88a)",
    background: "radial-gradient(circle at 90% 0%,rgba(185,224,147,.20),transparent 29%),radial-gradient(circle at 5% 80%,rgba(47,132,102,.22),transparent 35%),linear-gradient(145deg,#0a211b,#14382d 55%,#10251f)",
    sidebar: "linear-gradient(180deg,rgba(9,30,24,.99),rgba(13,48,37,.98))", main: "linear-gradient(145deg,rgba(19,55,43,.98),rgba(12,34,28,.99))", surface: "rgba(29,70,54,.91)", text: "#edf7df", muted: "#b8cba7", border: "rgba(152,205,127,.24)", accent: "#a8d879", accentStrong: "#5eb48d", glow: "rgba(109,184,132,.18)",
  },
  {
    id: "rose-garden", label: "Rose Garden", description: "Soft blush, berry ink and floral calm", family: "Light / Romantic", scheme: "light",
    swatch: "linear-gradient(145deg,#fff7f7,#edb2c4 53%,#8d4866)",
    background: "radial-gradient(circle at 88% 4%,rgba(255,181,204,.55),transparent 30%),radial-gradient(circle at 15% 80%,rgba(220,152,177,.20),transparent 32%),linear-gradient(145deg,#fff9fb,#fff1f5 54%,#f6e2eb)",
    sidebar: "linear-gradient(180deg,rgba(255,250,252,.99),rgba(250,229,238,.98))", main: "linear-gradient(145deg,rgba(255,253,254,.99),rgba(255,239,246,.98))", surface: "rgba(255,253,254,.95)", text: "#593848", muted: "#936d7c", border: "rgba(176,92,124,.25)", accent: "#b8567d", accentStrong: "#d98e66", glow: "rgba(211,105,151,.17)",
  },
  {
    id: "ocean-glass", label: "Ocean Glass", description: "Seafoam surfaces with clear blue depth", family: "Light / Fresh", scheme: "light",
    swatch: "linear-gradient(145deg,#eaffff,#81d5d1 52%,#327aa5)",
    background: "radial-gradient(circle at 84% 0%,rgba(116,224,231,.52),transparent 28%),linear-gradient(120deg,rgba(86,197,212,.10) 1px,transparent 1px) 0 0/24px 24px,linear-gradient(145deg,#f6ffff,#e4f7f5 54%,#d9edf3)",
    sidebar: "linear-gradient(180deg,rgba(246,255,255,.99),rgba(220,244,242,.98))", main: "linear-gradient(145deg,rgba(252,255,255,.99),rgba(232,248,247,.98))", surface: "rgba(252,255,255,.94)", text: "#21485b", muted: "#668895", border: "rgba(54,145,159,.25)", accent: "#23899a", accentStrong: "#397fb9", glow: "rgba(51,181,190,.16)",
  },
  {
    id: "retro-wave", label: "Retro Wave", description: "Neon horizon with magenta cassette warmth", family: "Dark / Retro", scheme: "dark",
    swatch: "linear-gradient(145deg,#160b2e,#a82d90 53%,#ffbe61)",
    background: "linear-gradient(rgba(244,68,192,.09) 1px,transparent 1px) 0 0/100% 31px,radial-gradient(circle at 84% 0%,rgba(255,176,89,.28),transparent 25%),linear-gradient(145deg,#150a31,#35115a 56%,#1a113b)",
    sidebar: "linear-gradient(180deg,rgba(22,9,48,.99),rgba(42,13,65,.98))", main: "linear-gradient(145deg,rgba(49,14,77,.98),rgba(24,16,55,.99))", surface: "rgba(68,24,91,.90)", text: "#fff0fb", muted: "#d7a8ce", border: "rgba(255,117,205,.29)", accent: "#f37cc9", accentStrong: "#ffc365", glow: "rgba(244,86,193,.22)",
  },
  {
    id: "coffeehouse", label: "Coffeehouse", description: "Roasted walnut, parchment and brass", family: "Light / Warm", scheme: "light",
    swatch: "linear-gradient(145deg,#fff7ea,#bd875c 52%,#5d3828)",
    background: "radial-gradient(circle at 90% 2%,rgba(232,183,124,.45),transparent 28%),repeating-linear-gradient(0deg,rgba(102,66,39,.035) 0 1px,transparent 1px 6px),linear-gradient(145deg,#fff9ef,#f6e8d5 55%,#ecd8bd)",
    sidebar: "linear-gradient(180deg,rgba(255,249,239,.99),rgba(244,226,204,.98))", main: "linear-gradient(145deg,rgba(255,252,246,.99),rgba(247,234,216,.98))", surface: "rgba(255,252,247,.95)", text: "#563b2d", muted: "#8d705d", border: "rgba(142,94,62,.26)", accent: "#8d5538", accentStrong: "#c7914e", glow: "rgba(177,112,72,.17)",
  },
  {
    id: "solarized-desk", label: "Solarized Desk", description: "Low-glare blue paper for long research sessions", family: "Light / Research", scheme: "light",
    swatch: "linear-gradient(145deg,#f7f5e9,#b9d9d4 50%,#2f6f82)",
    background: "radial-gradient(circle at 89% 5%,rgba(137,207,199,.42),transparent 29%),linear-gradient(145deg,#fbf9ef,#edf2e8 55%,#dcebe6)",
    sidebar: "linear-gradient(180deg,rgba(251,249,239,.99),rgba(225,239,231,.98))", main: "linear-gradient(145deg,rgba(253,252,246,.99),rgba(235,245,239,.98))", surface: "rgba(253,253,248,.95)", text: "#294753", muted: "#6e8790", border: "rgba(57,115,125,.24)", accent: "#277386", accentStrong: "#579c7b", glow: "rgba(66,149,148,.15)",
  },
];

export function buildGenericThemeCss(theme) {
  return `
    :root.codex-library-generic-theme {
      color-scheme: ${theme.scheme} !important;
      --catalog-bg: ${theme.background}; --catalog-sidebar: ${theme.sidebar}; --catalog-main: ${theme.main}; --catalog-surface: ${theme.surface};
      --catalog-text: ${theme.text}; --catalog-muted: ${theme.muted}; --catalog-border: ${theme.border}; --catalog-accent: ${theme.accent}; --catalog-accent-strong: ${theme.accentStrong}; --catalog-glow: ${theme.glow};
    }
    html.codex-library-generic-theme body { background: var(--catalog-bg) !important; color: var(--catalog-text) !important; }
    html.codex-library-generic-theme body::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none; opacity:.42; background-image:radial-gradient(circle,var(--catalog-glow) 0 1px,transparent 1.5px); background-size:34px 34px; }
    html.codex-library-generic-theme aside.app-shell-left-panel { background:var(--catalog-sidebar) !important; border-color:var(--catalog-border) !important; box-shadow:9px 0 28px var(--catalog-glow) !important; color:var(--catalog-text) !important; }
    html.codex-library-generic-theme aside.app-shell-left-panel * { color:var(--catalog-text) !important; opacity:1 !important; }
    html.codex-library-generic-theme main.main-surface { background:var(--catalog-main) !important; border-color:var(--catalog-border) !important; box-shadow:inset 0 1px color-mix(in srgb,var(--catalog-text) 10%,transparent),-8px 0 28px var(--catalog-glow) !important; color:var(--catalog-text) !important; }
    html.codex-library-generic-theme main.main-surface > header.app-header-tint,
    html.codex-library-generic-theme .composer-surface-chrome,
    html.codex-library-generic-theme [class~="bg-token-popover"],
    html.codex-library-generic-theme [class~="bg-token-dropdown-background"],
    html.codex-library-generic-theme [class~="bg-token-main-surface-primary"],
    html.codex-library-generic-theme [class~="bg-token-main-surface-secondary"],
    html.codex-library-generic-theme [role="dialog"] { background:var(--catalog-surface) !important; border-color:var(--catalog-border) !important; color:var(--catalog-text) !important; box-shadow:0 10px 30px var(--catalog-glow) !important; }
    html.codex-library-generic-theme [class~="bg-token-main-surface-primary"] *,
    html.codex-library-generic-theme [class~="bg-token-main-surface-secondary"] * { color:var(--catalog-text) !important; }
    html.codex-library-generic-theme button,
    html.codex-library-generic-theme input,
    html.codex-library-generic-theme textarea,
    html.codex-library-generic-theme .ProseMirror { color:var(--catalog-text) !important; caret-color:var(--catalog-accent) !important; }
    html.codex-library-generic-theme main.main-surface,
    html.codex-library-generic-theme main.main-surface * { color:var(--catalog-text) !important; }
    html.codex-library-generic-theme main.main-surface [role="main"] a { color:var(--catalog-accent) !important; }
    html.codex-library-generic-theme [class~="text-token-text-secondary"],
    html.codex-library-generic-theme [class~="text-token-text-tertiary"] { color:var(--catalog-muted) !important; opacity:1 !important; }
    html.codex-library-generic-theme main.main-surface [class*="opacity-"] { opacity:1 !important; }
    html.codex-library-generic-theme aside.app-shell-left-panel button:hover,
    html.codex-library-generic-theme aside.app-shell-left-panel [aria-current="page"] { background:color-mix(in srgb,var(--catalog-accent) 17%,transparent) !important; box-shadow:inset 0 0 0 1px var(--catalog-border) !important; }
    html.codex-library-generic-theme button[class~="bg-token-foreground"] { background:linear-gradient(135deg,var(--catalog-accent),var(--catalog-accent-strong)) !important; color:white !important; box-shadow:0 6px 16px var(--catalog-glow) !important; }
    html.codex-library-generic-theme pre,
    html.codex-library-generic-theme code { background:color-mix(in srgb,var(--catalog-surface) 82%,black) !important; border-color:var(--catalog-border) !important; color:var(--catalog-text) !important; }
  `;
}

export function buildImageThemeCss(theme, imageDataUrl, secondaryDataUrl = null) {
  const primaryPosition = { portrait: "72% center", wide: "62% center", sticker: "70% center" }[theme.imageMode] ?? "68% center";
  const primarySize = { portrait: "auto 94%", wide: "cover", sticker: "auto 78%" }[theme.imageMode] ?? "cover";
  const secondaryImage = secondaryDataUrl ?? imageDataUrl;
  const sidebarArtBlend = theme.scheme === "dark" ? "screen" : "multiply";
  return `${buildGenericThemeCss(theme)}
    html.codex-library-generic-theme main.main-surface {
      background-image: linear-gradient(90deg, var(--catalog-surface) 0%, color-mix(in srgb, var(--catalog-surface) 94%, transparent) 38%, color-mix(in srgb, var(--catalog-surface) 48%, transparent) 69%, color-mix(in srgb, var(--catalog-surface) 14%, transparent) 100%), url("${imageDataUrl}") !important;
      background-size: cover, ${primarySize} !important;
      background-position: center, ${primaryPosition} !important;
      background-repeat: no-repeat !important;
    }
    html.codex-library-generic-theme aside.app-shell-left-panel {
      isolation: isolate;
      background-image: linear-gradient(180deg, var(--catalog-surface) 0%, color-mix(in srgb, var(--catalog-surface) 76%, transparent) 56%, color-mix(in srgb, var(--catalog-surface) 36%, transparent) 100%), url("${secondaryImage}") !important;
      background-size: cover, 100% auto !important;
      background-position: center, center bottom !important;
      background-repeat: no-repeat !important;
    }
    html.codex-library-generic-theme aside.app-shell-left-panel::after {
      content: "";
      position: absolute;
      z-index: 1;
      right: 0;
      bottom: 0;
      left: 0;
      height: min(38vh, 360px);
      pointer-events: none;
      opacity: .34;
      background-image: url("${secondaryImage}");
      background-repeat: no-repeat;
      background-position: center bottom;
      background-size: 100% auto;
      mix-blend-mode: ${sidebarArtBlend};
      mask-image: linear-gradient(180deg, transparent 0%, black 32%, black 100%);
    }
  `;
}
