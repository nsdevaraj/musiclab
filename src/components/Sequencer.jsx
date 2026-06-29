import React from 'react';
import { Volume2, Waves } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { STEP_COUNT } from '../lib/constants';

const WAVEFORMS = ['sine', 'triangle', 'sawtooth', 'square'];
const WAVE_LABEL = { sine: 'Sine', triangle: 'Tri', sawtooth: 'Saw', square: 'Sqr' };

export default function Sequencer() {
  const { project, currentStep, toggleStep, updateTrack, previewTrack } = useStudio();
  const stepTracks = project.tracks.filter(t => t.kind === 'step');

  if (stepTracks.length === 0) {
    return (
      <div className="glass-strong rounded-2xl p-6 text-center text-muted-foreground">
        <p className="text-sm">No step tracks. Add one below!</p>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-3 sm:p-4 overflow-hidden">
      {/* Step numbers header */}
      <div className="flex items-stretch gap-2 sm:gap-3 mb-2">
        <div className="w-[136px] sm:w-[200px] shrink-0" />
        <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 min-w-[420px]">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`text-center text-[10px] font-mono rounded transition-colors ${
                i % 4 === 0 ? 'text-foreground/70' : 'text-muted-foreground/40'
              } ${currentStep === i ? 'text-white' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Track rows */}
      <div className="space-y-1.5">
        {stepTracks.map(track => (
          <div key={track.id} className="flex items-stretch gap-2 sm:gap-3 group">
            {/* Track info panel */}
            <div className="w-[136px] sm:w-[200px] shrink-0 glass rounded-xl px-2.5 py-2 flex flex-col justify-center gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => previewTrack(track)}
                  className="h-6 w-6 shrink-0 rounded-md bg-gradient-to-br flex items-center justify-center shadow-sm"
                  style={{ background: track.accent }}
                >
                  <Waves className="h-3.5 w-3.5 text-white/90" />
                </button>
                <span className="text-sm font-semibold truncate flex-1">{track.name}</span>
                <button
                  onClick={() => updateTrack(track.id, { muted: !track.muted, solo: false })}
                  className={`h-5 w-5 rounded text-[10px] font-bold leading-none transition-colors ${
                    track.muted ? 'bg-[oklch(0.65_0.24_25)] text-white' : 'glass hover:bg-white/10 text-muted-foreground'
                  }`}
                >M</button>
                <button
                  onClick={() => updateTrack(track.id, { solo: !track.solo, muted: false })}
                  className={`h-5 w-5 rounded text-[10px] font-bold leading-none transition-colors ${
                    track.solo ? 'bg-[oklch(0.75_0.18_60)] text-black' : 'glass hover:bg-white/10 text-muted-foreground'
                  }`}
                >S</button>
              </div>
              {/* Volume + Waveform */}
              <div className="flex items-center gap-1.5">
                <Volume2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <input
                  type="range" min={0} max={100} value={Math.round(track.volume * 100)}
                  onChange={e => updateTrack(track.id, { volume: Number(e.target.value) / 100 })}
                  className="audio-slider flex-1"
                />
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => {
                      const idx = (WAVEFORMS.indexOf(track.waveform || 'sawtooth') + 1) % WAVEFORMS.length;
                      updateTrack(track.id, { waveform: WAVEFORMS[idx] });
                    }}
                    className="h-5 px-1.5 rounded glass hover:bg-white/10 text-[10px] font-mono"
                  >
                    {WAVE_LABEL[track.waveform || 'sawtooth']}
                  </button>
                </div>
              </div>
              {/* Octave + ARP */}
              <div className="flex items-center gap-1 -mt-0.5">
                <div className="flex items-center rounded glass overflow-hidden">
                  <button
                    onClick={() => updateTrack(track.id, { octave: Math.max(1, (track.octave || 3) - 1) })}
                    className="h-5 w-5 hover:bg-white/10 text-[11px] leading-none"
                  >−</button>
                  <span className="text-[10px] font-mono w-7 text-center text-muted-foreground">
                    C{track.octave || 3}
                  </span>
                  <button
                    onClick={() => updateTrack(track.id, { octave: Math.min(6, (track.octave || 3) + 1) })}
                    className="h-5 w-5 hover:bg-white/10 text-[11px] leading-none"
                  >+</button>
                </div>
                <button
                  onClick={() => updateTrack(track.id, { arp: !track.arp })}
                  className={`h-5 px-2 rounded text-[10px] font-bold leading-none transition-colors ${
                    track.arp
                      ? 'bg-gradient-to-r from-[oklch(0.7_0.18_200)] to-[oklch(0.55_0.22_300)] text-white'
                      : 'glass hover:bg-white/10 text-muted-foreground'
                  }`}
                >ARP</button>
              </div>
            </div>

            {/* Step grid */}
            <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 min-w-[420px]">
              {track.steps.map((on, i) => {
                const isBeat = i % 4 === 0;
                const isPlayhead = currentStep === i;
                return (
                  <button
                    key={i}
                    onClick={() => toggleStep(track.id, i)}
                    className={`relative rounded-md h-9 sm:h-11 transition-all duration-75 border step-cell ${
                      on
                        ? 'border-transparent step-cell-on'
                        : isBeat
                          ? 'bg-white/[0.06] border-white/10 hover:bg-white/10'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.08]'
                    } ${isPlayhead ? 'ring-2 ring-white/70' : ''}`}
                    style={on ? {
                      background: track.accent,
                      boxShadow: isPlayhead
                        ? `0 0 20px ${track.accent}`
                        : `0 0 12px -2px ${track.accent}`,
                    } : undefined}
                  >
                    {isPlayhead && <span className="absolute inset-0 rounded-md bg-white/20" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
