import React from 'react';
import { useStudio } from '../context/StudioContext';

export default function ProjectNameInput() {
  const { project, setProject } = useStudio();
  return (
    <input
      value={project.name}
      onChange={e => setProject({ ...project, name: e.target.value })}
      className="bg-transparent outline-none text-sm font-medium text-foreground/90 focus:text-foreground rounded px-2 py-1 hover:bg-white/5 focus:bg-white/5 min-w-0 w-40 sm:w-56 truncate"
      aria-label="Project name"
    />
  );
}
