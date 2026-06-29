import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudioContext } from '../context/StudioContext';
import { AudioEngine } from '../lib/audio-engine';
import { defaultProject, buildStepTrack, createAudioTrack } from '../lib/project-defaults';
import { SCALES, PATTERNS, STEP_COUNT, stepsFrom } from '../lib/constants';

export function StudioProvider({ children }) {
  const [project, setProject] = useState(defaultProject);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [engine, setEngine] = useState(null);

  const engineRef = useRef(null);
  const projectRef = useRef(project);
  projectRef.current = project;

  // Init engine
  useEffect(() => {
    const e = new AudioEngine();
    e.setHooks({
      getTracks: () => projectRef.current.tracks,
      getSwing: () => projectRef.current.swing,
      getStepCount: () => STEP_COUNT,
      getMelodyForStep: (track, step) => {
        if (track.kind !== 'step') return null;
        const baseMidi = projectRef.current.keyRoot + 12 * (track.octave || 3);
        if (!track.arp) return baseMidi;
        const scale = SCALES[projectRef.current.scale];
        let idx = 0;
        for (let i = 0; i < step; i++) {
          if (track.steps[i]) idx++;
        }
        const span = scale.length * 2;
        idx = idx % span;
        const degree = idx % scale.length;
        const octaveShift = Math.floor(idx / scale.length);
        return baseMidi + scale[degree] + 12 * octaveShift;
      },
    });
    engineRef.current = e;
    setEngine(e);
    return () => e.dispose();
  }, []);

  // Sync BPM to engine
  useEffect(() => {
    engineRef.current?.setBpm(project.bpm);
  }, [project.bpm]);

  // Sync master volume to engine
  useEffect(() => {
    engineRef.current?.setMasterVolume(project.masterVolume);
  }, [project.masterVolume]);

  // Playhead animation loop
  useEffect(() => {
    if (!isPlaying) { setCurrentStep(-1); return; }
    let raf = 0;
    let last = -1;
    const draw = () => {
      const e = engineRef.current;
      const ctx = e?.ctx;
      if (e && ctx) {
        const now = ctx.currentTime;
        let step = last;
        while (e.notesInQueue.length && e.notesInQueue[0].time <= now) {
          step = e.notesInQueue[0].step;
          e.notesInQueue.shift();
        }
        if (step !== last) { last = step; setCurrentStep(step); }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // Toggle play/stop
  const togglePlay = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    if (isPlaying) {
      e.stop();
      setIsPlaying(false);
    } else {
      e.init();
      e.setBpm(projectRef.current.bpm);
      e.setMasterVolume(projectRef.current.masterVolume);
      e.start();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Spacebar toggles play
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.code !== 'Space') return;
      const tag = ev.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      ev.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const updateTrack = useCallback((id, partial) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === id ? { ...t, ...partial } : t),
    }));
  }, []);

  const removeTrack = useCallback((id) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== id),
    }));
  }, []);

  const addStepTrack = useCallback((name, drum) => {
    const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const track = buildStepTrack(id, name, drum, 'sawtooth', 3, false, []);
    setProject(prev => ({ ...prev, tracks: [...prev.tracks, track] }));
  }, []);

  const addAudioTrack = useCallback((name) => {
    const id = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const track = createAudioTrack(id, name);
    setProject(prev => ({ ...prev, tracks: [...prev.tracks, track] }));
  }, []);

  const toggleStep = useCallback((id, step) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => {
        if (t.id !== id || t.kind !== 'step') return t;
        return { ...t, steps: t.steps.map((on, i) => i === step ? !on : on) };
      }),
    }));
  }, []);

  const previewTrack = useCallback((track) => {
    const e = engineRef.current;
    if (!e) return;
    if (track.kind === 'step') {
      if (track.drum) {
        e.previewDrum(track.drum);
      } else {
        const midi = projectRef.current.keyRoot + 12 * (track.octave || 3);
        e.previewNote(midi, track.waveform || 'sawtooth');
      }
    } else if (track.kind === 'audio' && track.buffer) {
      e.playAudioBuffer(track.id, track.buffer, track.volume, track.pan || 0);
      setTimeout(() => e.stopAudioBuffer(track.id), (track.buffer.duration || 1) * 1000 + 200);
    }
  }, []);

  const loadPattern = useCallback((name) => {
    const pattern = PATTERNS[name] || {};
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => {
        if (t.kind !== 'step') return t;
        const steps = pattern[t.id] || [];
        return { ...t, steps: stepsFrom(steps) };
      }),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => {
        if (t.kind === 'step') return { ...t, steps: new Array(STEP_COUNT).fill(false) };
        return t;
      }),
    }));
  }, []);

  const randomize = useCallback(() => {
    const density = {
      kick: 0.32, snare: 0.16, clap: 0.12, hihat: 0.55,
      openhat: 0.16, tom: 0.12, bass: 0.4, lead: 0.4,
    };
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => {
        if (t.kind !== 'step') return t;
        return {
          ...t,
          steps: Array.from({ length: STEP_COUNT }, (_, i) => {
            if (t.id === 'kick' && i === 0) return true;
            return Math.random() < (density[t.id] || 0.25);
          }),
        };
      }),
    }));
  }, []);

  const exportProject = useCallback(() => {
    const blob = new Blob([JSON.stringify(projectRef.current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectRef.current.name.replace(/\s+/g, '-').toLowerCase()}.bandlab.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importProject = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.tracks || !Array.isArray(data.tracks)) throw new Error('Invalid project file');
      engineRef.current?.stop();
      setProject(data);
    } catch (e) {
      console.error('Import failed:', e);
      alert('Failed to import project. Please check the file format.');
    }
  }, []);

  const value = {
    project,
    setProject,
    engine,
    isPlaying,
    setIsPlaying,
    currentStep,
    togglePlay,
    updateTrack,
    removeTrack,
    addStepTrack,
    addAudioTrack,
    toggleStep,
    previewTrack,
    loadPattern,
    clearAll,
    randomize,
    exportProject,
    importProject,
  };

  return React.createElement(StudioContext.Provider, { value }, children);
}
