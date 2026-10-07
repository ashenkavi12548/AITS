'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SearchableOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  options,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  }, [options, query]);

  const openDropdown = () => {
    if (disabled) return;
    setQuery('');
    setHighlightedIndex(0);
    setIsOpen(true);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen) {
      openDropdown();
    } else {
      setIsOpen(false);
    }
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current && filteredOptions.length > 0) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, filteredOptions.length]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 focus:outline-none ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
            : error
            ? 'bg-white dark:bg-slate-900 border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-emerald-500/20'
        }`}
      >
        <div className="flex-1 truncate pr-2">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {selectedOption.label}
              </span>
              {selectedOption.subLabel && (
                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  ({selectedOption.subLabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="max-h-56 overflow-y-auto py-1 text-sm divide-y divide-slate-100/50 dark:divide-slate-800/30"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching options found
              </li>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium'
                        : isHighlighted
                        ? 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{option.label}</span>
                      {option.subLabel && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {option.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
};
