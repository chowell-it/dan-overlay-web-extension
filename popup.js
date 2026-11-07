// Toolbar popup — renders the counter's exact panel for the beatmap open in the
// active tab, plus dan-system / rate selectors. All computation is in-browser.
(function () {
  "use strict";

  const T = window.DanTheme;
  const DEFAULTS = { mod: "NM", danMode: "reform" };
  const MOD_RATE = { NM: 1, DT: 1.5, HT: 0.75 };
  const PRISM_SUB = ["--", "-", "", "+", "++"];
  const SUBLEVELS = ["Low", "Mid-Low", "Mid", "Mid-High", "High"];
  // Prism files its skillsets in MinaCalc's slots; these are the names
  // Mania Tracker shows for them (src/lib/skill-axes.ts).
  const PRISM_LBL = { Jumpstream: "CHORDSTREAM", Handstream: "BRACKET", Chordjack: "JACK",
                      Technical: "TECH", Speed: "DELAY", LN: "LN" };

  let prefs = Object.assign({}, DEFAULTS);
  let userPickedMode = false; // once true, stop auto-switching to LN for this map
  let osuText = null; // cached .osu — switching mod/system never refetches
  let setId = null;
  let shown = null; // what's on the panel, for the chart export

  const $ = (id) => document.getElementById(id);
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const n2 = (v) => (Number(v) > 0 ? Number(v).toFixed(2) : "--.-");

  function setLoading(on, text) {
    $("danPanel").classList.toggle("is-loading", !!on);
    if (text) $("loadingText").textContent = text;
    if (on) $("exportBtn").disabled = true;
  }

  // Pill group. Buttons are only rebuilt when the options change, so keyboard
  // focus survives a selection.
  function setSeg(id, options, active) {
    const seg = $(id);
    const key = options.map((o) => o[0]).join();
    if (seg.dataset.key !== key) {
      seg.dataset.key = key;
      seg.replaceChildren(...options.map(([value, label]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.value = value;
        b.textContent = label;
        return b;
      }));
    }
    seg.hidden = options.length < 2;
    for (const b of seg.children) b.setAttribute("aria-pressed", String(b.dataset.value === active));
  }

  // Only the ratings this chart has. LN is offered on 6K-8K once the chart passes
  // the LN rating threshold, with Rice alongside it.
  function danOptions(r) {
    const t = r.prism;
    if (!t) {
      const options = [["reform", r.ln_course ? "Reform (Rice)" : "Reform"], ["celestial", "Celestial"],
                       ["signicial", "Signicial"], ["shoegazer", "Shoegazer"]];
      return r.ln_course ? [...options, ["ln", "LN"]] : options;
    }
    const prism = t.rice && t.ln && t.msd && t.msd.LN > 0
      ? [["prism-rice", "Prism Rice"], ["prism-ln", "Prism LN"]] : [["prism", "Prism"]];
    return r.tier_7k != null ? [["reform", "7K Ruler"], ...prism] : prism;
  }

  // Which option to show. LN maps open on their LN rating until the user picks
  // something this session; the stored pref is left alone.
  function resolveMode(r, options) {
    const want = prefs.danMode;
    const has = (v) => options.some((o) => o[0] === v);
    if (r.prism) {
      const lnMap = r.prism.primary && r.prism.primary.ln;
      if (r.tier_7k != null && !want.startsWith("prism") && (userPickedMode || !lnMap)) return "reform";
      if (userPickedMode && has(want)) return want;
      return has("prism") ? "prism" : (r.prism.primary.ln ? "prism-ln" : "prism-rice");
    }
    if (r.ln_course && !userPickedMode) return "ln";
    return has(want) ? want : "reform";
  }

  function setDanSelect(options, active) {
    const select = $("doDanMode");
    select.replaceChildren(...options.map(([value, label]) => new Option(label, value)));
    select.value = active;
    select.disabled = options.length < 2;
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
    } else if (danMode === "shoegazer" || danMode === "ln" || r.tier_7k != null) {
      file = "";
    } else {
      const f = T.GREEK_PNG[r.dan_short || ""];
      file = f ? `images/${f}.png` : "";
    }
    img.src = file;
    img.style.opacity = file ? "" : "0";
  }

  /* ── Which tier/DP/palette for the selected system ───────────────── */
  function prismHeadline(t, danMode) {
    const d = danMode === "prism-rice" ? t.rice : danMode === "prism-ln" ? t.ln : t.primary;
    if (!d) return { label: "No dan", sub: `No ${t.key_count}K dan table`, dp: null,
                     palette: T.PALETTES_7K["Gamma"], prism: true, fixed: true };
    const title = (s) => s[0].toUpperCase() + s.slice(1);
    const n = Number(d.label);
    const numbered = !Number.isNaN(n);
    const name = numbered ? `${["0th", "1st", "2nd", "3rd"][n] || n + "th"} Dan` : title(d.label);
    // raw steps by 0.2 around the tier (7-- = 6.6); DP instead keeps the tier as
    // its whole part and the sublevel as its fraction, which the slider reads.
    const i = PRISM_SUB.indexOf(d.variant || "");
    return { label: name,
             sub: SUBLEVELS[i] + (d.ln ? " · LN" : danMode === "prism-rice" ? " · Rice" : ""),
             dp: Math.round(d.raw - (i - 2) * 0.2) + 0.1 + i * 0.2,
             palette: T.PALETTES_7K[name] || T.PALETTES_7K["Gamma"], prism: true, fixed: numbered };
  }

  function headlineFor(r, danMode) {
    // 6K/8K have no other ruler; 7K keeps its own unless Prism is picked.
    if (r.prism && (danMode.startsWith("prism") || r.tier_7k == null)) return prismHeadline(r.prism, danMode);
    if (r.mode === "7k" || r.tier_7k != null) {
      return { label: r.tier_7k, sub: r.sublevel_7k, dp: r.dp_7k,
               palette: T.PALETTES_7K[r.tier_7k] || T.PALETTES_7K["Gamma"], is7k: true,
               fixed: /^\d/.test(r.tier_7k) };
    }
    const alt = danMode === "ln" ? r.ln_course : r[danMode];
    if (danMode === "ln" && alt)
      return { label: alt.label, sub: alt.ln_family_label || alt.short, dp: alt.dp_ln, beyond: alt.beyond,
               palette: T.LN_COURSE_PALETTES[alt.stage_key] || T.LN_COURSE_PALETTES["1st"] };
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
    const options = danOptions(r);
    const mode = resolveMode(r, options);

    const h = headlineFor(r, mode);
    applyPalette(h.palette);
    setWatermark(h.fellBack ? "reform" : mode, r);

    const name = h.label || "—";
    $("danName").textContent = name;
    // Long labels (Celestial tiers, Signicial stages) would run into the metrics
    // box at the enlarged size — step the size down as the name grows.
    const nameEl = $("danName");
    nameEl.classList.toggle("is-static", !!h.fixed);
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
    const tm = r.prism && r.prism.msd;
    const chips = tm ? Object.keys(PRISM_LBL).map((k) => [PRISM_LBL[k], Number(tm[k] || 0)])
      : Object.keys(LBL).map((k) => [LBL[k], Number(ss[k] || 0)]);
    const top = chips.sort((a, b) => b[1] - a[1]).filter((x) => x[1] > 0).slice(0, 2).map((x) => x[0]);
    $("chartFamily").textContent = top.length ? top.join(" · ") : (r.family ? String(r.family).toUpperCase() : "");

    // Intensity bar is the LOW→HIGH sublevel gauge: position within the current
    // tier = fractional part of DP (same rule the engine uses for the sublevel
    // label — SUBLEVEL_LABELS in danEngine). Whole-number part = which tier.
    const dpv = Number(h.dp) || 0;
    const frac = dpv >= 1 || h.prism ? dpv - Math.floor(dpv) : 0;
    const pct = Math.max(0, Math.min(100, frac * 100));
    $("intensityFill").style.width = pct + "%";
    $("intensityThumb").style.left = pct + "%";

    // Metrics: MSD (MinaCalc on 4K, Prism on 6K-8K) · LN · Quaver. LN is only
    // above 0 when the chart passes the site's LN threshold.
    const metrics = [[tm ? tm.Overall : r.overall_msd, "MSD"], [tm && tm.LN, "LN"], [r.quaver_rating, "QSR"]]
      .filter((m) => Number(m[0]) > 0);
    $("danMetrics").textContent = metrics.length ? metrics.map((m) => n2(m[0])).join(" · ") : "--.-";
    $("danMetrics").style.fontSize = metrics.length > 2 ? "32px" : "";
    document.querySelector(".msd-unit").textContent = metrics.length ? metrics.map((m) => m[1]).join(" · ") : "QSR";

    $("mapSr").textContent = (Number(r.sr) > 0 ? Number(r.sr).toFixed(2) : "--") + "★";
    $("mapBpm").textContent = (r.bpm ? Math.round(r.bpm) : "--") + " BPM";
    $("mapOd").textContent = "OD " + (Number(r.od) > 0 ? Number(r.od).toFixed(1) : "--");
    $("mapDuration").textContent = r.duration_s ? fmtTime(r.duration_s) : "--:--";

    $("modBadge").textContent = prefs.mod !== "NM" ? prefs.mod : "";
    const badge = $("scoringModeBadge");
    const active = h.fellBack ? "reform" : mode;
    badge.textContent = `◇ Mode: ${options.find((o) => o[0] === active)[1]}`;
    badge.dataset.mode = active;
    setDanSelect(options, active);

    shown = { r, h, family: top[0] || "" };
    $("exportBtn").disabled = false;
    setLoading(false);
  }

  /* ── Chart export ────────────────────────────────────────────────── */
  // assets.ppy.sh sends no CORS headers, so the cover has to be fetched with the
  // extension's host permission: drawing it directly would taint the canvas.
  async function coverDataUrl() {
    try {
      const res = await fetch(`https://assets.ppy.sh/beatmaps/${setId}/covers/cover@2x.jpg`);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) { return null; } // the chart falls back to its plain background
  }

  function chartNotes() {
    const lines = osuText.slice(osuText.indexOf("[HitObjects]")).split(/\r?\n/).slice(1);
    const notes = [];
    let lns = 0;
    for (const line of lines) {
      const p = line.split(",");
      if (p.length < 4) continue;
      notes.push(Number(p[2]));
      if (Number(p[3]) & 128) lns++;
    }
    return { notes, lns };
  }

  window.setChartGenerating = (on) => {
    $("exportBtn").disabled = on;
    $("exportBtn").classList.toggle("is-busy", on);
  };

  async function exportChart() {
    const { r, h, family } = shown;
    const rate = MOD_RATE[prefs.mod];
    const tm = r.prism && r.prism.msd;
    const field = (k) => ((new RegExp(`^${k}:\\s*(.*?)\\s*$`, "m").exec(osuText) || [])[1] || "");
    const { notes, lns } = chartNotes();
    window.setChartGenerating(true);
    renderExportChart({
      ...chartDensity(notes, rate),
      key_count: Math.round(Number(field("CircleSize"))),
      dan_short: h.dp == null ? "" : h.label, // no badge for "No dan"
      dan_sublevel: h.sub,
      family,
      overall_msd: Number(tm ? tm.Overall : r.overall_msd) || 0,
      skillsets: r.skillsets || {},
      skill_rows: tm ? Object.keys(PRISM_LBL).filter((k) => k !== "LN" || tm.LN > 0).map((k) => ({
        l: PRISM_LBL[k][0] + PRISM_LBL[k].slice(1).toLowerCase(), v: Number(tm[k]) || 0 })) : null,
      bg_image: await coverDataUrl(),
      rate_label: prefs.mod === "NM" ? "" : `${prefs.mod} ${rate}x`,
      parsed_meta: {
        bpm: (r.bpm || 0) * rate, od: r.od, note_count: notes.length, ln_count: lns,
        drain_time_s: (r.duration_s || 0) / rate, sr_official: r.sr || 0,
        artist: field("Artist"), title: field("Title"), version: field("Version"), creator: field("Creator")
      }
    });
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
    if (!r || r.error) { setLoading(true, "osu!mania 4K/6K/7K/8K only"); return; }
    if (r.tier_7k != null || r.mode === "prism") r.prism = window.__DANCALC.estimate(osuText, MOD_RATE[prefs.mod]);
    if (r.mode === "prism" && !r.prism) { setLoading(true, "Prism unavailable"); return; }
    render(r);
  }

  function waitForMsd(timeoutMs) {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;
      (function poll() {
        if (window.__MINACALC && window.__MINACALC.ready && window.__DANCALC.ready) return resolve(true);
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
    const modOptions = [["NM", "NM"], ["DT", "DT"], ["HT", "HT"]];
    setSeg("segMod", modOptions, prefs.mod);

    $("segMod").addEventListener("click", (e) => {
      if (!e.target.dataset.value) return;
      prefs.mod = e.target.dataset.value;
      chrome.storage.local.set({ mod: prefs.mod });
      setSeg("segMod", modOptions, prefs.mod);
      compute(); // rate change → re-analyze
    });
    $("doDanMode").addEventListener("change", (e) => {
      prefs.danMode = e.target.value;
      userPickedMode = true; // manual pick wins over LN auto-switch
      chrome.storage.local.set({ danMode: prefs.danMode });
      compute(); // system change → just re-render
    });
    $("exportBtn").addEventListener("click", exportChart);

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
