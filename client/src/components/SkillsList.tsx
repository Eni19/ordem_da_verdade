import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import anime from 'animejs';
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

function DraggableSkillCard({
  skill,
  draggedSkillId,
  setDraggedSkillId,
  exitingSkillId,
  onUpdateSkill,
  setPendingDeleteSkill,
  onReorderSkills,
}: {
  skill: Skill;
  draggedSkillId: string | null;
  setDraggedSkillId: (id: string | null) => void;
  exitingSkillId: string | null;
  onUpdateSkill: (id: string, field: keyof Skill, value: string | number | boolean) => void;
  setPendingDeleteSkill: (skill: Skill) => void;
  onReorderSkills: (draggedId: string, targetId: string) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentTx = useRef(0);
  const currentTy = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentTx.current = 0;
    currentTy.current = 0;

    setDraggedSkillId(skill.id);

    if (elRef.current) {
      elRef.current.setPointerCapture(e.pointerId);
      elRef.current.style.zIndex = '50';
      anime({
        targets: elRef.current,
        scale: 1.05,
        boxShadow: '0 0 20px rgba(255, 23, 68, 0.4)',
        duration: 50,
        easing: 'easeOutQuad',
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !elRef.current) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    currentTx.current = dx;
    currentTy.current = dy;

    anime.set(elRef.current, { translateX: currentTx.current, translateY: currentTy.current });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !elRef.current) return;
    isDragging.current = false;

    elRef.current.releasePointerCapture(e.pointerId);
    elRef.current.style.zIndex = '1';

    setDraggedSkillId(null);

    anime({
      targets: elRef.current,
      scale: 1,
      translateX: 0,
      translateY: 0,
      boxShadow: '0 0 0px rgba(0,0,0,0)',
      duration: 400,
      easing: 'easeOutElastic(1, .8)',
    });

    const parent = elRef.current.parentElement;
    if (parent) {
      const myRect = elRef.current.getBoundingClientRect();
      const myCenter = myRect.left + myRect.width / 2;

      const children = Array.from(parent.children) as HTMLElement[];
      let targetSkillId: string | null = null;

      for (const child of children) {
        if (child === elRef.current) continue;
        const rect = child.getBoundingClientRect();
        if (myCenter > rect.left && myCenter < rect.right) {
          targetSkillId = child.getAttribute('data-skill-id');
          break;
        }
      }

      if (targetSkillId && targetSkillId !== skill.id) {
        onReorderSkills(skill.id, targetSkillId);
      }
    }
  };

  const isExiting = exitingSkillId === skill.id;
  const isAnotherDragging = draggedSkillId && draggedSkillId !== skill.id;

  return (
    <div
      ref={elRef}
      data-skill-id={skill.id}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`border-2 p-5 bg-black space-y-3 flex-shrink-0 w-[20rem] min-h-[21.5rem] cursor-grab active:cursor-grabbing transition-opacity duration-300 relative select-none ${
        isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'
      } ${isAnotherDragging ? 'opacity-40' : 'opacity-100'} ${draggedSkillId === skill.id ? 'border-secondary' : 'border-primary'}`}
      style={{ touchAction: 'none' }}
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
          className="text-primary hover:text-secondary transition-colors p-0 flex-shrink-0 z-10"
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
  );
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
    <div className="flex-1 border-2 border-primary bg-black min-h-0 flex flex-col relative">
      {skills.length > 0 && (
        <div className="absolute top-3 right-3 flex gap-2 z-20">
          <button
            onClick={() => scrollCards('left')}
            className="w-8 h-8 border border-primary text-primary bg-black hover:bg-primary hover:text-black transition-colors flex items-center justify-center"
            aria-label="Mover carrossel para a esquerda"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scrollCards('right')}
            className="w-8 h-8 border border-primary text-primary bg-black hover:bg-primary hover:text-black transition-colors flex items-center justify-center"
            aria-label="Mover carrossel para a direita"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div ref={carouselRef} className="flex-1 overflow-x-auto overflow-y-hidden p-3 pt-12" style={{ touchAction: 'none' }}>
        <div className="flex gap-4 pr-6 min-w-max items-stretch pb-2">
          {skills.length === 0 ? (
            <div className="flex items-center justify-center text-muted-foreground text-center py-10 w-full min-w-[20rem]">
              <p className="font-mono text-sm">Nenhuma habilidade adicionada ainda.</p>
            </div>
          ) : (
            skills.map((skill) => (
              <DraggableSkillCard
                key={skill.id}
                skill={skill}
                draggedSkillId={draggedSkillId}
                setDraggedSkillId={setDraggedSkillId}
                exitingSkillId={exitingSkillId}
                onUpdateSkill={onUpdateSkill}
                setPendingDeleteSkill={setPendingDeleteSkill}
                onReorderSkills={onReorderSkills}
              />
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
