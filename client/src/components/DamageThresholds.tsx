interface DamageThreshold {
  minor: number;
  major: number;
  severe: number;
}

interface DamageThresholdsProps {
  thresholds: DamageThreshold;
  onChange: (field: keyof DamageThreshold, value: number) => void;
}

export default function DamageThresholds({ thresholds, onChange }: DamageThresholdsProps) {
  return (
    <div className="w-full border-2 border-primary bg-card p-2.5 space-y-1.5 min-h-[6.25rem]">
      <h3 className="font-display text-xs text-primary uppercase">Limites de Dano</h3>

      <div className="grid grid-cols-5 gap-1 items-stretch">
        <div className="border border-primary bg-black p-1 text-center flex flex-col items-center justify-center">
          <div className="font-display text-xs font-bold text-red-300 uppercase tracking-wide">Menor</div>
          <div className="text-[10px] text-red-100/80 font-medium">1 HP</div>
        </div>

        <input
          type="number"
          value={thresholds.minor}
          onChange={(e) => onChange('minor', parseInt(e.target.value) || 0)}
          style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
          className="h-full min-h-10 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary p-0.5 text-xs"
          min="0"
          aria-label="Limite Menor para Maior"
        />

        <div className="border border-primary bg-black p-1 text-center flex flex-col items-center justify-center">
          <div className="font-display text-xs font-bold text-red-300 uppercase tracking-wide">Maior</div>
          <div className="text-[10px] text-red-100/80 font-medium">2 HP</div>
        </div>

        <input
          type="number"
          value={thresholds.major}
          onChange={(e) => onChange('major', parseInt(e.target.value) || 0)}
          style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
          className="h-full min-h-10 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary p-0.5 text-xs"
          min="0"
          aria-label="Limite Maior para Severo"
        />

        <div className="border border-primary bg-black p-1 text-center flex flex-col items-center justify-center">
          <div className="font-display text-xs font-bold text-red-300 uppercase tracking-wide">Severo</div>
          <div className="text-[10px] text-red-100/80 font-medium">3 HP</div>
        </div>
      </div>
    </div>
  );
}
