import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export default function ImportButton() {
  const { importProject } = useStudio();
  const inputRef = useRef(null);

  const handleClick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await importProject(file);
    }
    e.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        accept=".json"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={handleClick}
        className="h-9 px-3 rounded-lg glass hover:bg-white/10 flex items-center gap-1.5 text-sm font-medium"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">Import</span>
      </button>
    </>
  );
}
