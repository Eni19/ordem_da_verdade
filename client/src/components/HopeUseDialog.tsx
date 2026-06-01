import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import hopeUses, { HopeUse } from '@/data/hope_use';

interface HopeUseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUse: (use: HopeUse) => void;
}

export function HopeUseDialog({
  open,
  onOpenChange,
  onSelectUse,
}: HopeUseDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (use: HopeUse) => {
    setSelectedId(use.id);
    onSelectUse(use);
    onOpenChange(false);
    setSelectedId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-2 border-primary max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-primary text-lg">
            Usar Esperança
          </DialogTitle>
          <p className="text-sm text-foreground mt-2">
            Escolha como você deseja usar sua esperança
          </p>
        </DialogHeader>

        <div className="grid gap-3 max-h-96 overflow-y-auto pr-4">
          {hopeUses.map((use) => (
            <div
              key={use.id}
              className={`p-4 border-2 transition-all duration-200 ${
                selectedId === use.id
                  ? 'border-primary bg-primary bg-opacity-10'
                  : 'border-primary bg-card hover:bg-opacity-5 cursor-default'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-primary text-sm mb-2">
                    {use.nome}
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed">
                    {use.efeito}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(use);
                    }}
                    className="text-xs font-mono font-bold bg-primary text-black px-3 py-1"
                  >
                    Usar Esperança
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-primary">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-card border-2 border-primary text-primary hover:bg-primary hover:text-black"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
