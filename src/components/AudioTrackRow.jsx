import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Mic, MicOff, Download, Trash2, Volume2, Waves } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function AudioTrackRow({ track }) {
  const { updateTrack, removeTrack, previewTrack, engine } = useStudio();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const timerRef = useRef(null);
  const [waveformUrl, setWaveformUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveformUrl) URL.revokeObjectURL(waveformUrl);
    };
  }, [waveformUrl]);

  const startRecording = async () => {
    if (!engine) return;
    setIsRecording(true);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

    const ok = await engine.startRecording((blob) => {
      const url = URL.createObjectURL(blob);
      setWaveformUrl(url);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result;
        if (!engine.ctx) engine.init();
        try {
          const audioBuffer = await engine.ctx.decodeAudioData(arrayBuffer);
          updateTrack(track.id, {
            buffer: audioBuffer,
            blobUrl: url,
            duration: audioBuffer.duration,
          });
        } catch (err) {
          console.error('Failed to decode recording:', err);
        }
      };
      reader.readAsArrayBuffer(blob);
    });

    if (!ok) {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      alert('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecording = async () => {
    if (!engine) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
    setRecordingTime(0);
    await engine.stopRecording();
  };

  const toggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playAudio = () => {
    if (!engine || !track.buffer) return;
    setIsPlayingBack(true);
    engine.playAudioBuffer(track.id, track.buffer, track.volume, track.pan || 0);
    const dur = track.buffer.duration || 1;
    setTimeout(() => {
      setIsPlayingBack(false);
      engine.stopAudioBuffer(track.id);
    }, dur * 1000 + 300);
  };

  const stopAudio = () => {
    if (!engine) return;
    engine.stopAudioBuffer(track.id);
    setIsPlayingBack(false);
  };

  const hasAudio = !!track.buffer;

  return (
    <div className="flex items-stretch gap-2 sm:gap-3 group track-row">
      {/* Track info */}
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
          <button
            onClick={() => removeTrack(track.id)}
            className="h-5 w-5 rounded text-[10px] font-bold leading-none transition-colors hover:bg-white/10 text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <Volume2 className="h-3 w-3 text-muted-foreground shrink-0" />
          <input
            type="range" min={0} max={100} value={Math.round(track.volume * 100)}
            onChange={e => updateTrack(track.id, { volume: Number(e.target.value) / 100 })}
            className="audio-slider flex-1"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Pan</span>
          <input
            type="range" min={-100} max={100} value={Math.round((track.pan || 0) * 100)}
            onChange={e => updateTrack(track.id, { pan: Number(e.target.value) / 100 })}
            className="audio-slider flex-1"
          />
        </div>
      </div>

      {/* Waveform / Controls */}
      <div className="flex-1 min-w-[420px] glass rounded-xl px-3 py-2 flex items-center gap-3">
        {hasAudio ? (
          <>
            <button
              onClick={isPlayingBack ? stopAudio : playAudio}
              className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center bg-gradient-to-br from-[oklch(0.65_0.24_25)] to-[oklch(0.65_0.24_350)] text-white shadow-md"
            >
              {isPlayingBack ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-8 rounded bg-white/5 relative overflow-hidden">
                {track.buffer && (
                  <div className="absolute inset-0 flex items-center gap-[1px] px-1">
                    {Array.from({ length: 40 }, (_, i) => {
                      const val = Math.random() * 0.8 + 0.2;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-[oklch(0.65_0.24_25)] to-[oklch(0.65_0.24_350)] rounded-sm"
                          style={{ height: `${val * 100}%`, opacity: 0.6 + val * 0.4 }}
                        />
                      );
                    })}
                  </div>
                )}
                {isPlayingBack && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
              </div>
              <span className="text-xs font-mono text-muted-foreground tabular-nums w-16">
                {formatTime(track.duration || 0)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            No audio recorded yet
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleRecord}
            className={`h-8 px-3 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isRecording ? 'btn-danger rec-pulse' : 'glass hover:bg-white/10'
            }`}
          >
            {isRecording ? (
              <><MicOff className="h-4 w-4" /> Stop</>
            ) : (
              <><Mic className="h-4 w-4" /> Record</>
            )}
          </button>
          {isRecording && (
            <span className="text-xs font-mono text-red-400 tabular-nums">{formatTime(recordingTime)}</span>
          )}
          {hasAudio && (
            <button
              onClick={() => {
                if (track.blobUrl) {
                  const a = document.createElement('a');
                  a.href = track.blobUrl;
                  a.download = `${track.name}.webm`;
                  a.click();
                }
              }}
              className="h-8 w-8 rounded-md flex items-center justify-center glass hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
