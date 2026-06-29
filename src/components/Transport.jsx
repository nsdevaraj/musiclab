import React from 'react';
import {
  Play, Square, Volume2, Music4, Shuffle, Eraser, Download,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { NOTE_NAMES, SCALES, PATTERNS } from '../lib/constants';
import Select from './Select';

export default function Transport() {
  const {
    project, isPlaying, togglePlay, loadPattern, clearAll,
    randomize, exportProject, setProject,
  } = useStudio();

  return (
    <div className="glass-strong rounded-2xl p-3 sm:p-4 flex flex-wrap items-center gap-3 sm:gap-4">
      {/* Play/Stop */}
      <button
        onClick={togglePlay}
        className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isPlaying ? 'bg-white/10 text-white' : 'bg-gradient-to-r from-[oklch(0.65_0.24_25)] to-[oklch(0.65_0.24_350)] text-white shadow-[oklch(0.65_0.24_25/40%)]'}`}
      >
        {isPlaying ? <Square className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
      </button>

      {/* Tempo */}
      <div className="flex items-center gap-2">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tempo</div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setProject({ ...project, bpm: Math.max(40, project.bpm - 1) })}
              className="h-6 w-6 rounded-md glass hover:bg-white/10 text-sm font-bold leading-none"
            >−</button>
            <div className="tabular-nums font-mono text-xl font-bold w-12 text-center">{project.bpm}</div>
            <button
              onClick={() => setProject({ ...project, bpm: Math.min(220, project.bpm + 1) })}
              className="h-6 w-6 rounded-md glass hover:bg-white/10 text-sm font-bold leading-none"
            >+</button>
          </div>
        </div>
        <input
          type="range" min={40} max={220} value={project.bpm}
          onChange={e => setProject({ ...project, bpm: Number(e.target.value) })}
          className="audio-slider w-24 hidden md:block"
        />
      </div>

      <div className="h-10 w-px bg-white/10 hidden sm:block" />

      {/* Key & Scale */}
      <div className="flex items-center gap-2">
        <Music4 className="h-4 w-4 text-muted-foreground" />
        <Select
          value={String(project.keyRoot)}
          onChange={v => setProject({ ...project, keyRoot: Number(v) })}
          options={NOTE_NAMES.map((n, i) => ({ label: n, value: String(i) }))}
        />
        <Select
          value={project.scale}
          onChange={v => setProject({ ...project, scale: v })}
          options={Object.keys(SCALES).map(s => ({ label: s, value: s }))}
        />
      </div>

      <div className="h-10 w-px bg-white/10 hidden lg:block" />

      {/* Swing (desktop only) */}
      <div className="hidden lg:flex flex-col">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Swing</div>
        <input
          type="range" min={0} max={100} value={Math.round(project.swing * 100)}
          onChange={e => setProject({ ...project, swing: Number(e.target.value) / 100 })}
          className="audio-slider w-24"
        />
      </div>

      {/* Master Volume */}
      <div className="flex items-center gap-2 ml-auto">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <input
          type="range" min={0} max={100} value={Math.round(project.masterVolume * 100)}
          onChange={e => setProject({ ...project, masterVolume: Number(e.target.value) / 100 })}
          className="audio-slider w-24"
        />
      </div>

      <div className="h-10 w-px bg-white/10 hidden sm:block" />

      {/* Presets / Actions */}
      <div className="flex items-center gap-2">
        <Select
          value="" placeholder="Presets"
          onChange={v => v && loadPattern(v)}
          options={Object.keys(PATTERNS).map(p => ({ label: p, value: p }))}
        />
        <button onClick={randomize} className="h-9 px-3 rounded-lg glass hover:bg-white/10 flex items-center gap-1.5 text-sm font-medium">
          <Shuffle className="h-4 w-4" />
          <span className="hidden sm:inline">Random</span>
        </button>
        <button onClick={clearAll} className="h-9 px-3 rounded-lg glass hover:bg-white/10 flex items-center gap-1.5 text-sm font-medium">
          <Eraser className="h-4 w-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
        <button onClick={exportProject} className="h-9 px-3 rounded-lg glass hover:bg-white/10 flex items-center gap-1.5 text-sm font-medium">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
}
