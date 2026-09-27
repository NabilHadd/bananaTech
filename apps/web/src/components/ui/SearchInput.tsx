import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder }) => (
  <div className="search-input">
    <Search size={16} color="var(--text-tertiary)" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <button type="button" onClick={() => onChange('')} aria-label="Limpiar búsqueda">
        <X size={14} />
      </button>
    )}
  </div>
);
