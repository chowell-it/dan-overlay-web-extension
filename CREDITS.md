# Credits & third-party components

This extension is a derivative work of **Dan Overlay**, itself built on open
difficulty models. Everything below ships inside the extension bundle.

## Dan Overlay (upstream)

The dan-tier estimation (Reform / Celestial / Signicial / Shoegazer rulers, the
7K ruler, and the pattern classifier) originates from **Dan Overlay** by
[acarranzao1a-png](https://github.com/acarranzao1a-png/Dan-Overlay). The logic in
`engine/danEngine.js` is a TypeScript reimplementation validated 1:1 against the
original engine's outputs.

Application icon (`icons/`) is derived from Dan Overlay's `graph.ico`, recomposited
onto a dark tile for toolbar legibility.

## MinaCalc (MSD)

`engine/minacalc.js` is **MinaCalc**, the difficulty calculator from
[Etterna](https://github.com/etternagame/etterna), compiled to WebAssembly.
Etterna is distributed under the MIT License. MSD values are 4K-only.

## Quaver difficulty rating

The Quaver rating is a port of `DifficultyProcessorKeys` from
[Quaver.API](https://github.com/Quaver/Quaver) (MIT License), validated 1:1
against the reference implementation across 4K and 7K.

## osu! data

Beatmap `.osu` files are fetched from `https://osu.ppy.sh/osu/{id}` at the user's
request. osu! and its beatmap content belong to ppy Pty Ltd. This extension is
unofficial and not affiliated with or endorsed by ppy.

## Privacy

No data is collected, transmitted, or shared. The only network request is the
same-origin fetch of the `.osu` file for the beatmap you are viewing. The only
stored state is two UI preferences (`mod`, `danMode`) in `chrome.storage.local`,
which never leaves your browser.
