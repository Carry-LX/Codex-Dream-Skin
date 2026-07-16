import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILT_IN_THEMES, buildGenericThemeCss, buildImageThemeCss } from "../assets/theme-catalog.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const SKIN_VERSION = "1.0.0";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const BROWSER_ID_PATTERN = /^[A-Za-z0-9._-]{1,200}$/;

class CdpIdentityMismatchError extends Error {}

function parseArgs(argv) {
  const options = {
    port: 9335,
    mode: "watch",
    timeoutMs: 30000,
    screenshot: null,
    reload: false,
    browserId: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--port") options.port = Number(argv[++i]);
    else if (arg === "--once") options.mode = "once";
    else if (arg === "--watch") options.mode = "watch";
    else if (arg === "--verify") options.mode = "verify";
    else if (arg === "--remove") options.mode = "remove";
    else if (arg === "--library") options.mode = "library";
    else if (arg === "--timeout-ms") options.timeoutMs = Number(argv[++i]);
    else if (arg === "--browser-id") options.browserId = argv[++i];
    else if (arg === "--screenshot") options.screenshot = path.resolve(argv[++i]);
    else if (arg === "--reload") options.reload = true;
    else if (arg === "--self-test") options.mode = "self-test";
    else if (arg === "--check-payload") options.mode = "check-payload";
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) {
    throw new Error(`Invalid port: ${options.port}`);
  }
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 250 || options.timeoutMs > 120000) {
    throw new Error(`Invalid timeout: ${options.timeoutMs}`);
  }
  if (options.browserId !== null && !BROWSER_ID_PATTERN.test(options.browserId)) {
    throw new Error(`Invalid browser ID: ${options.browserId}`);
  }
  if (["watch", "once", "verify", "remove", "library"].includes(options.mode) && !options.browserId) {
    throw new Error(`--browser-id is required in ${options.mode} mode`);
  }
  return options;
}

function validatedDebuggerUrl(target, port) {
  const url = new URL(target.webSocketDebuggerUrl);
  const pathIsValid = /^\/devtools\/(?:page|browser)\/[A-Za-z0-9._-]{1,200}$/.test(url.pathname);
  if (url.protocol !== "ws:" || !LOOPBACK_HOSTS.has(url.hostname) || Number(url.port) !== port ||
      url.username || url.password || url.search || url.hash || !pathIsValid) {
    throw new Error("Rejected a CDP WebSocket URL outside the allowed loopback endpoint shape");
  }
  return url.href;
}

function browserIdFromVersion(version, port) {
  const url = validatedDebuggerUrl(version, port);
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/devtools\/browser\/([A-Za-z0-9._-]{1,200})$/);
  if (!match || parsed.search || parsed.hash || !BROWSER_ID_PATTERN.test(match[1])) {
    throw new Error("Rejected an invalid CDP browser identity URL");
  }
  return match[1];
}

function isValidCdpPageTarget(item, port) {
  if (item?.type !== "page" || !item.url?.startsWith("app://") || typeof item.id !== "string" ||
      !BROWSER_ID_PATTERN.test(item.id) || !item.webSocketDebuggerUrl) return false;
  try {
    const debuggerUrl = new URL(validatedDebuggerUrl(item, port));
    return debuggerUrl.pathname === `/devtools/page/${item.id}`;
  } catch {
    return false;
  }
}

class CdpSession {
  constructor(target, port) {
    this.target = target;
    this.ws = new WebSocket(validatedDebuggerUrl(target, port));
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.closed = false;
  }

