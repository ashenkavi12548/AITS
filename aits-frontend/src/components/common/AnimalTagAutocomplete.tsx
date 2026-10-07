'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Tag, Search, Loader2, AlertCircle, X, Check } from 'lucide-react';
import { useAnimalTagSearch } from '@/hooks/useAnimalTagSearch';
import type { AnimalItem } from '@/types/animals';
import type { AnimalQueryParams as AnimalQuery } from '@/services/animals.service';

interface AnimalTagAutocompleteProps {
  /** Current animalTag value (the animal number string). */
  value: string;
  /** Called when user selects or clears an animal. */
  onSelect: (animalTag: string, animal: AnimalItem | null) => void;
  /** Field label text. Defaults to "Animal Tag". */
  label?: string;
  /** Input placeholder. */
  placeholder?: string;
  /** Mark field required. */
  required?: boolean;
  /** Disable interaction. */
  disabled?: boolean;
  /** External validation error message. */
  error?: string;
  /** Additional CSS class on outermost container. */
  className?: string;
  /** Filters to pass to the search hook. */
  filters?: Partial<AnimalQuery>;
}

/**
 * Reusable async autocomplete for Animal Tag selection.
 * Searches registered animals via GET /api/v1/animals?search=.
 * Displays animalNumber, name, breed, species per suggestion.
 * Keyboard accessible (arrows, enter, escape).
 */
export function AnimalTagAutocomplete({
  value,
  onSelect,
  label = 'Animal Tag',
  placeholder = 'Search by tag, name, or breed...',
  required = false,
  disabled = false,
  error,
  className = '',
  filters,
}: AnimalTagAutocompleteProps) {
  const { query, setQuery, results, isLoading, error: searchError, clearResults } =
    useAnimalTagSearch(300, filters);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Display text: when an animal is selected, show tag. Otherwise show typed query.
  const displayValue = selectedAnimal ? selectedAnimal.animalNumber : query;

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

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && results.length > 0) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, results.length]);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAnimal(null);
      setQuery('');
    }
  }, [value, setQuery]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // If user edits after selecting, clear selection
      if (selectedAnimal) {
         
      setSelectedAnimal(null);
        onSelect('', null);
      }
      setQuery(newValue);
      setHighlightedIndex(0);
      setIsOpen(true);
    },
    [selectedAnimal, onSelect, setQuery],
  );

  const handleSelectAnimal = useCallback(
    (animal: AnimalItem) => {
      setSelectedAnimal(animal);
      onSelect(animal.animalNumber, animal);
      setIsOpen(false);
      clearResults();
    },
    [onSelect, clearResults],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
       
      setSelectedAnimal(null);
      setQuery('');
      onSelect('', null);
      clearResults();
      inputRef.current?.focus();
    },
    [onSelect, setQuery, clearResults],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' && query.trim().length >= 2) {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelectAnimal(results[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    },
    [isOpen, results, highlightedIndex, handleSelectAnimal, query],
  );

  const handleFocus = useCallback(() => {
    if (!selectedAnimal && query.trim().length >= 2) {
      setIsOpen(true);
    }
  }, [selectedAnimal, query]);

  const showDropdown = isOpen && (results.length > 0 || isLoading || Boolean(searchError) || query.trim().length >= 2);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[12px] font-medium text-[#0d0d0d] dark:text-white mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8e8e8e] pointer-events-none z-10" />

        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`chatgpt-input w-full pl-9 pr-8 py-2 rounded-lg text-[13px] ${
            error ? 'border-red-400 dark:border-red-600' : ''
          } ${
            selectedAnimal
              ? 'text-[#10a37f] dark:text-[#10a37f] font-semibold'
              : ''
          }`}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="animal-autocomplete-listbox"
          role="combobox"
          id="animal-tag-autocomplete"
        />

        {/* Right-side indicators */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 text-[#8e8e8e] animate-spin" />
          )}
          {selectedAnimal && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-[#f4f4f4] dark:hover:bg-[#383838] transition-colors cursor-pointer"
              aria-label="Clear animal selection"
            >
              <X className="w-3.5 h-3.5 text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white" />
            </button>
          )}
          {selectedAnimal && (
            <Check className="w-3.5 h-3.5 text-[#10a37f]" />
          )}
        </div>
      </div>

      {/* Selected animal summary chip */}
      {selectedAnimal && (
        <div className="mt-1 px-2 py-1 bg-[#10a37f]/5 border border-[#10a37f]/15 rounded-md text-[11px] text-[#5d5d5d] dark:text-[#b4b4b4]">
          <span className="font-semibold text-[#10a37f]">{selectedAnimal.animalNumber}</span>
          {selectedAnimal.name && (
            <span className="mx-1">· {selectedAnimal.name}</span>
          )}
          <span className="mx-1">· {selectedAnimal.breed}</span>
          <span className="mx-1">· {selectedAnimal.species}</span>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div 
          id="animal-autocomplete-listbox" 
          role="listbox" 
          className="absolute top-[calc(100%-2px)] left-0 w-full z-50 mt-1 rounded-xl border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#2f2f2f] shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Loading */}
          {isLoading && results.length === 0 && (
            <div className="px-3 py-4 flex items-center justify-center gap-2 text-[12px] text-[#8e8e8e]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching registered animals...</span>
            </div>
          )}

          {/* Error */}
          {searchError && !isLoading && (
            <div className="px-3 py-3 flex items-center gap-2 text-[12px] text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Search failed. Please try again.</span>
            </div>
          )}

          {/* No results */}
          {!isLoading && !searchError && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-4 text-center text-[12px] text-[#8e8e8e]">
              <Search className="w-4 h-4 mx-auto mb-1 opacity-50" />
              No registered animals match &ldquo;{query.trim()}&rdquo;
            </div>
          )}

          {/* Results list */}
          {results.length > 0 && (
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-56 overflow-y-auto py-1 text-[12px]"
            >
              {results.map((animal, idx) => {
                const isHighlighted = idx === highlightedIndex;
                const isSelected = animal.animalNumber === value;

                return (
                  <li
                    key={animal.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectAnimal(animal)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#10a37f]/8 text-[#10a37f] font-medium'
                        : isHighlighted
                          ? 'bg-[#f4f4f4] dark:bg-[#383838] text-[#0d0d0d] dark:text-white'
                          : 'text-[#5d5d5d] dark:text-[#b4b4b4]'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0d0d0d] dark:text-white truncate">
                          {animal.animalNumber}
                        </span>
                        {animal.name && (
                          <span className="text-[11px] text-[#8e8e8e] truncate">
                            ({animal.name})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#8e8e8e] truncate">
                        {animal.breed} · {animal.species}
                        {animal.farm?.name && ` · ${animal.farm.name}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                          animal.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : animal.status === 'QUARANTINED'
                              ? 'bg-red-500/10 text-red-600 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}
                      >
                        {animal.status}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#10a37f] shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export default AnimalTagAutocomplete;
