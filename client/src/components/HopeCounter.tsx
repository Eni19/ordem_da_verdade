import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { HopeUseDialog } from '@/components/HopeUseDialog';
import { HopeUse } from '@/data/hope_use';

interface HopeCounterProps {
  current: number;
  onChange: (value: number) => void;
}

const MAX_HOPE = 3;

export default function HopeCounter({ current, onChange }: HopeCounterProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleIncrement = () => {
    if (current < MAX_HOPE) {
      onChange(current + 1);
    }
  };

  const handleDecrement = () => {
    if (current > 0) {
      setDialogOpen(true);
    }
  };

  const handleUseHope = (use: HopeUse) => {
    // Decrement the hope after the use is selected
    onChange(current - use.custo);
  };

  return (
    <>
      <div className="card-occult space-y-2">
        <h3 className="font-display text-sm text-primary uppercase">Esperança</h3>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleDecrement}
            disabled={current === 0}
            className="btn-occult p-1 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Minus size={16} />
          </button>

          <div className="flex gap-1 justify-center flex-1">
            {Array.from({ length: MAX_HOPE }).map((_, index) => (
              <div
                key={index}
                className={`w-6 h-6 border border-primary flex items-center justify-center text-xs transition-all duration-300 ${
                  index < current
                    ? 'bg-primary text-black'
                    : 'bg-black text-primary'
                }`}
                style={{
                  fontWeight: 700,
                  fontFamily: "'Roboto Mono', monospace",
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>

          <button
            onClick={handleIncrement}
            disabled={current === MAX_HOPE}
            className="btn-occult p-1 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="text-center">
          <span
            style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
            className="text-primary text-xs"
          >
            {current} / {MAX_HOPE}
          </span>
        </div>
      </div>

      <HopeUseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectUse={handleUseHope}
      />
    </>
  );
}
