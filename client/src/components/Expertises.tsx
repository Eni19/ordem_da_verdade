import { Trash2, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Expertise {
  id: string;
  name: string;
  modifier: number;
}

interface ExpertisesProps {
  expertises: Expertise[];
  onAddExpertise: () => void;
  onUpdateExpertise: (id: string, field: keyof Expertise, value: string | number) => void;
  onDeleteExpertise: (id: string) => void;
}

export default function Expertises({
  expertises,
  onAddExpertise,
  onUpdateExpertise,
  onDeleteExpertise,
}: ExpertisesProps) {
  return (
    <div className="card-occult flex flex-col gap-2 h-full min-h-0">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-sm text-primary uppercase">Expertises</h3>
        <button
          onClick={onAddExpertise}
          className="btn-occult text-xs px-2 py-1 flex items-center gap-1 flex-shrink-0"
        >
          <Plus size={12} />
          ADD
        </button>
      </div>

      <ScrollArea className="flex-1 border border-primary bg-black p-2 min-h-0">
        <div className="space-y-2 pr-3">
          {expertises.length === 0 ? (
            <div className="flex items-center justify-center text-muted-foreground text-center py-4">
              <p className="font-mono text-xs">Comece com 2 expertises</p>
            </div>
          ) : (
            expertises.map((expertise) => (
              <div key={expertise.id} className="bg-black border border-primary p-2 space-y-1 flex-shrink-0">
                <div className="flex items-start justify-between gap-1">
                  <input
                    type="text"
                    value={expertise.name}
                    onChange={(e) => onUpdateExpertise(expertise.id, 'name', e.target.value)}
                    className="flex-1 min-w-0 bg-transparent border-b border-primary text-primary font-display text-xs focus:outline-none focus:ring-0 uppercase"
                    placeholder="Nome"
                  />
                  <button
                    onClick={() => onDeleteExpertise(expertise.id)}
                    className="text-primary hover:text-secondary transition-colors p-0 flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <label className="font-display text-xs text-primary uppercase flex-shrink-0">Mod:</label>
                  <div className="flex items-center gap-0.5">
                    <span className="font-display text-primary text-xs">+</span>
                    <input
                      type="number"
                      value={expertise.modifier}
                      onChange={(e) => onUpdateExpertise(expertise.id, 'modifier', parseInt(e.target.value) || 0)}
                      style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
                      className="w-8 bg-input border border-primary text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary text-xs p-0.5"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
