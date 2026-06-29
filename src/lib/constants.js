// ── Constants & Helpers ──

export const STEP_COUNT = 16;

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Pentatonic: [0, 3, 5, 7, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
};

export const DRUM_NAMES = {
  kick: 'Kick',
  snare: 'Snare',
  clap: 'Clap',
  hihat: 'Hi-Hat',
  openhat: 'Open Hat',
  tom: 'Tom',
  rim: 'Rim',
  cowbell: 'Cowbell',
};

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function stepsFrom(indices) {
  const arr = new Array(STEP_COUNT).fill(false);
  for (const i of indices) {
    if (i >= 0 && i < STEP_COUNT) arr[i] = true;
  }
  return arr;
}

export const COLORS = {
  kick:    { color: 'from-[oklch(0.65_0.24_25)] to-[oklch(0.7_0.22_55)]',  accent: 'oklch(0.66 0.24 25)' },
  snare:   { color: 'from-[oklch(0.65_0.24_350)] to-[oklch(0.55_0.22_300)]', accent: 'oklch(0.66 0.24 350)' },
  clap:    { color: 'from-[oklch(0.7_0.22_55)] to-[oklch(0.75_0.18_60)]',    accent: 'oklch(0.72 0.2 55)' },
  hihat:   { color: 'from-[oklch(0.7_0.18_180)] to-[oklch(0.7_0.18_200)]',   accent: 'oklch(0.72 0.16 195)' },
  openhat: { color: 'from-[oklch(0.75_0.18_60)] to-[oklch(0.7_0.18_180)]',   accent: 'oklch(0.78 0.16 75)' },
  tom:     { color: 'from-[oklch(0.55_0.22_300)] to-[oklch(0.65_0.24_350)]', accent: 'oklch(0.6 0.22 300)' },
  bass:    { color: 'from-[oklch(0.6_0.22_350)] to-[oklch(0.55_0.22_300)]',  accent: 'oklch(0.62 0.2 330)' },
  lead:    { color: 'from-[oklch(0.7_0.18_200)] to-[oklch(0.7_0.18_180)]',   accent: 'oklch(0.74 0.16 205)' },
  audio:   { color: 'from-[oklch(0.5_0.2_280)] to-[oklch(0.6_0.22_320)]',    accent: 'oklch(0.55 0.2 300)' },
};

export const PATTERNS = {
  'Boom Bap': {
    kick: [0, 3, 8, 11],
    snare: [4, 12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
    openhat: [14],
    clap: [12],
    bass: [0, 3, 6, 8, 11, 14],
    lead: [0, 4, 7, 8, 12, 15],
  },
  House: {
    kick: [0, 4, 8, 12],
    clap: [4, 12],
    hihat: [2, 6, 10, 14],
    openhat: [2, 6, 10, 14],
    bass: [0, 2, 4, 6, 8, 10, 12, 14],
    lead: [0, 3, 6, 10, 13],
  },
  Trap: {
    kick: [0, 6, 10],
    snare: [8],
    hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15],
    openhat: [11],
    bass: [0, 6, 10],
    lead: [0, 4, 8, 11, 14],
  },
  'Four on the Floor': {
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    clap: [4, 12],
    hihat: [2, 6, 10, 14],
    tom: [15],
    bass: [0, 2, 4, 6, 8, 10, 12, 14],
    lead: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  'Lo-Fi': {
    kick: [0, 7, 10],
    snare: [4, 12],
    hihat: [0, 3, 6, 8, 11, 14],
    bass: [0, 7, 10],
    lead: [2, 6, 9, 13],
  },
  Empty: {},
};

// Piano keyboard mapping
export const KEY_MAP = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8,
  h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16,
};

export const BLACK_SET = new Set([1, 3, 6, 8, 10]);
