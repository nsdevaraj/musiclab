import React from 'react';
import { ArrowLeft, Keyboard } from 'lucide-react';
import { StudioProvider } from './providers/StudioProvider';
import { useStudio } from './context/StudioContext';
import Transport from './components/Transport';
import Sequencer from './components/Sequencer';
import TrackManager from './components/TrackManager';
import PianoKeyboard from './components/PianoKeyboard';
import ProjectNameInput from './components/ProjectNameInput';
import ImportButton from './components/ImportButton';

function StudioApp() {
  const { isPlaying, engine } = useStudio();

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 left-1/4 h-[480px] w-[480px] rounded-full bg-[oklch(0.65_0.24_25/18%)] blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[480px] w-[480px] rounded-full bg-[oklch(0.55_0.22_300/16%)] blur-[140px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 group shrink-0">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.24_25)] via-[oklch(0.65_0.24_350)] to-[oklch(0.55_0.22_300)] flex items-center justify-center shadow-lg shadow-[oklch(0.65_0.24_25/40%)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
          </a>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-sm font-bold tracking-tight hidden sm:inline">Studio</span>
            <ProjectNameInput />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ImportButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-4 sm:py-6 space-y-4">
        <Transport />
        <Sequencer />
        <TrackManager />

        {/* Piano Keyboard */}
        <div className="glass-strong rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Instrument</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                play with your mouse or the <kbd className="font-mono text-foreground/80">A–L</kbd> keys
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
              press <kbd className="text-foreground/80">space</kbd> to {isPlaying ? 'stop' : 'play'}
            </span>
          </div>
          <PianoKeyboard engine={engine} startMidi={60} octaves={2} waveform="square" />
        </div>

        <p className="text-center text-xs text-muted-foreground pb-6 max-w-2xl mx-auto">
          A fully in-browser studio powered by the Web Audio API — record audio, build beats with
          the step sequencer, and play live with the keyboard. Click cells to build a pattern, use{' '}
          <span className="text-foreground/70 font-medium">ARP</span> to turn rhythms into melodies.
          Add audio tracks to record vocals or instruments right in your browser.
        </p>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <StudioApp />
    </StudioProvider>
  );
}
