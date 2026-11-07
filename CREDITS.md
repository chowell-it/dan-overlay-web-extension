# Credits & third-party components

This extension is a derivative work of **Dan Overlay**, itself built on open
difficulty models. Everything below ships inside the extension bundle.

## Dan Overlay (upstream)

The dan-tier estimation (Reform / Celestial / Signicial / Shoegazer rulers, the
7K ruler, and the pattern classifier) originates from **Dan Overlay** by
[acarranzao1a-png](https://github.com/acarranzao1a-png/Dan-Overlay). The logic in
`engine/danEngine.js` is a TypeScript reimplementation validated 1:1 against the
original engine's outputs.

`engine/chart-renderer.js`, the note density chart export, is adapted from Dan
Overlay's `chart_renderer.js` and `chart_export.py`.

Application icon (`icons/`) is derived from Dan Overlay's `graph.ico`, recomposited
onto a dark tile for toolbar legibility.

## MinaCalc (MSD)

`engine/minacalc.js` is **MinaCalc**, the difficulty calculator from
[Etterna](https://github.com/etternagame/etterna), compiled to WebAssembly.
Etterna is distributed under the MIT License. It rates 4K only here.

## Mania Tracker dan-calc and Prism

`engine/dancalc.wasm` is compiled from the `dan-calc` and Prism code in
[aleju03/mania-hub](https://github.com/aleju03/mania-hub) (MIT License) by
aleju03. It provides 6K/7K dans and the Prism MSD and LN ratings on 6K-8K. Its
`leoblack-*` crates are ported from
[LeoBlackMT/osumania_map_analyser](https://github.com/LeoBlackMT/osumania_map_analyser)
(MIT License). Build source and the pinned commit are in `native/dan-calc-wasm/`.

## Quaver difficulty rating

The Quaver rating is a port of `DifficultyProcessorKeys` from
[Quaver.API](https://github.com/Quaver/Quaver.API) (Mozilla Public License 2.0), validated 1:1
against the reference implementation across 4K and 7K.

## osu! data

Beatmap `.osu` files are fetched from `https://osu.ppy.sh/osu/{id}` at the user's
request. osu! and its beatmap content belong to ppy Pty Ltd. This extension is
unofficial and not affiliated with or endorsed by ppy.

## Privacy

No data is collected, transmitted, or shared. The only network requests are the
fetch of the `.osu` file for the beatmap you are viewing and that beatmap's cover
image from `assets.ppy.sh`. The only
stored state is two UI preferences (`mod`, `danMode`) in `chrome.storage.local`,
which never leaves your browser.
