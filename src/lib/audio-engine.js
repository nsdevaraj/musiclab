import { midiToFreq } from './constants';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.limiter = null;
    this.noiseBuffer = null;
    this.bpm = 92;
    this.masterVolume = 0.85;
    this.running = false;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.timer = null;
    this.notesInQueue = [];
    this.hooks = null;
    this.voices = new Map();
    this.audioPlaybacks = new Map();
    this.mediaRecorder = null;
    this.recordingStream = null;
    this.recordingChunks = [];
    this.onRecordingData = null;
  }

  setHooks(h) { this.hooks = h; }

  init() {
    if (this.ctx) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 6;
    this.limiter.ratio.value = 12;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.18;
    this.master = ctx.createGain();
    this.master.gain.value = this.masterVolume;
    this.master.connect(this.limiter);
    this.limiter.connect(ctx.destination);
    this.noiseBuffer = this.makeNoise(ctx);
  }

  makeNoise(ctx) {
    const len = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  resume() { if (this.ctx) this.ctx.resume(); }

  setBpm(b) { this.bpm = b; }

  setMasterVolume(v) {
    this.masterVolume = v;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
  }

  start() {
    if (!this.ctx) this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.resume();
    if (this.running) return;
    this.running = true;
    this.currentStep = 0;
    this.notesInQueue = [];
    this.nextNoteTime = ctx.currentTime + 0.08;
    this.scheduler();
  }

  stop() {
    this.running = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.notesInQueue = [];
    this.currentStep = 0;
    for (const [, pb] of this.audioPlaybacks) {
      try { pb.source.stop(); } catch (_) {}
    }
    this.audioPlaybacks.clear();
    for (const [, v] of this.voices) {
      try { v.oscs.forEach(o => o.stop()); } catch (_) {}
    }
    this.voices.clear();
  }

  dispose() {
    this.stop();
    if (this.ctx) this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.limiter = null;
  }

  stepDuration() {
    return 60 / this.bpm / 4;
  }

  scheduler = () => {
    const ctx = this.ctx;
    if (!ctx || !this.hooks || !this.running) return;
    const stepDur = this.stepDuration();
    const swing = this.hooks.getSwing();
    const stepCount = this.hooks.getStepCount();
    const tracks = this.hooks.getTracks();

    while (this.nextNoteTime < ctx.currentTime + 0.12) {
      const isOffBeat = this.currentStep % 2 === 1;
      const time = isOffBeat
        ? this.nextNoteTime + swing * stepDur * 0.5
        : this.nextNoteTime;
      this.scheduleStep(this.currentStep, time);
      this.nextNoteTime += stepDur;
      this.currentStep = (this.currentStep + 1) % stepCount;
    }
    this.timer = setTimeout(this.scheduler, 25);
  };

  scheduleStep(step, time) {
    this.notesInQueue.push({ step, time });
    const tracks = this.hooks.getTracks();
    const soloed = tracks.some(t => t.solo);
    const accent = step % 4 === 0 ? 1 : step % 2 === 0 ? 0.86 : 0.72;
    const stepDur = this.stepDuration();

    for (const t of tracks) {
      if (t.kind === 'audio') continue;
      if (!t.steps[step]) continue;
      const audible = soloed ? t.solo : !t.muted;
      if (!audible) continue;
      if (t.drum) {
        this.playDrum(t.drum, time, t.volume * accent);
      } else {
        const midi = this.hooks.getMelodyForStep(t, step);
        if (midi != null) {
          this.playSynth(midi, time, stepDur * 0.92, t.waveform || 'sawtooth', t.volume * 0.5 * accent);
        }
      }
    }
  }

  playSynth(midi, time, duration, waveform, level) {
    const ctx = this.ctx;
    if (!ctx) return;
    const freq = midiToFreq(midi);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(9000, freq * 8), time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 2), time + duration);
    const o1 = ctx.createOscillator();
    o1.type = waveform;
    o1.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = waveform;
    o2.frequency.value = freq;
    o2.detune.value = 7;
    const a = 0.005, d = 0.05, s = 0.6, r = 0.09;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(level, time + a);
    gain.gain.linearRampToValueAtTime(level * s, time + a + d);
    gain.gain.setValueAtTime(level * s, time + duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration + r);
    o1.connect(filter);
    o2.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    const end = time + duration + r + 0.02;
    o1.start(time); o2.start(time);
    o1.stop(end); o2.stop(end);
  }

  // ── Drum synthesis ──

  playDrum(type, time, level) {
    switch (type) {
      case 'kick':    return this.kick(time, level);
      case 'snare':   return this.snare(time, level);
      case 'clap':    return this.clap(time, level);
      case 'hihat':   return this.hat(time, level, false);
      case 'openhat': return this.hat(time, level, true);
      case 'tom':     return this.tom(time, level);
      case 'rim':     return this.rim(time, level);
      case 'cowbell': return this.cowbell(time, level);
    }
  }

  kick(time, level) {
    const ctx = this.ctx; if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(160, time);
    o.frequency.exponentialRampToValueAtTime(50, time + 0.11);
    g.gain.setValueAtTime(Math.min(1, level), time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
    o.connect(g); g.connect(this.master);
    o.start(time); o.stop(time + 0.45);
  }

  snare(time, level) {
    const ctx = this.ctx; if (!ctx) return;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1200;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(level * 0.8, time);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    noise.connect(hp); hp.connect(ng); ng.connect(this.master);
    noise.start(time); noise.stop(time + 0.2);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(190, time);
    const og = ctx.createGain();
    og.gain.setValueAtTime(level * 0.5, time);
    og.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
    o.connect(og); og.connect(this.master);
    o.start(time); o.stop(time + 0.12);
  }

  hat(time, level, open) {
    const ctx = this.ctx; if (!ctx) return;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain();
    const dur = open ? 0.32 : 0.06;
    g.gain.setValueAtTime(level * 0.5, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    noise.connect(hp); hp.connect(g); g.connect(this.master);
    noise.start(time); noise.stop(time + dur + 0.02);
  }

  clap(time, level) {
    const ctx = this.ctx; if (!ctx) return;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 1.3;
    const out = ctx.createGain();
    out.gain.setValueAtTime(level * 0.7, time);
    out.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    bp.connect(out); out.connect(this.master);
    for (const off of [0, 0.012, 0.024, 0.04]) {
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer;
      const g = ctx.createGain();
      g.gain.setValueAtTime(1, time + off);
      g.gain.exponentialRampToValueAtTime(0.001, time + off + 0.05);
      n.connect(g); g.connect(bp);
      n.start(time + off); n.stop(time + off + 0.06);
    }
  }

  tom(time, level) {
    const ctx = this.ctx; if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(200, time);
    o.frequency.exponentialRampToValueAtTime(90, time + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level * 0.9, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
    o.connect(g); g.connect(this.master);
    o.start(time); o.stop(time + 0.32);
  }

  rim(time, level) {
    const ctx = this.ctx; if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = 'square'; o.frequency.value = 1700;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level * 0.7, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    o.connect(bp); bp.connect(g); g.connect(this.master);
    o.start(time); o.stop(time + 0.06);
  }

  cowbell(time, level) {
    const ctx = this.ctx; if (!ctx) return;
    const mk = (f) => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; return o; };
    const o1 = mk(560), o2 = mk(845);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level * 0.5, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
    o1.connect(bp); o2.connect(bp); bp.connect(g); g.connect(this.master);
    o1.start(time); o2.start(time);
    o1.stop(time + 0.26); o2.stop(time + 0.26);
  }

  // ── Preview ──

  previewDrum(type) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.ctx.resume();
    this.playDrum(type, this.ctx.currentTime + 0.01, 0.9);
  }

  previewNote(midi, waveform) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.ctx.resume();
    this.playSynth(midi, this.ctx.currentTime + 0.01, 0.35, waveform || 'sawtooth', 0.4);
  }

  // ── Audio buffer playback ──

  playAudioBuffer(trackId, buffer, volume, pan, startTime) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.stopAudioBuffer(trackId);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan || 0;
    src.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    const t = startTime || ctx.currentTime;
    src.start(t);
    this.audioPlaybacks.set(trackId, { source: src, gain, startedAt: t });
  }

  stopAudioBuffer(trackId) {
    const pb = this.audioPlaybacks.get(trackId);
    if (pb) {
      try { pb.source.stop(); } catch (_) {}
      this.audioPlaybacks.delete(trackId);
    }
  }

  // ── Recording (FIXED) ──

  /**
   * Start recording from the microphone.
   * Returns true on success, false if permission denied or error.
   * The `onData` callback receives the final blob when recording stops.
   */
  async startRecording(onData) {
    this.onRecordingData = onData;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordingStream = stream;
      const recorder = new MediaRecorder(stream);
      this.recordingChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordingChunks.push(e.data);
      };

      // FIX: Do NOT set recorder.onstop here — that caused a double-blob race
      // because stopRecording() also adds a listener.  Instead, stopRecording()
      // is the single owner of blob creation.

      recorder.start(100);
      this.mediaRecorder = recorder;
      return true;
    } catch (e) {
      console.error('Recording failed:', e);
      return false;
    }
  }

  /**
   * Stop recording and return a Promise that resolves with the blob.
   * After the blob is created, the onRecordingData callback is invoked.
   */
  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      const handleStop = () => {
        this.mediaRecorder.removeEventListener('stop', handleStop);

        // Create blob from accumulated chunks
        const blob = new Blob(this.recordingChunks, { type: 'audio/webm' });
        this.recordingChunks = [];

        // Clean up the stream
        if (this.recordingStream) {
          this.recordingStream.getTracks().forEach(t => t.stop());
          this.recordingStream = null;
        }
        this.mediaRecorder = null;

        // Deliver the blob via callback
        if (this.onRecordingData) {
          this.onRecordingData(blob);
        }

        resolve(blob);
      };

      this.mediaRecorder.addEventListener('stop', handleStop);
      this.mediaRecorder.stop();
    });
  }

  // ── File loading ──

  async loadAudioFile(file) {
    if (!this.ctx) this.init();
    const ctx = this.ctx;
    if (!ctx) return null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (e) {
      console.error('Failed to load audio:', e);
      return null;
    }
  }

  // ── Live note on/off (piano keyboard) ──

  noteOn(midi, waveform, level) {
    if (!this.ctx) this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.resume();
    if (this.voices.has(midi)) this.noteOff(midi);
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(9000, freq * 7);
    const o1 = ctx.createOscillator();
    o1.type = waveform || 'square';
    o1.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = waveform || 'square';
    o2.frequency.value = freq;
    o2.detune.value = 8;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(level || 0.38, now + 0.008);
    gain.gain.linearRampToValueAtTime((level || 0.38) * 0.7, now + 0.12);
    o1.connect(filter);
    o2.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    o1.start(now);
    o2.start(now);
    this.voices.set(midi, { gain, oscs: [o1, o2] });
  }

  noteOff(midi) {
    const v = this.voices.get(midi);
    if (!v || !this.ctx) return;
    const now = this.ctx.currentTime;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(Math.max(0.0001, v.gain.gain.value), now);
    v.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    v.oscs.forEach(o => o.stop(now + 0.16));
    this.voices.delete(midi);
  }
}
