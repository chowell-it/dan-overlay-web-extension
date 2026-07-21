// Toolbar popup — renders the counter's exact panel for the beatmap open in the
// active tab, plus dan-system / rate selectors. All computation is in-browser.
(function () {
  "use strict";

  const T = window.DanTheme;
  const DEFAULTS = { mod: "NM", danMode: "reform" };
  const MODE_LABEL = { reform: "Reform", celestial: "Celestial", signicial: "Signicial", shoegazer: "Shoegazer" };

  let prefs = Object.assign({}, DEFAULTS);
  let osuText = null; // cached .osu — switching mod/system never refetches
  let setId = null;

  const $ = (id) => document.getElementById(id);
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const n2 = (v) => (Number(v) > 0 ? Number(v).toFixed(2) : "--.-");

  function setLoading(on, text) {
    $("danPanel").classList.toggle("is-loading", !!on);
    if (text) $("loadingText").textContent = text;
  }

  /* ── Theming: mirrors the counter's applyDanResult colour pass ────── */
  function applyPalette(palette) {
    const gradient = T.paletteToGradient(palette);
    const primary = T.parseRGB(palette[0]);
    const secondary = T.parseRGB(palette[palette.length - 1]);
    const root = document.documentElement.style;
    root.setProperty("--dan-gradient", gradient);
    root.setProperty("--dan-gradient-anim", `linear-gradient(90deg, ${[...palette, ...palette, palette[0]].join(", ")})`);
    root.setProperty("--line-color", T.paletteMidColor(palette));
    root.setProperty("--dan-primary", `rgb(${primary.join(",")})`);
    root.setProperty("--dan-secondary", `rgb(${secondary.join(",")})`);
    root.setProperty("--dan-primary-raw", primary.join(","));
    root.setProperty("--dan-secondary-raw", secondary.join(","));
    root.setProperty("--dan-glow", `rgba(${primary.join(",")}, 0.45)`);
    root.setProperty("--dan-border", `rgba(${primary.join(",")}, 0.35)`);
    root.setProperty("--dan-bg-tint", `rgba(${primary.join(",")}, 0.08)`);
  }

  // Watermark image — same lookup tables and rules as the counter:
  // Celestial → tier PNG, Signicial → stage PNG, Shoegazer/7K → none,
  // Reform → greek letter keyed by dan_short.
  function setWatermark(danMode, r) {
    const img = $("danGreekBg");
    let file = "";
    if (danMode === "celestial" && r.celestial) {
      const f = T.CELESTIAL_PNG[r.celestial.tier || ""];
      file = f ? `celestial_images/${f}.png` : "";
    } else if (danMode === "signicial" && r.signicial) {
      const f = T.SIGNICIAL_PNG[r.signicial.stage_key || ""];
      file = f ? `signicial_images/${f}.png` : "";
    } else if (danMode === "shoegazer" || r.tier_7k != null) {
      file = "";
    } else {
      const f = T.GREEK_PNG[r.dan_short || ""];
      file = f ? `images/${f}.png` : "";
    }
    img.src = file;
    img.style.opacity = file ? "" : "0";
  }

  /* ── Which tier/DP/palette for the selected system ───────────────── */
  function headlineFor(r, danMode) {
    if (r.mode === "7k" || r.tier_7k != null) {
      return { label: r.tier_7k, sub: r.sublevel_7k, dp: r.dp_7k,
               palette: T.PALETTES_7K[r.tier_7k] || T.PALETTES_7K["Gamma"], is7k: true };
    }
    const alt = r[danMode];
    if (danMode === "celestial" && alt)
      return { label: alt.label, sub: alt.category, dp: alt.dp_celestial, beyond: alt.beyond,
               palette: T.CELESTIAL_PALETTES[alt.tier] || T.CELESTIAL_PALETTES["Beginner"] };
    if (danMode === "signicial" && alt)
      return { label: alt.label, sub: alt.subtitle, dp: alt.dp_signicial, beyond: alt.beyond,
               palette: T.SIGNICIAL_PALETTES[alt.stage_key] || T.SIGNICIAL_PALETTES["I"] };
    if (danMode === "shoegazer" && alt)
      return { label: alt.label, sub: alt.short, dp: alt.dp_shoegazer, beyond: alt.beyond,
               palette: T.SHOEGAZER_PALETTES[alt.stage_key] || T.SHOEGAZER_PALETTES["1st"] };
    return { label: r.dan_label, sub: r.sublevel, dp: r.dp, beyond: r.beyond,
             palette: T.paletteForDan(r.dan_label), fellBack: danMode !== "reform" };
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  function render(r) {
    const h = headlineFor(r, prefs.danMode);
    applyPalette(h.palette);
    setWatermark(h.fellBack ? "reform" : prefs.danMode, r);

    const name = h.label || "—";
    $("danName").textContent = name;
    // Long labels (Celestial tiers, Signicial stages) would run into the metrics
    // box at the enlarged size — step the size down as the name grows.
    const nameEl = $("danName");
    nameEl.style.fontSize = name.length > 13 ? "34px"
      : name.length > 9 ? "46px"
      : name.length > 6 ? "56px"
      : "";  // "" = use the 64px rule from popup.css
    $("danSub").textContent = (h.beyond ? "Beyond " : "") + (h.sub || "");
    $("danDpValue").textContent = h.dp != null ? Number(h.dp).toFixed(2) : "--";

    // Skillset chips (top two), same as the counter's chart-family line
    const ss = r.skillsets || {};
    const LBL = { stream: "STREAM", jumpstream: "JS", handstream: "HS", stamina: "STAM",
                  jackspeed: "JACK", chordjack: "CJ", technical: "TECH" };
    const top = Object.keys(LBL).map((k) => [k, Number(ss[k] || 0)])
      .sort((a, b) => b[1] - a[1]).filter((x) => x[1] > 0).slice(0, 2).map((x) => LBL[x[0]]);
    $("chartFamily").textContent = top.length ? top.join(" · ") : (r.family ? String(r.family).toUpperCase() : "");

    // Intensity bar — DP against its 20-point scale
    const pct = Math.max(0, Math.min(100, (Number(h.dp) || 0) / 20 * 100));
    $("intensityFill").style.width = pct + "%";
    $("intensityThumb").style.left = pct + "%";

    // Metrics: MSD · Quaver (MSD is 4K-only)
    const msd = Number(r.overall_msd) || 0, qsr = Number(r.quaver_rating) || 0;
    if (h.is7k || msd <= 0) {
      $("danMetrics").textContent = n2(qsr);
      document.querySelector(".msd-unit").textContent = "QSR";
    } else {
      $("danMetrics").textContent = `${n2(msd)} · ${n2(qsr)}`;
      document.querySelector(".msd-unit").textContent = "MSD · QSR";
    }

    $("mapSr").textContent = (Number(r.sr) > 0 ? Number(r.sr).toFixed(2) : "--") + "★";
    $("mapBpm").textContent = (r.bpm ? Math.round(r.bpm) : "--") + " BPM";
    $("mapOd").textContent = "OD " + (Number(r.od) > 0 ? Number(r.od).toFixed(1) : "--");
    $("mapDuration").textContent = r.duration_s ? fmtTime(r.duration_s) : "--:--";

    $("modBadge").textContent = prefs.mod !== "NM" ? prefs.mod : "";
    const badge = $("scoringModeBadge");
    const shown = h.fellBack ? "reform" : (h.is7k ? "reform" : prefs.danMode);
    badge.textContent = `◇ Mode: ${MODE_LABEL[shown]}`;
    badge.dataset.mode = shown;

    setLoading(false);
  }

  /* ── Data ────────────────────────────────────────────────────────── */
  function beatmapIdFromUrl(url) {
    let m = /#[a-z]+\/(\d+)/i.exec(url);
    if (m) return m[1];
    m = /\/beatmapsets\/\d+\/(\d+)/.exec(url);
    return m ? m[1] : null;
  }

  function compute() {
    if (!osuText) return;
    let r;
    try { r = window.DanEngine.analyze(osuText, prefs.mod, 0); }
    catch (e) { setLoading(true, "Engine error"); console.error(e); return; }
    if (!r || r.error) { setLoading(true, "osu!mania 4K/7K only"); return; }
    render(r);
  }

  function waitForMsd(timeoutMs) {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;
      (function poll() {
        if (window.__MINACALC && window.__MINACALC.ready) return resolve(true);
        if (Date.now() > deadline) return resolve(false);
        setTimeout(poll, 60);
      })();
    });
  }

  // Header text comes from the page title / tab, background from the set cover.
  function setMapChrome(tab, beatmapId) {
    const raw = (tab.title || "").replace(/\s*·\s*osu!.*$/i, "").trim();
    $("mapTitle").textContent = raw || "Beatmap " + beatmapId;
    $("mapTitleGhost").textContent = raw || "";
    const sm = /\/beatmapsets\/(\d+)/.exec(tab.url || "");
    setId = sm ? sm[1] : null;
    if (setId) {
      $("danPanel").style.setProperty(
        "--map-bg", `url("https://assets.ppy.sh/beatmaps/${setId}/covers/cover@2x.jpg")`);
      $("danPanel").classList.add("has-bg");
    }
  }

  async function init() {
    prefs = Object.assign({}, DEFAULTS, await chrome.storage.local.get(DEFAULTS));
    $("doMod").value = prefs.mod;
    $("doDanMode").value = prefs.danMode;

    $("doMod").addEventListener("change", (e) => {
      prefs.mod = e.target.value;
      chrome.storage.local.set({ mod: prefs.mod });
      compute(); // rate change → re-analyze
    });
    $("doDanMode").addEventListener("change", (e) => {
      prefs.danMode = e.target.value;
      chrome.storage.local.set({ danMode: prefs.danMode });
      compute(); // system change → just re-render
    });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const beatmapId = tab && tab.url ? beatmapIdFromUrl(tab.url) : null;
    if (!beatmapId) { setLoading(true, "Open a beatmap difficulty"); return; }

    setLoading(true, "Computing");
    setMapChrome(tab, beatmapId);

    try {
      const res = await fetch(`https://osu.ppy.sh/osu/${beatmapId}`, { credentials: "include" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      osuText = await res.text();
    } catch (e) { setLoading(true, "Couldn't fetch .osu"); return; }

    $("mapArtist").textContent = (/^Creator:\s*(.+)$/m.exec(osuText) || [, ""])[1]
      ? "Mapped by " + /^Creator:\s*(.+)$/m.exec(osuText)[1].trim() : "—";
    const ver = /^Version:\s*(.+)$/m.exec(osuText);
    const ttl = /^Title:\s*(.+)$/m.exec(osuText);
    const art = /^Artist:\s*(.+)$/m.exec(osuText);
    if (ttl && art) {
      const line = `${art[1].trim()} — ${ttl[1].trim()}${ver ? ` [${ver[1].trim()}]` : ""}`;
      $("mapTitle").textContent = line;
      $("mapTitleGhost").textContent = line;
    }

    await waitForMsd(4000);
    compute();
  }

  init();
})();
