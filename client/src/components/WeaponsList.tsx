import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import WeaponEditor from '@/components/WeaponEditor';

interface WeaponTag {
  id: string;
  name: string;
  description: string;
}

interface Weapon {
  id: string;
  name: string;
  category: string;
  damageDiceCount: number;
  damageDiceSides: number;
  criticalThreshold: number;
  criticalMultiplier: number;
  skill: string;
  attribute: string;
  hasExtraEffect: boolean;
  extraEffect?: string;
  isActive?: boolean;
  tags: WeaponTag[];
}

interface WeaponsListProps {
  weapons: Weapon[];
  onUpdateWeapon: (weaponId: string, field: keyof Weapon, value: any) => void;
  onAddWeapon: () => void;
  onDeleteWeapon: (weaponId: string) => void;
  onToggleActive: (weaponId: string) => void;
  onRollWeaponTest: (weapon: Weapon) => void;
  onCloseMenu?: () => void;
}

export default function WeaponsList({
  weapons,
  onUpdateWeapon,
  onAddWeapon,
  onDeleteWeapon,
  onToggleActive,
  onRollWeaponTest,
  onCloseMenu,
}: WeaponsListProps) {
  const [expandedInactive, setExpandedInactive] = useState<string | null>(null);

  const activeWeapons = weapons.filter((w) => w.isActive);
  const inactiveWeapons = weapons.filter((w) => !w.isActive);

  const canActivateMore = activeWeapons.length < 2;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base text-primary uppercase">Equipamentos</h3>
        <button
          onClick={onAddWeapon}
          className="p-1 text-primary hover:bg-primary hover:bg-opacity-10 border border-primary text-xs flex items-center gap-1"
        >
          <Plus size={12} />
          Adicionar Arma
        </button>
      </div>

      {/* Active Weapons (Full Editor) */}
      {activeWeapons.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-primary font-bold uppercase opacity-70">
            Equipadas ({activeWeapons.length}/2)
          </div>
          {activeWeapons.map((weapon) => (
            <div
              key={weapon.id}
              className="animate-in fade-in-50 slide-in-from-top-2 duration-300"
            >
              <WeaponEditor
                weapon={weapon}
                onUpdate={(field, value) => onUpdateWeapon(weapon.id, field, value)}
                onDelete={() => onDeleteWeapon(weapon.id)}
                onRollTest={() => onRollWeaponTest(weapon)}
                onCloseMenu={onCloseMenu}
              />
            </div>
          ))}
        </div>
      )}

      {/* Inactive Weapons (Minimized) */}
      {inactiveWeapons.length > 0 && (
        <div className="border-t border-primary pt-2 space-y-1">
          <div className="text-xs text-primary font-bold uppercase opacity-70">
            Armas Guardadas ({inactiveWeapons.length})
          </div>
          <div className="space-y-1">
            {inactiveWeapons.map((weapon) => (
              <div key={weapon.id} className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
                {/* Minimized View */}
                <div className="bg-black border border-primary bg-opacity-50 p-2 flex items-center justify-between hover:bg-opacity-75 transition-all">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() =>
                        setExpandedInactive(expandedInactive === weapon.id ? null : weapon.id)
                      }
                      className="text-primary hover:text-red-500 flex-shrink-0 transition-transform duration-300"
                    >
                      {expandedInactive === weapon.id ? (
                        <ChevronUp size={14} className="transition-transform" />
                      ) : (
                        <ChevronDown size={14} className="transition-transform" />
                      )}
                    </button>
                    <span className="text-primary text-xs font-bold uppercase truncate">
                      {weapon.name || 'Arma sem nome'}
                    </span>
                    {weapon.category && (
                      <span className="text-gray-500 text-[10px] truncate">
                        ({weapon.category})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onToggleActive(weapon.id)}
                    disabled={!canActivateMore && !weapon.isActive}
                    className={`px-2 py-1 text-xs font-bold uppercase border transition-all duration-300 flex-shrink-0 ${
                      canActivateMore || weapon.isActive
                        ? 'border-primary text-primary hover:bg-primary hover:text-black hover:scale-105'
                        : 'border-gray-600 text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Equipar
                  </button>
                </div>

                {/* Expanded Minimized View */}
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    expandedInactive === weapon.id
                      ? 'max-h-[1500px] opacity-100'
                      : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-black border-l-2 border-r-2 border-b-2 border-primary bg-opacity-30 p-2 space-y-2">
                    <WeaponEditor
                      weapon={weapon}
                      onUpdate={(field, value) => onUpdateWeapon(weapon.id, field, value)}
                      onDelete={() => onDeleteWeapon(weapon.id)}
                      onRollTest={() => onRollWeaponTest(weapon)}
                      onCloseMenu={onCloseMenu}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {weapons.length === 0 && (
        <div className="border border-dashed border-primary bg-black bg-opacity-30 p-4 text-center">
          <p className="text-xs text-gray-500 mb-2">Nenhuma arma adicionada</p>
          <button
            onClick={onAddWeapon}
            className="px-3 py-1 text-xs font-bold uppercase border border-primary text-primary hover:bg-primary hover:text-black transition-all"
          >
            Adicionar Primeira Arma
          </button>
        </div>
      )}
    </div>
  );
}