  async open() {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        try { this.ws.close(); } catch {}
        reject(new Error("CDP WebSocket open timed out"));
      }, 5000);
      this.ws.addEventListener("open", () => { clearTimeout(timeout); resolve(); }, { once: true });
      this.ws.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("CDP WebSocket open failed")); }, { once: true });
    });
    this.ws.addEventListener("message", (event) => this.onMessage(event));
    this.ws.addEventListener("error", () => this.close());
    this.ws.addEventListener("close", () => {
      this.closed = true;
      for (const waiter of this.pending.values()) {
        clearTimeout(waiter.timeout);
        waiter.reject(new Error("CDP socket closed"));
      }
      this.pending.clear();
    });
    await this.send("Runtime.enable");
    await this.send("Page.enable");
    return this;
  }

  onMessage(event) {
    let message;
    try {
      message = JSON.parse(String(event.data));
    } catch {
      this.close();
      return;
    }
    if (message.id) {
      const waiter = this.pending.get(message.id);
      if (!waiter) return;
      clearTimeout(waiter.timeout);
      this.pending.delete(message.id);
      if (message.error) waiter.reject(new Error(`${message.error.message} (${message.error.code})`));
      else waiter.resolve(message.result);
      return;
    }
    for (const listener of this.listeners.get(message.method) ?? []) listener(message.params ?? {});
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method, params = {}) {
    if (this.closed) return Promise.reject(new Error("CDP session is closed"));
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 10000);
      this.pending.set(id, { resolve, reject, timeout });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        clearTimeout(timeout);
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: false,
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text;
      throw new Error(`Renderer evaluation failed: ${detail}`);
    }
    return result.result?.value;
  }

  close() {
    for (const waiter of this.pending.values()) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error("CDP session closed"));
    }
    this.pending.clear();
    if (!this.closed) {
      try { this.ws.close(); } catch {}
    }
    this.closed = true;
  }
}

class BrowserIdentityAnchor {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.closed = false;
    this.ws.addEventListener("close", () => { this.closed = true; });
    this.ws.addEventListener("error", () => {
      this.closed = true;
      try { this.ws.close(); } catch {}
    });
  }

  async open() {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.close();
        reject(new Error("CDP browser identity WebSocket open timed out"));
      }, 5000);
      this.ws.addEventListener("open", () => { clearTimeout(timeout); resolve(); }, { once: true });
      this.ws.addEventListener("error", () => {
        clearTimeout(timeout);
        reject(new Error("CDP browser identity WebSocket open failed"));
      }, { once: true });
      this.ws.addEventListener("close", () => {
        clearTimeout(timeout);
        reject(new Error("CDP browser identity WebSocket closed during startup"));
      }, { once: true });
    });
    if (this.closed) throw new Error("CDP browser identity WebSocket is already closed");
    return this;
  }

  close() {
    if (!this.closed) {
      try { this.ws.close(); } catch {}
    }
    this.closed = true;
  }
}

