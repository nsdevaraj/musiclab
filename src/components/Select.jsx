import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none glass hover:bg-white/10 rounded-lg h-9 pl-3 pr-8 text-sm font-medium cursor-pointer outline-none focus:ring-2 focus:ring-[oklch(0.65_0.24_25/50%)]"
      >
        {placeholder && (
          <option value="" disabled hidden>{placeholder}</option>
        )}
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[oklch(0.16_0.008_280)]">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
    </div>
  );
}
