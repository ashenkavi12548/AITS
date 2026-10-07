import React from 'react';
import Link from 'next/link';
import AnimalPhoto from '@/components/common/AnimalPhoto';
import { Edit, Trash2, QrCode } from 'lucide-react';
import { AnimalItem } from '@/services/animals.service';
import { AnimalStatusBadge } from '@/features/animals/AnimalStatusBadge';

interface AnimalListGridProps {
  animals: AnimalItem[];
  selectedIds: string[];
  handleToggleSelect: (id: string) => void;
  handleOpenBadgeModal: (animal: AnimalItem) => void;
  hasPermissionOnFarm: (permission: string, farmId?: string) => boolean;
  setArchiveModalAnimal: (animal: AnimalItem) => void;
  calculateAge: (dobString: string) => string;
}

export function AnimalListGrid({
  animals,
  selectedIds,
  handleToggleSelect,
  handleOpenBadgeModal,
  hasPermissionOnFarm,
  setArchiveModalAnimal,
  calculateAge,
}: AnimalListGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {animals.map((animal) => (
        <div
          key={animal.id}
          className={`bg-white dark:bg-[#262626] rounded-2xl border p-4 shadow-xs hover:border-[#10a37f]/50 transition-all flex flex-col justify-between relative ${
            selectedIds.includes(animal.id)
              ? 'border-[#10a37f] ring-2 ring-[#10a37f]/20'
              : 'border-[#e5e5e5] dark:border-[#383838]'
          }`}
        >
          <div>
            <div className="relative h-44 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1f1f1f] mb-3">
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(animal.id)}
                  onChange={() => handleToggleSelect(animal.id)}
                  className="rounded text-[#10a37f] focus:ring-[#10a37f] cursor-pointer w-4 h-4 bg-white/90"
                  aria-label={`Select ${animal.animalNumber}`}
                />
              </div>
              <AnimalPhoto
                src={animal.imageUrl}
                animalNumber={animal.animalNumber}
                species={animal.species}
                gender={animal.gender}
                showBadge={true}
                className="w-full h-full"
              />
              <div className="absolute top-2 right-2">
                <AnimalStatusBadge status={animal.status} />
              </div>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/animals/${animal.id}`}
                  className="text-sm font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f]"
                >
                  {animal.animalNumber}
                </Link>
                {animal.name && animal.name !== animal.animalNumber && (
                  <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
                    &ldquo;{animal.name}&rdquo;
                  </p>
                )}
              </div>
              <span className="text-xs font-semibold text-[#10a37f]">
                {animal.weight ? `${animal.weight} kg` : ''}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-[#f1f5f9] dark:border-[#333333] space-y-1.5 text-xs text-[#737373] dark:text-[#8e8e8e]">
              <div className="flex items-center justify-between">
                <span>Breed:</span>
                <span className="font-medium text-[#0d0d0d] dark:text-white">{animal.breed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Age:</span>
                <span className="font-medium text-[#0d0d0d] dark:text-white">
                  {calculateAge(animal.dateOfBirth)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Farm:</span>
                <span className="font-medium text-[#0d0d0d] dark:text-white truncate max-w-32">
                  {animal.farm?.name || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f1f5f9] dark:border-[#333333] flex items-center justify-between gap-1.5">
            <div className="flex-1 flex gap-1.5">
              <Link
                href={`/animals/${animal.id}`}
                className="flex-1 py-1.5 px-3 rounded-xl bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] font-semibold text-xs text-center transition-colors"
              >
                View Profile
              </Link>

              {hasPermissionOnFarm('animal:update', animal.farmId) && (
                <Link
                  href={`/animals/${animal.id}?edit=true`}
                  className="py-1.5 px-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#10a37f]/10 text-gray-600 dark:text-gray-300 hover:text-[#10a37f] border border-[#e5e5e5] dark:border-[#383838] transition-colors cursor-pointer"
                  aria-label={`Edit profile for ${animal.animalNumber}`}
                >
                  <Edit className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}

              {hasPermissionOnFarm('animal:delete', animal.farmId) && (
                <button
                  type="button"
                  onClick={() => setArchiveModalAnimal(animal)}
                  className="py-1.5 px-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-rose-500/10 text-gray-600 dark:text-gray-300 hover:text-rose-600 border border-[#e5e5e5] dark:border-[#383838] transition-colors cursor-pointer"
                  aria-label={`Archive ${animal.animalNumber}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {animal.activeQr && (
              <button
                type="button"
                onClick={() => void handleOpenBadgeModal(animal)}
                className="p-1.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f] text-[#0d0d0d] dark:text-white transition-colors cursor-pointer"
                aria-label={`View Ear Tag Badge for ${animal.animalNumber}`}
              >
                <QrCode className="w-4 h-4 text-[#10a37f]" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
