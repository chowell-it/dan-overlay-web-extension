//! C ABI over dan_calc::estimate. The result is a JSON string.
use dan_calc::{estimate, Dan, Family, Options};

#[no_mangle]
pub extern "C" fn dc_alloc(n: usize) -> *mut u8 {
    let mut v = Vec::<u8>::with_capacity(n);
    let p = v.as_mut_ptr();
    std::mem::forget(v);
    p
}

#[no_mangle]
pub extern "C" fn dc_free(p: *mut u8, n: usize) {
    unsafe { drop(Vec::from_raw_parts(p, 0, n)) }
}

/// Returns a pointer to the JSON and writes its length to `out_len`.
#[no_mangle]
pub extern "C" fn dc_estimate(ptr: *const u8, len: usize, rate: f64, out_len: *mut usize) -> *mut u8 {
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    let mut json = estimate_json(&String::from_utf8_lossy(bytes), rate).into_bytes();
    json.shrink_to_fit();
    unsafe { out_len.write_unaligned(json.len()) }; // dc_alloc only promises byte alignment
    let p = json.as_mut_ptr();
    std::mem::forget(json);
    p
}

fn esc(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

// NaN/inf are not valid JSON.
fn num(v: f64) -> String {
    if v.is_finite() { format!("{v:?}") } else { "null".into() }
}

fn dan_json(d: &Option<Dan>) -> String {
    let Some(d) = d else { return "null".into() };
    format!(
        "{{\"display\":{},\"label\":{},\"variant\":{},\"raw\":{},\"ln\":{},\"confidence\":{},\"source\":{}}}",
        esc(&d.display_name),
        esc(&d.label),
        d.variant.map_or("null".into(), |v| esc(v)),
        num(d.raw_dan),
        matches!(d.family, Family::Ln),
        num(d.confidence),
        esc(d.source),
    )
}

pub fn estimate_json(osu: &str, rate: f64) -> String {
    match estimate(osu, &Options { rate, ..Default::default() }) {
        Err(e) => format!("{{\"error\":{}}}", esc(&e.to_string())),
        Ok(e) => {
            let msd = e.msd.as_ref().map_or("null".into(), |m| {
                let items: Vec<String> = m.iter().map(|(k, v)| format!("{}:{}", esc(k), num(*v))).collect();
                format!("{{{}}}", items.join(","))
            });
            format!(
                "{{\"key_count\":{},\"supported\":{},\"primary\":{},\"rice\":{},\"ln\":{},\"msd\":{},\"ln_ratio\":{}}}",
                e.key_count, e.supported, dan_json(&e.primary), dan_json(&e.rice), dan_json(&e.ln), msd, num(e.ln_ratio),
            )
        }
    }
}
