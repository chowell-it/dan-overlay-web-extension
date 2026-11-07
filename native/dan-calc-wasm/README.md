# dan-calc-wasm

Source for `engine/dancalc.wasm`: Mania Tracker's
[dan-calc and Prism](https://github.com/aleju03/mania-hub/tree/main/algorithms)
compiled for the browser. It gives 6K/7K dans plus Prism MSD and the LN rating
on 6K/7K/8K.

The upstream commit is pinned by `rev` in `Cargo.toml` and `ett-stub/Cargo.toml`.
Update both together, then rebuild.

`ett-stub` replaces `leoblack-ett`, because wasmtime can't run in a browser. That
is safe only for keymodes rated by Prism, which never call MinaCalc. Don't send
4K charts to this build: it returns no MSD for them.

## Build

```sh
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/dan_calc_wasm.wasm ../../engine/dancalc.wasm
```
