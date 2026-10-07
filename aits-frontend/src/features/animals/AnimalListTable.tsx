import React from 'react';
import Link from 'next/link';
import AnimalPhoto from '@/components/common/AnimalPhoto';
import { Eye, Edit, Trash2, QrCode } from 'lucide-react';
import { AnimalItem } from '@/services/animals.service';
import { AnimalStatusBadge } from '@/features/animals/AnimalStatusBadge';

interface AnimalListTableProps {
  animals: AnimalItem[];
  selectedIds: string[];
  handleToggleSelect: (id: string) => void;
  handleSelectAllVisible: () => void;
  handleOpenBadgeModal: (animal: AnimalItem) => void;
  hasPermissionOnFarm: (permission: string, farmId?: string) => boolean;
  setArchiveModalAnimal: (animal: AnimalItem) => void;
  calculateAge: (dobString: string) => string;
}

export function AnimalListTable({
  animals,
  selectedIds,
  handleToggleSelect,
  handleSelectAllVisible,
  handleOpenBadgeModal,
  hasPermissionOnFarm,
  setArchiveModalAnimal,
  calculateAge,
}: AnimalListTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#262626] shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#f9f9f9] dark:bg-[#1f1f1f] border-b border-[#e5e5e5] dark:border-[#383838] text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#8e8e8e]">
            <th className="py-3 px-3 w-8">
              <input
                type="checkbox"
                checked={animals.length > 0 && selectedIds.length === animals.length}
                onChange={handleSelectAllVisible}
                className="rounded text-[#10a37f] focus:ring-[#10a37f] cursor-pointer"
                aria-label="Select all cattle on page"
              />
            </th>
            <th className="py-3 px-4">Animal / Identifier</th>
            <th className="py-3 px-4">Breed &amp; Species</th>
            <th className="py-3 px-4">Gender &amp; Age</th>
            <th className="py-3 px-4">Weight</th>
            <th className="py-3 px-4">Farm Facility</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Ear Tag Badge</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#383838]">
          {animals.map((animal) => (
            <tr
              key={animal.id}
              className={`hover:bg-[#f9f9f9] dark:hover:bg-[#202020] transition-colors ${
                selectedIds.includes(animal.id) ? 'bg-[#10a37f]/5 dark:bg-[#10a37f]/10' : ''
              }`}
            >
              <td className="py-3 px-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(animal.id)}
                  onChange={() => handleToggleSelect(animal.id)}
                  className="rounded text-[#10a37f] focus:ring-[#10a37f] cursor-pointer"
                  aria-label={`Select ${animal.animalNumber}`}
                />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <AnimalPhoto
                    src={animal.imageUrl}
                    animalNumber={animal.animalNumber}
                    species={animal.species}
                    gender={animal.gender}
                    showBadge={false}
                    className="w-10 h-10 rounded-xl shrink-0 border border-[#e5e5e5] dark:border-[#383838]"
                  />
                  <div>
                    <Link
                      href={`/animals/${animal.id}`}
                      className="font-bold text-[#0d0d0d] dark:text-white hover:text-[#10a37f] hover:underline"
                    >
                      {animal.animalNumber}
                    </Link>
                    {animal.name && animal.name !== animal.animalNumber && (
                      <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                        &ldquo;{animal.name}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="font-semibold text-[#0d0d0d] dark:text-[#ececec]">{animal.breed}</p>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">{animal.species}</p>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      animal.gender === 'FEMALE' ? 'bg-rose-500' : 'bg-[#10a37f]'
                    }`}
                  />
                  <span className="font-medium text-[#0d0d0d] dark:text-white">
                    {animal.gender === 'FEMALE' ? 'Female' : 'Male'}
                  </span>
                </div>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e] mt-0.5">
                  {calculateAge(animal.dateOfBirth)}
                </p>
              </td>
              <td className="py-3 px-4 font-semibold text-[#0d0d0d] dark:text-[#ececec]">
                {animal.weight ? `${animal.weight} kg` : '—'}
              </td>
              <td className="py-3 px-4">
                <p className="font-medium text-[#0d0d0d] dark:text-white truncate max-w-40">
                  {animal.farm?.name || '—'}
                </p>
                <p className="text-[11px] text-[#737373] dark:text-[#8e8e8e]">
                  {animal.farm?.city || animal.farm?.district || ''}
                </p>
              </td>
              <td className="py-3 px-4">
                <AnimalStatusBadge status={animal.status} />
              </td>
              <td className="py-3 px-4">
                {animal.activeQr ? (
                  <button
                    type="button"
                    onClick={() => void handleOpenBadgeModal(animal)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f4f4f4] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] hover:border-[#10a37f] text-[11px] font-semibold text-[#0d0d0d] dark:text-white transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#10a37f]" />
                    <span>View Badge</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400">No Tag</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/animals/${animal.id}`}
                    className="p-1.5 rounded-lg bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#10a37f]/10 text-gray-600 dark:text-gray-300 hover:text-[#10a37f] transition-colors"
                    aria-label={`View profile for ${animal.animalNumber}`}
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  {hasPermissionOnFarm('animal:update', animal.farmId) && (
                    <Link
                      href={`/animals/${animal.id}?edit=true`}
                      className="p-1.5 rounded-lg bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#10a37f]/10 text-gray-600 dark:text-gray-300 hover:text-[#10a37f] transition-colors cursor-pointer"
                      aria-label={`Edit profile for ${animal.animalNumber}`}
                    >
                      <Edit className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  )}

                  {hasPermissionOnFarm('animal:delete', animal.farmId) && (
                    <button
                      type="button"
                      onClick={() => setArchiveModalAnimal(animal)}
                      className="p-1.5 rounded-lg bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-rose-500/10 text-gray-600 dark:text-gray-300 hover:text-rose-600 transition-colors cursor-pointer"
                      aria-label={`Archive ${animal.animalNumber}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
