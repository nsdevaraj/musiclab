import { COLORS, PATTERNS, STEP_COUNT, stepsFrom } from './constants';

export function buildStepTrack(id, name, drum, waveform, octave, arp, pattern) {
  const c = drum ? COLORS[drum] : COLORS.lead;
  return {
    id,
    name,
    kind: 'step',
    drum: drum || undefined,
    waveform: waveform || undefined,
    octave: octave || 3,
    arp: arp || false,
    steps: stepsFrom(pattern || []),
    volume: 0.8,
    muted: false,
    solo: false,
    color: c.color,
    accent: c.accent,
  };
}

export function createAudioTrack(id, name) {
  const c = COLORS.audio;
  return {
    id,
    name: name || 'Audio Track',
    kind: 'audio',
    buffer: null,
    blobUrl: null,
    volume: 0.85,
    muted: false,
    solo: false,
    pan: 0,
    color: c.color,
    accent: c.accent,
    isRecording: false,
    duration: 0,
  };
}

export function defaultProject() {
  const p = PATTERNS['Boom Bap'];
  return {
    name: 'My Project',
    bpm: 92,
    swing: 0.18,
    masterVolume: 0.85,
    keyRoot: 9,
    scale: 'Minor',
    tracks: [
      buildStepTrack('kick', 'Kick', 'kick', null, 3, false, p.kick || []),
      buildStepTrack('snare', 'Snare', 'snare', null, 3, false, p.snare || []),
      buildStepTrack('hihat', 'Hi-Hat', 'hihat', null, 3, false, p.hihat || []),
      buildStepTrack('bass', 'Bass', null, 'sawtooth', 3, true, p.bass || []),
      buildStepTrack('lead', 'Lead', null, 'square', 5, true, p.lead || []),
      createAudioTrack('audio-1', 'Vocal'),
    ],
  };
}
