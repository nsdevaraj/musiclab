import React, { useState, useEffect, useRef, useCallback } from 'react';
import { KEY_MAP, BLACK_SET } from '../lib/constants';

export default function PianoKeyboard({ engine, startMidi = 60, octaves = 2, waveform = 'square' }) {
  const [active, setActive] = useState(new Set());
  const activeRef = useRef(active);
  activeRef.current = active;

  const press = useCallback((midi) => {
    if (activeRef.current.has(midi)) return;
    engine?.noteOn(midi, waveform, 0.38);
    setActive(prev => new Set(prev).add(midi));
  }, [engine, waveform]);

  const release = useCallback((midi) => {
    engine?.noteOff(midi);
    setActive(prev => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  }, [engine]);

  // Keyboard input
  useEffect(() => {
    const down = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const offset = KEY_MAP[e.key.toLowerCase()];
      if (offset === undefined) return;
      e.preventDefault();
      press(startMidi + offset);
    };
    const up = (e) => {
      const offset = KEY_MAP[e.key.toLowerCase()];
      if (offset === undefined) return;
      release(startMidi + offset);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [press, release, startMidi]);

  const total = octaves * 12 + 1;
  const notes = Array.from({ length: total }, (_, i) => startMidi + i);
  const whiteNotes = notes.filter(m => !BLACK_SET.has(m % 12));

  return (
    <div className="select-none">
      <div className="relative h-32 sm:h-40 flex" style={{ touchAction: 'none' }}>
        {/* White keys */}
        {whiteNotes.map(midi => {
          const isC = midi % 12 === 0;
          return (
            <button
              key={midi}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); press(midi); }}
              onPointerUp={() => release(midi)}
              onPointerLeave={(e) => { if (e.buttons > 0) release(midi); }}
              onPointerEnter={(e) => { if (e.buttons > 0) press(midi); }}
              className={`relative flex-1 rounded-b-lg border border-white/10 border-t-0 transition-colors flex items-end justify-center pb-2 ${
                active.has(midi)
                  ? 'bg-gradient-to-b from-[oklch(0.65_0.24_25)] to-[oklch(0.65_0.24_350)]'
                  : 'bg-gradient-to-b from-white/85 to-white/70 hover:from-white hover:to-white/80'
              }`}
            >
              {isC && (
                <span className={`text-[10px] font-bold pointer-events-none ${active.has(midi) ? 'text-white' : 'text-black/40'}`}>
                  C{Math.floor(midi / 12) - 1}
                </span>
              )}
            </button>
          );
        })}

        {/* Black keys overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative h-full flex">
            {whiteNotes.map((midi, i) => {
              const hasBlack = BLACK_SET.has((midi + 1) % 12);
              return (
                <div key={midi} className="relative flex-1">
                  {hasBlack && i < whiteNotes.length - 1 && (
                    <button
                      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); press(midi + 1); }}
                      onPointerUp={() => release(midi + 1)}
                      onPointerLeave={(e) => { if (e.buttons > 0) release(midi + 1); }}
                      className={`pointer-events-auto absolute z-10 top-0 h-[62%] w-[62%] -right-[31%] rounded-b-md border border-black/40 shadow-lg transition-colors ${
                        active.has(midi + 1)
                          ? 'bg-gradient-to-b from-[oklch(0.65_0.24_25)] to-[oklch(0.65_0.24_350)]'
                          : 'bg-gradient-to-b from-[oklch(0.22_0.01_280)] to-black hover:from-[oklch(0.3_0.02_280)]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
