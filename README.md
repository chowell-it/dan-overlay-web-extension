# Dan Overlay for osu!web

Browser extension that shows the estimated **osu!mania dan tier**, **MSD** and
**Quaver rating** for the beatmap you're looking at — rendered with the exact same
panel UI as the tosu counter. Everything is computed in your browser: no server,
no API key, no account linking.

Click the toolbar icon on any beatmap page to open the panel.

## How it works

1. The popup reads the active tab's URL to find the selected difficulty's beatmap ID.
2. It fetches that difficulty's raw `.osu` from `https://osu.ppy.sh/osu/{id}`
   (hence the `osu.ppy.sh` host permission).
3. The bundled engine (`engine/danEngine.js`) computes the dan tier, Quaver rating
   and MSD. MSD comes from MinaCalc compiled to WebAssembly (`engine/minacalc.js`,
   binary embedded — nothing extra to fetch). 6K-8K use Mania Tracker's dan-calc
   and Prism, also compiled to WebAssembly (`engine/dancalc.wasm`).
4. The result is drawn into the counter's own markup + `style.css`.

## Identical UI

The panel is not a lookalike — it is the counter's markup and stylesheet:

- `style.css`, `images/`, `celestial_images/`, `signicial_images/` are copied
  from `release/dan-overlay-port/`.
- `popup.html` reuses the counter's panel DOM (same ids/classes).
- `theme.js` contains the palette tables, watermark lookup tables and colour
  helpers **extracted verbatim** from the counter's `overlay.js`, so tier colours,
  gradients and greek-letter watermarks match exactly.

If the counter's palettes or styles change, re-copy those files and re-extract
`theme.js` rather than hand-editing.

## Controls

One row under the panel:

- **Dan rating** — a dropdown listing only what the open chart has. 4K: Reform /
  Celestial / Signicial / Shoegazer, plus LN on LN charts (Reform is then the rice
  rating). 7K: 7K Ruler / Prism. 6K-8K charts that pass the LN threshold split
  Prism into Prism Rice / Prism LN. LN maps open on their LN rating.
- **Rate** — NM (1.0x) / DT (1.5x) / HT (0.75x)
- **Chart button** — downloads a note density chart as a PNG, using the dan and
  rate on screen.

Dan rating and rate persist via `chrome.storage.local`. Changing the rate
re-analyses; changing the rating system just re-renders (the `.osu` is cached per map).

## Install (unpacked)

**Chrome / Edge** — `chrome://extensions` → enable **Developer mode** →
**Load unpacked** → select this folder.

**Firefox** — `about:debugging#/runtime/this-firefox` →
**Load Temporary Add-on…** → select `manifest.json`.

Then open a beatmap, e.g. `https://osu.ppy.sh/beatmapsets/<set>#mania/<id>`,
and click the toolbar icon.

## Notes

- **4K** shows the dan tier with MSD · QSR. MinaCalc stays on 0.72.x, the version
  Mania Tracker also uses for 4K.
- **7K** keeps its own SR ruler and adds Prism MSD. Pick **Prism** to see Mania
  Tracker's 7K dan instead.
- **6K** shows Mania Tracker's dan with Prism MSD. **8K** shows Prism MSD only:
  Mania Tracker's public code has no 8K dan table. QSR is hidden on both, because
  the Quaver port is only validated on 4K and 7K.
- **LN** appears next to MSD on 6K-8K only when the chart passes Mania Tracker's
  LN threshold.
- Celestial / Signicial / Shoegazer are MSD-derived and therefore 4K-only; on a
  7K map the 7K ruler is shown instead.
- Numeric dans (1st–10th) have no watermark image; the greek-lettered beyond-dans
  (Alpha–Kappa) do. This matches the counter.
- Non-mania and unsupported key modes report "osu!mania 4K/6K/7K/8K only".

## Layout

```
manifest.json        MV3 manifest (Chrome + Firefox), popup-only
popup.html           the counter's panel markup + the two selectors
popup.js             beatmap detection, .osu fetch, render, theming
popup.css            popup shell sizing only
style.css            copied from the counter (do not edit here)
theme.js             palettes + watermark tables extracted from overlay.js
engine/
  danEngine.js       bundled dan/Quaver engine (window.DanEngine.analyze)
  minacalc.js        MinaCalc WASM (embedded binary)
  minacalc-glue.js   exposes window.__MINACALC.msd()
  dancalc.wasm       Mania Tracker dan-calc + Prism (6K-8K)
  dancalc-glue.js    exposes window.__DANCALC.estimate()
  chart-renderer.js  note density chart export, from Dan Overlay
native/dan-calc-wasm/  source and build steps for dancalc.wasm
images/ celestial_images/ signicial_images/    watermark art
```

Engine source lives in the [Dan Overlay tosu port](https://github.com/chowell-it/DanOverlay-tosu-port)
(`port/`); rebuild with `bash port/build-engine.sh <out>`, copy into `engine/`,
then re-append `window.DanEngine = DanEngine;` (content/popup scripts don't share
top-level scope with the bundle's `var`).