async function fetchCdpJson(port, resource) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(`http://127.0.0.1:${port}${resource}`, {
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function listAppTargets(port, expectedBrowserId = null) {
  const targets = await fetchCdpJson(port, "/json/list");
  if (!Array.isArray(targets)) throw new Error("CDP target list is not an array");
  if (expectedBrowserId) {
    const version = await fetchCdpJson(port, "/json/version");
    const actualBrowserId = browserIdFromVersion(version, port);
    if (actualBrowserId !== expectedBrowserId) {
      throw new CdpIdentityMismatchError(
        `CDP browser identity changed from ${expectedBrowserId} to ${actualBrowserId}`,
      );
    }
  }
  return targets.filter((item) => isValidCdpPageTarget(item, port));
}

async function connectBrowserIdentityAnchor(port, expectedBrowserId) {
  const version = await fetchCdpJson(port, "/json/version");
  const actualBrowserId = browserIdFromVersion(version, port);
  if (actualBrowserId !== expectedBrowserId) {
    throw new CdpIdentityMismatchError(
      `CDP browser identity changed from ${expectedBrowserId} to ${actualBrowserId}`,
    );
  }
  return new BrowserIdentityAnchor(validatedDebuggerUrl(version, port)).open();
}

async function loadPayload(autoApply = true) {
  const [css, template, hero, portrait, moment] = await Promise.all([
    fs.readFile(path.join(root, "assets", "dream-skin.css"), "utf8"),
    fs.readFile(path.join(root, "assets", "renderer-inject.js"), "utf8"),
    fs.readFile(path.join(root, "assets", "lisiya-hero.png")),
    fs.readFile(path.join(root, "assets", "lisiya-portrait.png")),
    fs.readFile(path.join(root, "assets", "lisiya-moment.png")),
  ]);
  const artDataUrls = [hero, portrait, moment].map(
    (art) => `data:image/png;base64,${art.toString("base64")}`,
  );
  return template
    .replace("__DREAM_CSS_JSON__", JSON.stringify(css))
    .replace("__DREAM_ARTS_JSON__", JSON.stringify(artDataUrls))
    .replace("__DREAM_AUTO_APPLY__", JSON.stringify(autoApply));
}

async function loadOptionalPersonalPayload(autoApply = true) {
  try {
    return await loadPayload(autoApply);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function loadOptionalLocalImageThemes() {
  const localRoot = path.join(root, "assets", "local-examples");
  let definitions;
  try {
    definitions = JSON.parse(await fs.readFile(path.join(localRoot, "themes.json"), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw new Error(`Local image theme catalog is invalid: ${error.message}`);
  }
  if (!Array.isArray(definitions)) throw new Error("Local image theme catalog must be an array");
  const required = ["id", "label", "description", "family", "scheme", "swatch", "background", "sidebar", "main", "surface", "text", "muted", "border", "accent", "accentStrong", "glow", "image", "imageMode"];
  const loaded = [];
  for (const theme of definitions) {
    if (!theme || typeof theme !== "object" || required.some((key) => typeof theme[key] !== "string" || !theme[key].trim())) {
      throw new Error("A local image theme is missing required metadata");
    }
    if (!/^[a-z0-9-]{2,64}$/.test(theme.id) || !/^[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(theme.image) ||
        (theme.secondaryImage && !/^[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(theme.secondaryImage))) {
      throw new Error(`Unsafe local image theme path or ID: ${theme.id}`);
    }
    const readDataUrl = async (filename) => {
      const image = await fs.readFile(path.join(localRoot, filename));
      const extension = path.extname(filename).toLowerCase();
      const mime = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
      return `data:${mime};base64,${image.toString("base64")}`;
    };
    const imageDataUrl = await readDataUrl(theme.image);
    const secondaryDataUrl = theme.secondaryImage ? await readDataUrl(theme.secondaryImage) : null;
    loaded.push({ ...theme, css: buildImageThemeCss(theme, imageDataUrl, secondaryDataUrl) });
  }
  return loaded;
}

async function loadThemeLibraryPayload() {
  const registrationPayload = await loadOptionalPersonalPayload(false);
  const localImageThemes = await loadOptionalLocalImageThemes();
  const themes = BUILT_IN_THEMES.map(({ id, label, description, family, swatch }) => (
    { id, label, description, family, swatch }
  ));
  if (registrationPayload) {
    themes.unshift({
      id: "shiyali",
      label: "李诗雅 · 晴空",
      description: "本机个人图片主题",
      family: "个人 · 本地",
      swatch: "linear-gradient(145deg, #dff6ff, #94bddd 49%, #6f7fbc)",
    });
  }
  themes.push(...localImageThemes.map(({ id, label, description, family, swatch }) => (
    { id, label, description, family, swatch }
  )));
  const genericCss = Object.fromEntries(BUILT_IN_THEMES.map((theme) => [
    theme.id,
    buildGenericThemeCss(theme),
  ]));
  for (const theme of localImageThemes) genericCss[theme.id] = theme.css;
  return `${registrationPayload ? `${registrationPayload};\n` : ""}(() => {
    const libraryId = "codex-manual-theme-library";
    const styleId = "codex-manual-theme-library-style";
    const genericStyleId = "codex-library-generic-theme-style";
    const positionKey = "codex-manual-theme-library-position-v1";
    const themes = ${JSON.stringify(themes)};
    const genericCss = ${JSON.stringify(genericCss)};
    const existing = document.getElementById(libraryId);
    if (existing) {
      existing.remove();
      document.getElementById(styleId)?.remove();
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      "#codex-manual-theme-library { position: fixed; right: 22px; bottom: 118px; z-index: 2147483646; min-width: max-content; font-family: Microsoft YaHei UI, system-ui, sans-serif; color: #25345f; }",
      "#codex-manual-theme-library .ctl-trigger { border: 1px solid rgba(127,156,211,.60); border-radius: 999px; padding: 9px 14px; background: rgba(251,254,255,.94); box-shadow: 0 8px 26px rgba(54,85,145,.20); color: #3b579b; font-weight: 750; cursor: grab; user-select: none; touch-action: none; }",
      "#codex-manual-theme-library .ctl-trigger.dragging { cursor: grabbing; box-shadow: 0 12px 30px rgba(54,85,145,.30); }",
      "#codex-manual-theme-library .ctl-panel { display: none; position: absolute; bottom: 48px; left: 0; width: 372px; max-width: calc(100vw - 44px); max-height: min(620px, calc(100vh - 178px)); overflow: auto; padding: 12px; border: 1px solid rgba(133,164,217,.55); border-radius: 18px; background: rgba(248,252,255,.97); box-shadow: 0 18px 45px rgba(43,75,135,.25); backdrop-filter: blur(16px); }",
      "#codex-manual-theme-library.open .ctl-panel { display: block; }",
      "#codex-manual-theme-library .ctl-title { margin: 1px 2px 9px; color: #334d90; font-size: 14px; font-weight: 800; }",
      "#codex-manual-theme-library .ctl-subtitle { margin: 0 2px 11px; color: #7182aa; font-size: 11px; line-height: 1.5; }",
      "#codex-manual-theme-library .ctl-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }",
      "#codex-manual-theme-library .ctl-option { width: 100%; display: flex; gap: 9px; align-items: center; padding: 8px; border: 1px solid rgba(149,176,219,.38); border-radius: 12px; background: white; color: #2e437b; text-align: left; cursor: pointer; }",
      "#codex-manual-theme-library .ctl-option:hover, #codex-manual-theme-library .ctl-option.active { border-color: rgba(91,126,194,.72); background: linear-gradient(135deg,#f7fcff,#e7f3ff); }",
      "#codex-manual-theme-library .ctl-swatch { width: 35px; height: 35px; flex: 0 0 auto; border-radius: 10px; }",
      "#codex-manual-theme-library .ctl-swatch.official { background: linear-gradient(145deg,#25272d,#5f6675); }",
      "#codex-manual-theme-library .ctl-option b { display: block; font-size: 12px; }",
      "#codex-manual-theme-library .ctl-option small { display: block; margin-top: 2px; color: #8190b1; font-size: 10px; }",
      "#codex-manual-theme-library .ctl-option em { display: block; margin-top: 3px; color: #9aa7c4; font-size: 9px; font-style: normal; }",
      "html.codex-library-generic-theme #codex-manual-theme-library .ctl-option, html.codex-library-generic-theme #codex-manual-theme-library .ctl-option b { color: #2e437b !important; }",
      "html.codex-library-generic-theme #codex-manual-theme-library .ctl-option small { color: #7182aa !important; }",
      "html.codex-library-generic-theme #codex-manual-theme-library .ctl-option em { color: #9aa7c4 !important; }",
      "#codex-manual-theme-library .ctl-reset { margin-top: 9px; }",
    ].join("");
    document.head.appendChild(style);

    const library = document.createElement("div");
    library.id = libraryId;
    const cards = themes.map((theme) => [
      '<button class="ctl-option" data-theme="' + theme.id + '">',
      '<span class="ctl-swatch" style="background:' + theme.swatch + '"></span>',
      '<span><b>' + theme.label + '</b><small>' + theme.description + '</small><em>' + theme.family + '</em></span>',
      '</button>',
    ].join("")).join("");
    library.innerHTML = [
      '<div class="ctl-panel">',
      '<div class="ctl-title">Codex 主题库</div>',
      '<div class="ctl-subtitle">样板主题只应用到当前窗口；关闭 Codex 后不保留。</div>',
      '<div class="ctl-options">', cards, '</div>',
      '<button class="ctl-option ctl-reset" data-theme="official"><span class="ctl-swatch official"></span><span><b>官方外观</b><small>移除当前窗口的自定义皮肤</small></span></button>',
      '</div><button class="ctl-trigger" type="button">✦ 主题库</button>',
    ].join("");
    document.body.appendChild(library);

    const panel = library.querySelector(".ctl-panel");
    const trigger = library.querySelector(".ctl-trigger");
    const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);
    const placePanel = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const panelWidth = Math.min(396, window.innerWidth - 44);
      panel.style.left = triggerRect.left + panelWidth > window.innerWidth - 12
        ? Math.round(triggerRect.width - panelWidth) + "px" : "0px";
    };
    const moveLibrary = (left, top) => {
      const triggerRect = trigger.getBoundingClientRect();
      const nextLeft = clamp(left, 12, window.innerWidth - triggerRect.width - 12);
      const nextTop = clamp(top, 12, window.innerHeight - triggerRect.height - 12);
      library.style.right = "auto";
      library.style.bottom = "auto";
      library.style.left = Math.round(nextLeft) + "px";
      library.style.top = Math.round(nextTop) + "px";
      placePanel();
      return { left: Math.round(nextLeft), top: Math.round(nextTop) };
    };
    try {
      const saved = JSON.parse(window.localStorage.getItem(positionKey) || "null");
      if (Number.isFinite(saved?.left) && Number.isFinite(saved?.top)) moveLibrary(saved.left, saved.top);
    } catch {}
    let dragState = null;
    let suppressTriggerClick = false;
    trigger.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const rect = trigger.getBoundingClientRect();
      dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
      try { trigger.setPointerCapture?.(event.pointerId); } catch {}
      trigger.classList.add("dragging");
    });
    trigger.addEventListener("pointermove", (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const offsetX = event.clientX - dragState.startX;
      const offsetY = event.clientY - dragState.startY;
      if (Math.abs(offsetX) > 4 || Math.abs(offsetY) > 4) dragState.moved = true;
      if (!dragState.moved) return;
      event.preventDefault();
      moveLibrary(dragState.left + offsetX, dragState.top + offsetY);
    });
    const finishDrag = (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      try { trigger.releasePointerCapture?.(event.pointerId); } catch {}
      trigger.classList.remove("dragging");
      if (dragState.moved) {
        const rect = trigger.getBoundingClientRect();
        try { window.localStorage.setItem(positionKey, JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) })); } catch {}
        suppressTriggerClick = true;
        window.setTimeout(() => { suppressTriggerClick = false; }, 0);
      }
      dragState = null;
    };
    trigger.addEventListener("pointerup", finishDrag);
    trigger.addEventListener("pointercancel", finishDrag);
    window.addEventListener("resize", () => {
      const rect = trigger.getBoundingClientRect();
      if (library.style.left) moveLibrary(rect.left, rect.top);
      else placePanel();
    });

    const setActive = (name) => {
      library.querySelectorAll("[data-theme]").forEach((button) =>
        button.classList.toggle("active", button.dataset.theme === name),
      );
    };
    const clearDreamTheme = () => {
      window.__CODEX_DREAM_SKIN_DISABLED__ = true;
      window.__CODEX_DREAM_SKIN_STATE__?.cleanup?.();
    };
    const clearGenericTheme = () => {
      document.documentElement.classList.remove("codex-library-generic-theme");
      delete document.documentElement.dataset.codexCatalogTheme;
      document.getElementById(genericStyleId)?.remove();
      document.getElementById("codex-library-image-art")?.remove();
    };
    const applyTheme = (name) => {
      if (name === "shiyali" && window.__CODEX_DREAM_SKIN_APPLY__) {
        clearGenericTheme();
        window.__CODEX_DREAM_SKIN_APPLY__?.();
      } else if (name === "official") {
        clearDreamTheme();
        clearGenericTheme();
      } else if (genericCss[name]) {
        clearDreamTheme();
        clearGenericTheme();
        const genericStyle = document.createElement("style");
        genericStyle.id = genericStyleId;
        genericStyle.textContent = genericCss[name];
        document.head.appendChild(genericStyle);
        document.documentElement.classList.add("codex-library-generic-theme");
        document.documentElement.dataset.codexCatalogTheme = name;
      }
      setActive(name);
    };
    trigger.addEventListener("click", (event) => {
      if (suppressTriggerClick) { event.preventDefault(); return; }
      library.classList.toggle("open");
      placePanel();
    });
    library.querySelectorAll("[data-theme]").forEach((button) =>
      button.addEventListener("click", () => applyTheme(button.dataset.theme)),
    );
    return { installed: true, replaced: Boolean(existing) };
  })()`;
}

async function probeSession(session) {
  return session.evaluate(`(() => {
    const markers = {
      shell: Boolean(document.querySelector('main.main-surface')),
      sidebar: Boolean(document.querySelector('aside.app-shell-left-panel')),
      composer: Boolean(document.querySelector('.composer-surface-chrome')),
      main: Boolean(document.querySelector('[role="main"]')),
    };
    return {
      markers,
      codex: location.protocol === 'app:' && markers.shell && markers.sidebar && (markers.composer || markers.main),
    };
  })()`);
}

async function connectTarget(target, port) {
  return new CdpSession(target, port).open();
}

async function connectCodexTargets(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const targets = await listAppTargets(port, options.browserId);
      const connected = [];
      for (const target of targets) {
        let session;
        try {
          session = await connectTarget(target, port);
          const probe = await probeSession(session);
          if (probe?.codex) connected.push({ target, session, probe });
          else session.close();
        } catch (error) {
          session?.close();
          lastError = error;
        }
      }
      if (connected.length) return connected;
      lastError = new Error("No page matched the expected Codex shell markers");
    } catch (error) {
      if (error instanceof CdpIdentityMismatchError) throw error;
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  throw new Error(`No verified Codex renderer on 127.0.0.1:${port}: ${lastError?.message ?? "timed out"}`);
}

async function applyToSession(session, payload) {
  return session.evaluate(payload);
}

async function removeFromSession(session) {
  return session.evaluate(`(() => {
    window.__CODEX_DREAM_SKIN_DISABLED__ = true;
    const state = window.__CODEX_DREAM_SKIN_STATE__;
    if (state?.cleanup) return state.cleanup();
    document.documentElement?.classList.remove('codex-dream-skin');
    ['--dream-art', '--lisiya-portrait', '--lisiya-moment'].forEach((name) =>
      document.documentElement?.style.removeProperty(name),
    );
    document.querySelectorAll('.dream-home').forEach((node) => node.classList.remove('dream-home'));
    document.querySelectorAll('.dream-home-shell').forEach((node) => node.classList.remove('dream-home-shell'));
    document.getElementById('codex-dream-skin-style')?.remove();
    document.getElementById('codex-dream-skin-chrome')?.remove();
    delete window.__CODEX_DREAM_SKIN_STATE__;
    return true;
  })()`);
}

async function verifyRemovedSession(session) {
  return session.evaluate(`(() =>
    !document.documentElement.classList.contains('codex-dream-skin') &&
    !document.documentElement.style.getPropertyValue('--dream-art') &&
    !document.querySelector('.dream-home') &&
    !document.querySelector('.dream-home-shell') &&
    !document.getElementById('codex-dream-skin-style') &&
    !document.getElementById('codex-dream-skin-chrome') &&
    !window.__CODEX_DREAM_SKIN_STATE__
  )()`);
}

async function verifySession(session) {
  return session.evaluate(`(() => {
    const box = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const home = document.querySelector('.dream-home');
    const suggestions = home?.querySelector('.group\\\\/home-suggestions') ?? null;
    const cards = suggestions ? [...suggestions.querySelectorAll('button')].map(box) : [];
    const result = {
      installed: document.documentElement.classList.contains('codex-dream-skin'),
      version: window.__CODEX_DREAM_SKIN_STATE__?.version ?? null,
      expectedVersion: ${JSON.stringify(SKIN_VERSION)},
      stylePresent: Boolean(document.getElementById('codex-dream-skin-style')),
      chromePresent: Boolean(document.getElementById('codex-dream-skin-chrome')),
      chromePointerEvents: getComputedStyle(document.getElementById('codex-dream-skin-chrome') || document.body).pointerEvents,
      homePresent: Boolean(home),
      suggestionsPresent: Boolean(suggestions),
      hero: box(home?.firstElementChild?.firstElementChild?.firstElementChild),
      cards,
      composer: box(document.querySelector('.composer-surface-chrome')),
      sidebar: box(document.querySelector('aside.app-shell-left-panel')),
      viewport: { width: innerWidth, height: innerHeight },
      documentOverflow: {
        x: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        y: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      },
    };
    result.pass = result.installed && result.version === result.expectedVersion &&
      result.stylePresent && result.chromePresent &&
      result.chromePointerEvents === 'none' && Boolean(result.composer) && Boolean(result.sidebar) &&
      (!result.homePresent || (Boolean(result.hero) &&
        (!result.suggestionsPresent || (result.cards.length >= 2 && result.cards.length <= 4))));
    return result;
  })()`);
}

async function waitForVerifiedSession(session, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastResult;
  let lastError;
  while (Date.now() < deadline) {
    try {
      lastResult = await verifySession(session);
      lastError = null;
      if (lastResult.pass) return lastResult;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!lastResult && lastError) throw lastError;
  return lastResult;
}

async function capture(session, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await session.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await session.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  const viewport = await session.evaluate("({ width: innerWidth, height: innerHeight })");
  await session.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: Math.round(viewport.width * 0.64),
    y: Math.round(viewport.height * 0.62),
    button: "none",
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
  const result = await session.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await fs.writeFile(outputPath, Buffer.from(result.data, "base64"));
}

async function runOneShot(options) {
  const connected = await connectCodexTargets(options.port, options.timeoutMs);
  const payload = (options.mode === "once" || options.reload)
    ? await loadPayload()
    : options.mode === "library" ? await loadThemeLibraryPayload() : null;
  const results = [];
  let screenshotCaptured = false;
  try {
    for (const { target, session, probe } of connected) {
      try {
        if (options.mode === "remove") await removeFromSession(session);
        else if (options.mode === "once" || options.mode === "library") await applyToSession(session, payload);
        if (options.mode === "once") {
          await new Promise((resolve) => setTimeout(resolve, 850));
        }
        if (options.reload) {
          await session.send("Page.reload", { ignoreCache: true });
          await new Promise((resolve) => setTimeout(resolve, 1600));
          if (options.mode !== "remove") await applyToSession(session, payload);
        }
        const verified = options.mode === "library"
          ? await session.evaluate("Boolean(document.getElementById('codex-manual-theme-library'))")
          : options.mode === "remove"
          ? await verifyRemovedSession(session)
          : (options.reload || options.mode === "once" || options.mode === "verify")
            ? await waitForVerifiedSession(session, options.timeoutMs)
            : await verifySession(session);
        results.push({ targetId: target.id, markers: probe.markers, result: verified });
        if (options.screenshot && !screenshotCaptured) {
          await capture(session, options.screenshot);
          screenshotCaptured = true;
        }
      } finally {
        session.close();
      }
    }
  } finally {
    for (const { session } of connected) session.close();
  }
  console.log(JSON.stringify({ mode: options.mode, port: options.port, targets: results }, null, 2));
  const failed = results.length === 0 || results.some((item) =>
    options.mode === "library" || options.mode === "remove" ? item.result !== true : !item.result?.pass);
  if (failed) process.exitCode = 2;
}

async function runWatch(options) {
  const identityAnchor = await connectBrowserIdentityAnchor(options.port, options.browserId);
  const sessions = new Map();
  const targetFailures = new Map();
  let stopping = false;
  let listFailures = 0;
  let lastListErrorLogAt = 0;
  const stop = () => { stopping = true; };
  const rejectTarget = (target, baseDelayMs, error = null) => {
    const previous = targetFailures.get(target.id) ?? { failures: 0, lastLogAt: 0 };
    const failures = previous.failures + 1;
    const delayMs = Math.min(30000, baseDelayMs * (2 ** Math.min(failures - 1, 4)));
    const now = Date.now();
    if (error && (failures === 1 || now - previous.lastLogAt >= 30000)) {
      console.error(`[dream-skin] inject failed for ${target.id}: ${error.message}; retrying in ${delayMs}ms`);
      previous.lastLogAt = now;
    }
    targetFailures.set(target.id, { failures, lastLogAt: previous.lastLogAt, until: now + delayMs });
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  try {
    const payload = await loadPayload();
    while (!stopping) {
      if (identityAnchor.closed) {
        console.error("[dream-skin] original CDP browser identity closed; watcher is stopping instead of reconnecting");
        process.exitCode = 3;
        break;
      }
      let targets = [];
      try {
        targets = await listAppTargets(options.port);
        listFailures = 0;
      } catch (error) {
        listFailures += 1;
        const retryMs = Math.min(10000, 1000 * (2 ** Math.min(listFailures - 1, 4)));
        if (listFailures === 1 || Date.now() - lastListErrorLogAt >= 30000) {
          console.error(`[dream-skin] ${new Date().toISOString()} ${error.message}; retrying in ${retryMs}ms`);
          lastListErrorLogAt = Date.now();
        }
        await new Promise((resolve) => setTimeout(resolve, retryMs));
        continue;
      }

      const activeIds = new Set(targets.map((target) => target.id));
      for (const id of targetFailures.keys()) {
        if (!activeIds.has(id)) targetFailures.delete(id);
      }
      for (const [id, session] of sessions) {
        if (!activeIds.has(id) || session.closed) {
          session.close();
          sessions.delete(id);
          targetFailures.delete(id);
        }
      }

      for (const target of targets) {
        if (identityAnchor.closed) break;
        if (sessions.has(target.id)) continue;
        if ((targetFailures.get(target.id)?.until ?? 0) > Date.now()) continue;
        let session;
        try {
          session = await connectTarget(target, options.port);
          if (identityAnchor.closed) throw new CdpIdentityMismatchError("Original CDP browser identity closed");
          const probe = await probeSession(session);
          if (!probe?.codex) {
            rejectTarget(target, 5000);
            session.close();
            continue;
          }
          let lastReinjectErrorLogAt = 0;
          session.on("Page.loadEventFired", () => {
            setTimeout(() => applyToSession(session, payload).catch((error) => {
              if (Date.now() - lastReinjectErrorLogAt >= 30000) {
                console.error(`[dream-skin] reinject failed for ${target.id}: ${error.message}`);
                lastReinjectErrorLogAt = Date.now();
              }
            }), 250);
          });
          if (identityAnchor.closed) throw new CdpIdentityMismatchError("Original CDP browser identity closed");
          await applyToSession(session, payload);
          sessions.set(target.id, session);
          targetFailures.delete(target.id);
          console.log(`[dream-skin] injected target ${target.id}`);
        } catch (error) {
          session?.close();
          if (identityAnchor.closed || error instanceof CdpIdentityMismatchError) break;
          rejectTarget(target, 2500, error);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  } finally {
    identityAnchor.close();
    for (const session of sessions.values()) session.close();
  }
}

const options = parseArgs(process.argv.slice(2));
if (options.mode === "self-test") {
  const valid = validatedDebuggerUrl({ webSocketDebuggerUrl: `ws://127.0.0.1:${options.port}/devtools/page/test` }, options.port);
  const browserId = browserIdFromVersion({
    webSocketDebuggerUrl: `ws://127.0.0.1:${options.port}/devtools/browser/test-browser`,
  }, options.port);
  const invalid = [
    "ws://example.com/devtools/page/test",
    `ws://127.0.0.1:${options.port + 1}/devtools/page/test`,
    `wss://127.0.0.1:${options.port}/devtools/page/test`,
    `ws://user@127.0.0.1:${options.port}/devtools/page/test`,
    `ws://127.0.0.1:${options.port}/unexpected/test`,
    `ws://127.0.0.1:${options.port}/devtools/page/test?query=1`,
  ];
  for (const value of invalid) {
    let rejected = false;
    try { validatedDebuggerUrl({ webSocketDebuggerUrl: value }, options.port); } catch { rejected = true; }
    if (!rejected) throw new Error(`CDP URL validation accepted an unsafe URL: ${value}`);
  }
  const invalidBrowserUrls = [
    `ws://127.0.0.1:${options.port}/devtools/page/not-a-browser`,
    `ws://127.0.0.1:${options.port}/devtools/browser/bad%20id`,
    `ws://127.0.0.1:${options.port}/devtools/browser/test?query=1`,
  ];
  for (const value of invalidBrowserUrls) {
    let rejected = false;
    try { browserIdFromVersion({ webSocketDebuggerUrl: value }, options.port); } catch { rejected = true; }
    if (!rejected) throw new Error(`Browser identity validation accepted an unsafe URL: ${value}`);
  }
  const validPageTarget = {
    id: "page-test",
    type: "page",
    url: "app://codex/",
    webSocketDebuggerUrl: `ws://127.0.0.1:${options.port}/devtools/page/page-test`,
  };
  const invalidPageTargets = [
    { ...validPageTarget, webSocketDebuggerUrl: `ws://127.0.0.1:${options.port}/devtools/browser/page-test` },
    { ...validPageTarget, id: "other-page" },
    { ...validPageTarget, id: 123 },
    { ...validPageTarget, type: "other" },
  ];
  if (!valid || browserId !== "test-browser" || !isValidCdpPageTarget(validPageTarget, options.port) ||
      invalidPageTargets.some((item) => isValidCdpPageTarget(item, options.port))) {
    throw new Error("CDP URL and target validation self-test failed");
  }
  console.log(JSON.stringify({ pass: true, version: SKIN_VERSION, test: "loopback-cdp-validation" }));
} else if (options.mode === "check-payload") {
  const personalPayload = await loadOptionalPersonalPayload();
  const libraryPayload = await loadThemeLibraryPayload();
  if ((personalPayload && (personalPayload.includes("__DREAM_CSS_JSON__") || personalPayload.includes("__DREAM_ARTS_JSON__") || personalPayload.includes("__DREAM_AUTO_APPLY__"))) ||
      libraryPayload.includes("__DREAM_CSS_JSON__") || libraryPayload.includes("__DREAM_ARTS_JSON__") || libraryPayload.includes("__DREAM_AUTO_APPLY__")) {
    throw new Error("Payload placeholders were not fully replaced");
  }
  console.log(JSON.stringify({
    pass: true,
    version: SKIN_VERSION,
    personalThemeAvailable: Boolean(personalPayload),
    libraryPayloadBytes: Buffer.byteLength(libraryPayload),
  }));
} else if (options.mode === "watch") await runWatch(options);
else await runOneShot(options);
