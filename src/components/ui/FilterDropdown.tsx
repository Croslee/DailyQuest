import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterDropdownProps<T extends string> {
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  defaultValue?: T;
  ariaLabel?: string;
  className?: string;
  fullWidth?: boolean;
}

export function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
  defaultValue = 'All' as T,
  ariaLabel,
  className = '',
  fullWidth = false,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentOption = options.find(opt => opt.value === value) || options[0];
  const isFiltered = value !== defaultValue;

  return (
    <div ref={dropdownRef} className={`relative text-left ${fullWidth ? 'w-full block' : 'inline-block'} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || currentOption?.label}
        className={`inline-flex items-center justify-between gap-1.5 ${fullWidth ? 'w-full h-[34px] px-3' : 'h-7 px-2.5'} text-xs rounded-lg border font-medium transition-all duration-150 active:scale-[0.98] align-middle select-none leading-none ${
          isFiltered
            ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)] font-semibold shadow-2xs'
            : isOpen
            ? 'bg-[var(--color-bg-secondary)] border-[var(--color-accent)] text-[var(--color-text-primary)]'
            : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        <span className="truncate flex-1 text-left">{currentOption?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180 text-[var(--color-accent)]' : 'rotate-0 text-[var(--color-text-tertiary)]'
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-full mt-1.5 left-0 rounded-xl shadow-xl border p-1 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md bg-[var(--color-bg-primary)] border-[var(--color-border)] max-h-60 overflow-y-auto custom-scrollbar ${
            fullWidth ? 'w-full min-w-full' : 'min-w-[150px]'
          }`}
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`inline-flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg transition-all duration-100 cursor-pointer text-left active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-accent)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
