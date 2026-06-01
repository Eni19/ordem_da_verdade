import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Skill {
  id: string;
  name: string;
  origin: string;
  cost: string;
  effect: string;
}

interface SkillsListProps {
  skills: Skill[];
  onUpdateSkill: (id: string, field: keyof Skill, value: string | number | boolean) => void;
  onDeleteSkill: (id: string) => void;
  onReorderSkills: (draggedId: string, targetId: string) => void;
}

export default function SkillsList({ skills, onUpdateSkill, onDeleteSkill, onReorderSkills }: SkillsListProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null);
  const [pendingDeleteSkill, setPendingDeleteSkill] = useState<Skill | null>(null);
  const [exitingSkillId, setExitingSkillId] = useState<string | null>(null);

  const scrollCards = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const amount = direction === 'left' ? -340 : 340;
    carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 border-2 border-primary bg-black p-3 min-h-0 flex flex-col gap-3">
      {skills.length > 0 && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => scrollCards('left')}
            className="w-8 h-8 border border-primary text-primary hover:bg-primary hover:text-black transition-colors flex items-center justify-center"
            aria-label="Mover carrossel para a esquerda"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scrollCards('right')}
            className="w-8 h-8 border border-primary text-primary hover:bg-primary hover:text-black transition-colors flex items-center justify-center"
            aria-label="Mover carrossel para a direita"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div ref={carouselRef} className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex gap-4 pr-6 min-w-max items-stretch py-2">
        {skills.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground text-center py-10 w-full min-w-[20rem]">
            <p className="font-mono text-sm">Nenhuma habilidade adicionada ainda.</p>
          </div>
        ) : (
          skills.map((skill) => (
            <div
              key={skill.id}
              draggable
              onDragStart={(e) => {
                setDraggedSkillId(skill.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', skill.id);
              }}
              onDragEnd={() => setDraggedSkillId(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain') || draggedSkillId;
                if (!draggedId) return;
                onReorderSkills(draggedId, skill.id);
                setDraggedSkillId(null);
              }}
              className={`border-2 p-5 bg-black space-y-3 flex-shrink-0 w-[20rem] min-h-[21.5rem] cursor-grab active:cursor-grabbing transition-all duration-300 ease-out transform animate-in fade-in-50 slide-in-from-top-2 ${
                draggedSkillId === skill.id
                  ? 'border-secondary opacity-80 scale-[0.98]'
                  : exitingSkillId === skill.id
                    ? 'border-secondary opacity-0 scale-[0.96] -translate-y-2 pointer-events-none'
                    : 'border-primary opacity-100 translate-y-0'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => onUpdateSkill(skill.id, 'name', e.target.value)}
                  className="flex-1 min-w-0 bg-transparent border-b border-primary text-primary font-display text-base focus:outline-none focus:ring-0 uppercase"
                  placeholder="Nome da Habilidade"
                />
                <button
                  onClick={() => setPendingDeleteSkill(skill)}
                  className="text-primary hover:text-secondary transition-colors p-0 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-display text-[11px] text-primary uppercase">Origem</label>
                  <input
                    type="text"
                    value={skill.origin}
                    onChange={(e) => onUpdateSkill(skill.id, 'origin', e.target.value)}
                    className="w-full bg-input border border-primary text-primary text-sm p-1 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                    placeholder="Origem"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-display text-[11px] text-primary uppercase">Custo</label>
                  <input
                    type="text"
                    value={skill.cost}
                    onChange={(e) => onUpdateSkill(skill.id, 'cost', e.target.value)}
                    className="w-full bg-input border border-primary text-primary text-sm p-1 focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-200"
                    placeholder="Custo"
                  />
                </div>
              </div>

              <textarea
                value={skill.effect}
                onChange={(e) => {
                  onUpdateSkill(skill.id, 'effect', e.target.value);
                  // Auto-expand textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + 'px';
                }}
                className="w-full bg-transparent border border-primary text-muted-foreground text-xs p-1 focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden transition-colors duration-200"
                placeholder="Efeito da habilidade"
                rows={4}
                style={{ minHeight: '220px' }}
              />
            </div>
          ))
        )}
        </div>
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteSkill)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteSkill(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir habilidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente a habilidade {pendingDeleteSkill?.name || 'selecionada'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDeleteSkill) return;
                const deletingId = pendingDeleteSkill.id;
                setExitingSkillId(deletingId);
                setPendingDeleteSkill(null);
                window.setTimeout(() => {
                  onDeleteSkill(deletingId);
                  setExitingSkillId(null);
                }, 220);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
