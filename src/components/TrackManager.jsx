import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import AudioTrackRow from './AudioTrackRow';

const DRUM_OPTIONS = [
  { label: 'Kick', value: 'kick' },
  { label: 'Snare', value: 'snare' },
  { label: 'Clap', value: 'clap' },
  { label: 'Hi-Hat', value: 'hihat' },
  { label: 'Open Hat', value: 'openhat' },
  { label: 'Tom', value: 'tom' },
  { label: 'Rim', value: 'rim' },
  { label: 'Cowbell', value: 'cowbell' },
];

export default function TrackManager() {
  const { project, addStepTrack, addAudioTrack } = useStudio();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackType, setNewTrackType] = useState('step');
  const [selectedDrum, setSelectedDrum] = useState('kick');

  const handleAdd = () => {
    const name = newTrackName.trim() || (newTrackType === 'step' ? 'Synth' : 'Audio');
    if (newTrackType === 'step') {
      addStepTrack(name, selectedDrum);
    } else {
      addAudioTrack(name);
    }
    setNewTrackName('');
    setShowAddMenu(false);
  };

  const audioTracks = project.tracks.filter(t => t.kind === 'audio');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button onClick={() => setShowAddMenu(!showAddMenu)} className="btn-icon btn-primary">
          <Plus className="h-4 w-4" /> Add Track
        </button>
        <span className="text-xs text-muted-foreground">
          {project.tracks.length} tracks · {audioTracks.length} audio
        </span>
      </div>

      {showAddMenu && (
        <div className="glass-strong rounded-2xl p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Track Name</label>
            <input
              type="text"
              value={newTrackName}
              onChange={e => setNewTrackName(e.target.value)}
              placeholder="Enter name..."
              className="bg-white/5 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.65_0.24_25/50%)] w-40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Type</label>
            <select
              value={newTrackType}
              onChange={e => setNewTrackType(e.target.value)}
              className="bg-white/5 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.65_0.24_25/50%)]"
            >
              <option value="step">Step (Synth/Drum)</option>
              <option value="audio">Audio (Record)</option>
            </select>
          </div>
          {newTrackType === 'step' && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Drum Voice</label>
              <select
                value={selectedDrum}
                onChange={e => setSelectedDrum(e.target.value)}
                className="bg-white/5 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.65_0.24_25/50%)]"
              >
                <option value="">— Synth (no drum) —</option>
                {DRUM_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleAdd} className="btn-icon btn-success">
            <Plus className="h-4 w-4" /> Add
          </button>
          <button onClick={() => setShowAddMenu(false)} className="btn-icon">Cancel</button>
        </div>
      )}

      {audioTracks.length > 0 && (
        <div className="space-y-1.5 mt-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-1">Audio Tracks</div>
          {audioTracks.map(t => (
            <AudioTrackRow key={t.id} track={t} />
          ))}
        </div>
      )}
    </div>
  );
}
