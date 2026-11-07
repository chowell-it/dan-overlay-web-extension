//! Stand-in for leoblack-ett: same surface chart-pipeline uses, no wasmtime.
//! Every call fails, so a chart that reached MinaCalc yields no MSD rather
//! than a wrong one. 6K-8K never get here: compute_msd routes them to Prism.
pub use leoblack_parser::OsuFileParser;

pub const DISPLAY_SKILLSET_ORDER: [&str; 8] =
    ["Stream", "Jumpstream", "Handstream", "Stamina", "JackSpeed", "Chordjack", "Technical", "Overall"];

#[derive(Debug, Clone, Default)]
pub struct EttOptions {
    pub music_rate: f64,
    pub score_goal: f64,
    pub key_override: Option<f64>,
    pub cvt_flag: Option<String>,
    pub etterna_version: Option<String>,
    pub ln_tail_taps: bool,
}

pub struct EttVersionKey;
impl EttVersionKey {
    pub fn key(&self) -> &'static str {
        "unavailable"
    }
}

pub struct EttResult {
    pub etterna_version: Option<EttVersionKey>,
    pub values: [f64; 8],
}

#[derive(Debug)]
pub struct EttError;

pub fn analyze_etterna_from_parsed(_chart: OsuFileParser, _options: &EttOptions) -> Result<EttResult, EttError> {
    Err(EttError)
}
