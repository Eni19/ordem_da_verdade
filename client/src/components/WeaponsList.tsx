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
  const activeWeapons = weapons.filter((w) => w.isActive);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-base text-primary uppercase">Armas em Mãos</h3>
        <button
          onClick={onAddWeapon}
          className="p-1 text-primary hover:bg-primary hover:bg-opacity-10 border border-primary text-[10px] uppercase font-bold flex items-center gap-1 transition-all"
        >
          <Plus size={12} />
          Criar Arma
        </button>
      </div>

      {/* Slots */}
      <div className="space-y-4">
        {[0, 1].map((index) => {
          const weapon = activeWeapons[index];
          return (
            <div key={`equip-slot-${index}`} className="equip-slot relative">
              {weapon ? (
                <div className="animate-in fade-in-50 slide-in-from-top-2 duration-300">

                  <WeaponEditor
                    weapon={weapon}
                    onUpdate={(field, value) => onUpdateWeapon(weapon.id, field, value)}
                    onDelete={() => onDeleteWeapon(weapon.id)}
                    onRollTest={() => onRollWeaponTest(weapon)}
                    onCloseMenu={onCloseMenu}
                  />
                </div>
              ) : (
                <div className="equip-slot-inner h-32 bg-black border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-primary/40 uppercase font-bold text-[10px] tracking-widest gap-2 transition-all duration-200">
                  <span>Slot {index + 1} Livre</span>
                  <span className="text-center px-4 opacity-50">
                    Arraste uma arma do inventário e solte aqui para equipar
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
