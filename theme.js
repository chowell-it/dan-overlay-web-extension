// Palette tables and colour helpers extracted verbatim from the tosu
// counter's overlay.js so the popup themes identically. Do not edit by
// hand — re-extract if the counter's palettes change.
(function () {
const DAN_PALETTES = {
  "1st Dan": ["rgb(118,199,255)", "rgb(231,244,255)"],
  "2nd Dan": ["rgb(113,180,255)", "rgb(196,236,255)"],
  "3rd Dan": ["rgb(115,166,255)", "rgb(180,224,255)"],
  "4th Dan": ["rgb(120,155,255)", "rgb(168,205,255)"],
  "5th Dan": ["rgb(139,152,255)", "rgb(211,224,255)"],
  "6th Dan": ["rgb(166,146,255)", "rgb(238,221,255)"],
  "7th Dan": ["rgb(196,143,255)", "rgb(255,226,239)"],
  "8th Dan": ["rgb(235,160,114)", "rgb(255,224,163)"],
  "9th Dan": ["rgb(255,175,99)", "rgb(255,235,170)"],
  "10th Dan": ["rgb(255,199,108)", "rgb(255,248,200)"],
  Alpha: ["rgb(70,60,180)", "rgb(220,65,80)", "rgb(245,225,45)"],
  Beta: ["rgb(255,245,180)", "rgb(255,165,0)"],
  Gamma: ["rgb(255,0,0)", "rgb(0,60,255)", "rgb(0,255,90)"],
  Delta: ["rgb(95,60,125)", "rgb(215,130,50)"],
  Epsilon: ["rgb(215,45,95)", "rgb(30,80,150)", "rgb(245,240,215)"],
  Zeta: ["rgb(240,130,105)", "rgb(130,190,225)"],
  Eta: ["rgb(145,0,0)", "rgb(200,80,70)"],
  Theta: ["rgb(105,5,5)", "rgb(170,65,55)"],
  Iota: ["rgb(75,10,10)", "rgb(145,50,50)"],
  Kappa: ["rgb(125,125,125)", "rgb(190,190,200)"]
};

const PALETTES_7K = {
  "0th Dan": ["rgb(180,185,210)", "rgb(130,135,185)", "rgb(200,210,240)"],
  "1st Dan": ["rgb(0,75,100)", "rgb(0,180,180)", "rgb(100,245,185)"],
  "2nd Dan": ["rgb(160,40,240)", "rgb(255,20,147)", "rgb(40,10,80)"],
  "3rd Dan": ["rgb(100,10,30)", "rgb(220,80,20)", "rgb(255,160,50)"],
  "4th Dan": ["rgb(5,60,45)", "rgb(0,255,120)", "rgb(180,255,50)"],
  "5th Dan": ["rgb(15,15,110)", "rgb(115,20,180)", "rgb(255,40,150)"],
  "6th Dan": ["rgb(140,40,10)", "rgb(255,190,0)", "rgb(255,250,220)"],
  "7th Dan": ["rgb(15,15,20)", "rgb(180,185,200)", "rgb(120,40,255)"],
  "8th Dan": ["rgb(60,5,30)", "rgb(220,10,70)", "rgb(0,240,255)"],
  "9th Dan": ["rgb(10,5,5)", "rgb(255,60,0)", "rgb(255,210,0)"],
  "10th Dan": ["rgb(100,0,220)", "rgb(0,255,150)", "rgb(240,245,255)"],
  "Gamma": ["rgb(0,255,170)", "rgb(10,50,120)", "rgb(180,0,255)"],
  "Azimuth": ["rgb(255,90,0)", "rgb(200,20,60)", "rgb(255,230,150)"],
  "Zenith": ["rgb(240,245,255)", "rgb(100,110,130)", "rgb(0,100,255)"],
  "Stellium": ["rgb(255,0,128)", "rgb(140,50,255)", "rgb(0,255,255)"],
  "Beyond Stellium": ["rgb(255,0,128)", "rgb(140,50,255)", "rgb(0,255,255)"]
};

const DAN_NAMES = Object.keys(DAN_PALETTES).sort((a, b) => b.length - a.length);

// ── Celestial tiers ───────────────────────────────────────────────────────────
const CELESTIAL_PALETTES = {
  "Beginner": ["rgb(138,130,255)", "rgb(200,197,255)"],
  "Intermediate": ["rgb(76,175,80)", "rgb(178,223,180)"],
  "Expert": ["rgb(255,193,7)", "rgb(255,235,150)"],
  "Mastery": ["rgb(255,112,67)", "rgb(255,200,175)"],
  "Ascension": ["rgb(229,57,53)", "rgb(255,160,158)"],
  "Transcendence": ["rgb(171,71,188)", "rgb(230,180,238)"],
  "Singularity": ["rgb(220,220,220)", "rgb(255,255,255)"],
};

const CELESTIAL_PNG = {
  "Beginner": "Beginner",
  "Intermediate": "Intermediate",
  "Expert": "Expert",
  "Mastery": "Mastery",
  "Ascension": "Ascension",
  "Transcendence": "Transcendence",
  "Singularity": "Singularity",
};

const GREEK_PNG = {
  "Alpha": "11-alpha", "Beta": "12-beta", "Gamma": "13-gamma",
  "Delta": "14-delta", "Epsilon": "15-epsilon", "Zeta": "16-zeta",
  "Eta": "17-eta", "Theta": "18-theta", "Iota": "19-iota", "Kappa": "20-kappa",
};

// Signicial Greek symbol images (background for stages XI+)
const SIGNICIAL_PNG = {
  "XI": "Stage11icon",           // Alpha
  "XII": "Stage12icon",          // Beta
  "XIII": "Stage13icon",         // Gamma
  "XIV": "Stage14icon",          // Delta
  "LastStage": "Stage15icon",    // Epsilon
  "ExtraStageI": "EX1icon",      // Zeta
  "ExtraStageII": "EtaIcon",     // Eta
  "ExtraStageIII": "ThetaIcon",  // Theta
};

// ── Signicial stages ──────────────────────────────────────────────────────────
// HSL-based saturation boost helper (for Alpha-Zeta: Reform colors +5% sat)
function _saturateColor(colorStr, deltaPct) {
  const [r, g, b] = parseRGB(colorStr);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = (((gn - bn) / d) % 6) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
    if (h < 0) h += 360;
  }
  s = Math.min(1, s + deltaPct / 100);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  const sec = Math.floor(h / 60) % 6;
  if (sec === 0) { r1 = c; g1 = x; b1 = 0; }
  else if (sec === 1) { r1 = x; g1 = c; b1 = 0; }
  else if (sec === 2) { r1 = 0; g1 = c; b1 = x; }
  else if (sec === 3) { r1 = 0; g1 = x; b1 = c; }
  else if (sec === 4) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }
  return `rgb(${Math.round((r1 + m) * 255)},${Math.round((g1 + m) * 255)},${Math.round((b1 + m) * 255)})`;
}

