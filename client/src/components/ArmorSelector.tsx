interface ArmorSelectorProps {
  armorValue: number;
  onArmorChange: (value: number) => void;
  evasion: number;
  onEvasionChange: (value: number) => void;
}

export default function ArmorSelector({
  armorValue,
  onArmorChange,
  evasion,
  onEvasionChange,
}: ArmorSelectorProps) {
  return (
    <div className="card-occult h-full space-y-3">
      <div className="space-y-2">
        {/* Evasion */}
        <div className="flex items-center gap-2">
          <label className="font-display text-base text-sky-300 uppercase flex-shrink-0 w-24">Evasão</label>
          <input
            type="number"
            value={evasion}
            onChange={(e) => onEvasionChange(parseInt(e.target.value) || 0)}
            style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
            className="w-20 h-14 bg-sky-950/20 border-2 border-sky-400 text-sky-200 text-center focus:outline-none focus:ring-2 focus:ring-sky-400 p-1 text-2xl"
            min="0"
          />
        </div>

        {/* Armor */}
        <div className="space-y-1">
          <label className="font-display text-sm text-primary uppercase block">Armadura</label>
          <div className="bg-black border border-primary p-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-sm text-primary uppercase">Valor</span>
              <input
                type="number"
                value={armorValue}
                onChange={(e) => onArmorChange(parseInt(e.target.value) || 0)}
                style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
                className="w-24 h-10 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary text-lg p-0.5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