// Stage I-X: exact colors from the official CSS gradients
// Stage XI-XVI (Alpha-Zeta): Reform colors + 5% saturation (computed at load)
const SIGNICIAL_PALETTES = {
  "I": ["rgb(232,232,232)", "rgb(154,154,154)"],   // Prelude
  "II": ["rgb(165,242,211)", "rgb(0,128,128)"],     // Abnormality
  "III": ["rgb(220,232,245)", "rgb(49,97,139)"],     // Termination
  "IV": ["rgb(217,191,255)", "rgb(74,0,130)"],      // Resuscitation
  "V": ["rgb(255,248,178)", "rgb(214,123,30)"],    // Disturbance
  "VI": ["rgb(186,205,255)", "rgb(56,41,122)"],     // Revitalization
  "VII": ["rgb(255,69,0)", "rgb(255,215,0)", "rgb(50,205,50)", "rgb(0,255,255)"],  // Motivation
  "VIII": ["rgb(92,147,255)", "rgb(20,0,64)"],        // Misfortune
  "IX": ["rgb(255,255,255)", "rgb(92,92,92)"],      // Catastrophe
  "X": ["rgb(255,102,178)", "rgb(139,0,42)"],      // Finale
  // Greek stages: Reform palette + 5% saturation
  "XI": DAN_PALETTES["Alpha"].map(c => _saturateColor(c, 5)),
  "XII": DAN_PALETTES["Beta"].map(c => _saturateColor(c, 5)),
  "XIII": DAN_PALETTES["Gamma"].map(c => _saturateColor(c, 5)),
  "XIV": DAN_PALETTES["Delta"].map(c => _saturateColor(c, 5)),
  "LastStage": DAN_PALETTES["Epsilon"].map(c => _saturateColor(c, 5)),
  "ExtraStageI": DAN_PALETTES["Zeta"].map(c => _saturateColor(c, 5)),
  // Signicial Eta: royal blue → pure red gradient
  "ExtraStageII": ["rgb(0,41,134)", "rgb(255,0,0)"],
  // Signicial Theta: crimson → cobalt blue gradient
  "ExtraStageIII": ["rgb(168,0,15)", "rgb(0,3,117)"],
};

// ── Shoegazer palettes (12 stages: 1st-10th Dan, Luminal, Tachyon) ──────────
const SHOEGAZER_PALETTES = {
  "1st": ["rgb(255,183,197)", "rgb(135,206,235)"],           // Pastel pink → sky blue
  "2nd": ["rgb(144,238,144)", "rgb(34,139,34)"],            // Light green → forest
  "3rd": ["rgb(180,160,220)", "rgb(75,0,130)"],             // Lavender → indigo
  "4th": ["rgb(255,223,128)", "rgb(204,102,0)"],            // Gold → burnt orange
  "5th": ["rgb(135,206,250)", "rgb(0,51,102)"],             // Light blue → deep navy
  "6th": ["rgb(255,120,120)", "rgb(139,0,0)"],              // Salmon → dark red
  "7th": ["rgb(0,230,230)", "rgb(0,80,80)"],                // Teal → dark teal
  "8th": ["rgb(180,130,255)", "rgb(60,0,100)"],             // Violet → deep purple
  "9th": ["rgb(210,210,210)", "rgb(60,60,60)"],             // Silver → charcoal
  "10th": ["rgb(200,50,80)", "rgb(60,0,20)"],                // Crimson → deep maroon
  "Luminal": ["rgb(220,240,255)", "rgb(100,180,255)", "rgb(200,200,200)"],  // Ethereal white-blue
  "Tachyon": ["rgb(100,120,255)", "rgb(40,0,80)", "rgb(0,0,0)"],            // Deep blue-purple → void
};

// ── LN Course palettes (16 stages: 1st-10th Dan, Yoake-Yokaze) ─────────────
const LN_COURSE_PALETTES = {
  "1st": ["rgb(200,230,255)", "rgb(120,175,230)"],           // Ice blue
  "2nd": ["rgb(180,230,180)", "rgb(60,160,60)"],             // Mint → green
  "3rd": ["rgb(230,200,255)", "rgb(130,80,200)"],            // Soft lilac → violet
  "4th": ["rgb(255,220,160)", "rgb(200,130,40)"],            // Warm sand → amber
  "5th": ["rgb(160,220,255)", "rgb(30,100,180)"],            // Sky → ocean blue
  "6th": ["rgb(255,175,175)", "rgb(180,40,40)"],             // Blush → crimson
  "7th": ["rgb(120,240,220)", "rgb(0,120,100)"],             // Aqua → dark teal
  "8th": ["rgb(200,160,255)", "rgb(80,20,140)"],             // Amethyst → deep violet
  "9th": ["rgb(220,220,220)", "rgb(90,90,100)"],             // Steel grey → charcoal
  "10th": ["rgb(255,160,200)", "rgb(140,20,80)"],             // Rose → deep magenta
  "Yoake": ["rgb(255,200,120)", "rgb(200,100,0)"],             // Dawn gold
  "Yuugure": ["rgb(255,140,100)", "rgb(160,40,80)"],             // Sunset glow
  "Yoru": ["rgb(100,100,200)", "rgb(20,20,80)"],              // Twilight indigo
  "Yami": ["rgb(80,60,120)", "rgb(15,5,40)"],               // Deep darkness
  "Yume": ["rgb(200,150,255)", "rgb(100,0,180)", "rgb(255,200,220)"],  // Dreamscape
  "Yokaze": ["rgb(160,200,240)", "rgb(40,60,100)", "rgb(200,220,255)"],  // Night wind
};

function paletteForDan(danName) {
  return DAN_PALETTES[danName] || DAN_PALETTES["4th Dan"];
}

function paletteToGradient(palette) {
  if (!palette || !palette.length) {
    return "linear-gradient(90deg, rgb(120,155,255), rgb(168,205,255))";
  }
  return `linear-gradient(90deg, ${palette.join(", ")})`;
}

function paletteMidColor(palette) {
  if (!palette || !palette.length) {
    return "rgb(120,155,255)";
  }
  return palette[Math.floor(palette.length / 2)];
}

function parseRGB(colorStr) {
  const m = String(colorStr).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [120, 155, 255];
}

// Relative luminance (0 = black, 1 = white) per WCAG formula
function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

  window.DanTheme = {
    DAN_PALETTES, PALETTES_7K, CELESTIAL_PALETTES, SIGNICIAL_PALETTES,
    SHOEGAZER_PALETTES, LN_COURSE_PALETTES,
    GREEK_PNG, CELESTIAL_PNG, SIGNICIAL_PNG,
    paletteForDan, paletteToGradient, paletteMidColor, parseRGB, relativeLuminance
  };
})();
