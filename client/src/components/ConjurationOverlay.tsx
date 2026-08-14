import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { Card, drawCard, getConjurationEffect, evaluate5CardHand, getTargetResistanceDT, createDeck, HandGrade } from '@/utils/pokerLogic';
import BlackHole from './BlackHole';

export type ConjurationPhase = 'draw' | 'discard_roll' | 'discard_select' | 'omen_select' | 'decision' | 'showdown' | 'immediate_showdown';

export interface PokerConjureState {
  ritualId: string;
  turn: number;
  phase: ConjurationPhase;
  deck: Card[];
  hand: Card[];
  discardLimit: number;
  selectedCards: number[];
}

interface ConjurationOverlayProps {
  state: PokerConjureState;
  setState: React.Dispatch<React.SetStateAction<PokerConjureState | null>>;
  ritualName: string;
  ritualCircle: string;
  ritualType: 'dano' | 'aflicao' | 'suporte';
  ocultismoLevel: string; // e.g. 'treinado', 'veterano', 'expert'
  inteligencia: number;
  presenca: number;
  getRollConfig: (attr: 'força' | 'agilidade' | 'inteligência' | 'presença' | 'vigor') => {
    attributeValue: number;
    trainingDie: number;
    wasSwapped: boolean;
    realAttribute: string;
  };
  onClose: () => void;
  onConclude: (effect: SpellEffect) => void;
  isRetained?: boolean;
  onSuspend?: (state: PokerConjureState) => void;
  defensiveCharges: number;
  onConsumeDefensiveCharge: () => void;
}

function DraggablePokerCard({
  card,
  index,
  draggedIndex,
  setDraggedIndex,
  onReorder,
  toggleCardSelection,
  isSelected,
  phase,
  isFlipped = false,
  isNewlyDrawn = false
}: {
  card: Card;
  index: number;
  draggedIndex: number | null;
  setDraggedIndex: (i: number | null) => void;
  onReorder: (dragged: number, target: number) => void;
  toggleCardSelection: (i: number) => void;
  isSelected: boolean;
  phase: string;
  isFlipped?: boolean;
  isNewlyDrawn?: boolean;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentTx = useRef(0);
  const currentTy = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentTx.current = 0;
    currentTy.current = 0;

    setDraggedIndex(index);

    if (elRef.current) {
      elRef.current.setPointerCapture(e.pointerId);
      elRef.current.style.zIndex = '50';
      anime.remove(elRef.current);
      anime({
        targets: elRef.current,
        scale: 1.1,
        boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)',
        duration: 40,
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

    setDraggedIndex(null);

    // If it was just a click, toggle selection
    if (Math.abs(currentTx.current) < 5 && Math.abs(currentTy.current) < 5) {
      if (phase === 'discard_select' || phase === 'showdown') {
        toggleCardSelection(index);
      }
    }

    anime.remove(elRef.current);
    anime({
      targets: elRef.current,
      scale: 1,
      translateX: 0,
      translateY: 0,
      boxShadow: '0 0 0px rgba(0,0,0,0)',
      duration: 300,
      easing: 'easeOutElastic(1, .8)',
    });

    const parent = elRef.current.parentElement;
    if (parent) {
      const myRect = elRef.current.getBoundingClientRect();
      const myCenter = myRect.left + myRect.width / 2;

      const children = Array.from(parent.children) as HTMLElement[];
      let targetIndex: number | null = null;

      for (const child of children) {
        if (child === elRef.current) continue;
        const rect = child.getBoundingClientRect();
        if (myCenter > rect.left && myCenter < rect.right) {
          const idxStr = child.getAttribute('data-index');
          if (idxStr) {
            targetIndex = parseInt(idxStr);
            break;
          }
        }
      }

      if (targetIndex !== null && targetIndex !== index) {
        onReorder(index, targetIndex);
      }
    }
  };

  const suitSymbol = card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : card.suit === 'spades' ? '♠' : '🃏';

  const getCardTextColor = (suit: string) => {
    switch (suit) {
      case 'hearts': return 'text-red-600';
      case 'diamonds': return 'text-amber-500'; // Dourado
      case 'clubs': return 'text-purple-600'; // Roxo
      case 'spades': return 'text-neutral-900'; // Preto
      default: return 'text-black';
    }
  };

  const getCardBorderColor = (suit: string) => {
    switch (suit) {
      case 'hearts': return 'border-red-200';
      case 'diamonds': return 'border-amber-300';
      case 'clubs': return 'border-purple-300';
      case 'spades': return 'border-gray-400';
      default: return 'border-gray-300';
    }
  };

  const textColor = getCardTextColor(card.suit);
  const borderColor = isSelected ? 'border-purple-500' : getCardBorderColor(card.suit);

  const isAnotherDragging = draggedIndex !== null && draggedIndex !== index;
  const opacityClass = isAnotherDragging ? 'opacity-50' : 'opacity-100';

  return (
    <div
      ref={elRef}
      data-index={index}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none', perspective: '1000px' }}
      className={`poker-card relative w-24 h-36 md:w-32 md:h-48 cursor-grab active:cursor-grabbing select-none ${opacityClass} ${isSelected ? '-translate-y-4' : ''} ${isNewlyDrawn ? 'opacity-0' : ''}`}
    >
      <div
        className="poker-card-inner relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* FRONT */}
        <div
          className={`absolute inset-0 rounded-xl bg-white border-2 flex flex-col justify-between p-2 transition-colors ${textColor} ${borderColor} ${isSelected ? 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' : ''}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-lg md:text-xl font-bold leading-none">{card.rank}</div>
          <div className="text-3xl md:text-5xl text-center flex-1 flex items-center justify-center">{suitSymbol}</div>
          <div className="text-lg md:text-xl font-bold leading-none rotate-180">{card.rank}</div>
          {isSelected && <div className="absolute inset-0 bg-purple-500/10 rounded-xl pointer-events-none"></div>}
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-xl border-2 border-purple-500/50 bg-black overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.8)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <img src="/verso_medo.png" alt="Card Back" className="w-full h-full object-cover opacity-90" draggable="false" />
        </div>
      </div>
    </div>
  );
}

function AnimatedText({ text, className = '' }: { text: string; className?: string }) {
  // We split by spaces but preserve them by adding margin or an explicit space
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block showdown-word opacity-0 translate-y-3 mr-1">
          {word}
        </span>
      ))}
    </span>
  );
}

function BalatroDeck({ count }: { count: number }) {
  const deckRef = useRef<HTMLDivElement>(null);
  const thickness = Math.min(count, 52) / 4;
  const layers = Array.from({ length: Math.ceil(thickness) });

  return (
    <div id="balatro-deck" ref={deckRef} className="absolute bottom-12 left-12 md:bottom-16 md:left-16 w-24 h-36 md:w-32 md:h-48 z-40" style={{ perspective: '1000px' }}>
      {layers.map((_, i) => (
        <div
          key={i}
          id={i === layers.length - 1 ? 'balatro-deck-top' : undefined}
          className="absolute inset-0 rounded-xl border-2 border-purple-500/50 bg-black overflow-hidden"
          style={{
            transform: `translate(-${i * 1.5}px, -${i * 1.5}px)`,
            boxShadow: i === 0 ? '5px 5px 15px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          <img src="/verso_medo.png" alt="" className="w-full h-full object-cover opacity-90" draggable="false" />
        </div>
      ))}
      {count > 0 && (
        <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] pointer-events-none" style={{ transform: `translate(-${layers.length * 1.5}px, -${layers.length * 1.5}px)` }}></div>
      )}
      <div className="absolute bottom-full mb-2 left-0 text-purple-300 font-bold text-xs md:text-sm tracking-widest whitespace-nowrap">{count} CARTAS</div>
    </div>
  );
}

export default function ConjurationOverlay({
  state,
  setState,
  ritualName,
  ritualCircle,
  ritualType,
  ocultismoLevel,
  inteligencia,
  presenca,
  getRollConfig,
  onClose,
  onConclude,
  isRetained = false,
  onSuspend,
  defensiveCharges,
  onConsumeDefensiveCharge,
}: ConjurationOverlayProps) {
  const [showdownResult, setShowdownResult] = useState<{ grade: HandGrade; handName: string; best5: Card[] } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [animatingIndices, setAnimatingIndices] = useState<number[]>([]);
  const handRef = useRef<HTMLDivElement>(null);
  const actionWrapperRef = useRef<HTMLDivElement>(null);
  const hasAnimatedInitialHand = useRef(false);

  // Define Hand Size based on Intelligence or Presence (highest)
  const baseAttr = Math.max(inteligencia, presenca);
  const getHandSize = (attrValue: number, currentTurn: number) => {
    if (attrValue <= 1) return 5;
    if (attrValue === 2) return 6;
    if (attrValue === 3) return currentTurn === 3 ? 7 : 6;
    if (attrValue === 4) return 7;
    return 8;
  };
  const handSize = getHandSize(baseAttr, state?.turn || 1);

  const getDiscardLimit = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert': return 4;
      case 'veterano': return 3;
      case 'treinado': return 2;
      default: return 2;
    }
  };
  const currentDiscardLimit = getDiscardLimit(ocultismoLevel);

  useEffect(() => {
    if (state.phase === 'draw' && state.deck.length === 0) {
      const initialDeck = createDeck();
      const { drawnCards, newDeck } = drawCard(initialDeck, handSize);

      setAnimatingIndices(drawnCards.map((_, i) => i));

      setState(prev => prev ? {
        ...prev,
        deck: newDeck,
        hand: drawnCards,
        discardLimit: currentDiscardLimit,
        phase: 'discard_select',
        selectedCards: []
      } : prev);
    }
  }, [state.phase, state.deck.length, handSize, currentDiscardLimit, setState]);

  useEffect(() => {
    if (animatingIndices.length > 0) {
      const deckEl = document.getElementById('balatro-deck-top') || document.getElementById('balatro-deck');
      if (!deckEl) {
        setAnimatingIndices([]);
        return;
      }
      const deckRect = deckEl.getBoundingClientRect();

      const tl = anime.timeline({
        complete: () => {
          setAnimatingIndices([]);
        }
      });

      animatingIndices.forEach((idx, i) => {
        const cardEl = document.querySelector(`.poker-card[data-index="${idx}"]`) as HTMLElement;
        if (!cardEl) return;
        const cardRect = cardEl.getBoundingClientRect();

        anime.set(cardEl, { opacity: 1 });

        const dx = (deckRect.left + deckRect.width / 2) - (cardRect.left + cardRect.width / 2);
        const dy = (deckRect.top + deckRect.height / 2) - (cardRect.top + cardRect.height / 2);

        const inner = cardEl.querySelector('.poker-card-inner');
        const delayIndex = animatingIndices.length - 1 - i;

        tl.add({
          targets: cardEl,
          translateX: [dx, 0],
          translateY: [dy, 0],
          scale: [1, 1],
          duration: 600,
          easing: 'easeOutQuint'
        }, delayIndex * 150)
          .add({
            targets: inner,
            rotateY: [180, 0],
            duration: 600,
            easing: 'easeOutBack'
          }, delayIndex * 150 + 200);
      });
    }
  }, [animatingIndices, state.hand]);

  useEffect(() => {
    if (state?.phase === 'discard_select') {
      anime.timeline()
        .add({
          targets: '.discard-line-1',
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 800,
          easing: 'easeOutExpo'
        })
        .add({
          targets: '.discard-line-2',
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 1000,
          easing: 'easeOutExpo'
        }, '-=600')
        .add({
          targets: '.discard-btn',
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 1200,
          easing: 'easeOutElastic(1, .8)'
        }, '-=600');
    }
  }, [state?.phase]);

  useEffect(() => {
    // Triggers the 7th card extra draw on turn 3 exactly when the player is viewing the hand
    if (state.phase === 'discard_select' && state.turn === 3 && baseAttr === 3 && state.hand.length === 6) {
      const timer = setTimeout(() => {
        setState(prev => {
          if (!prev || prev.turn !== 3 || prev.hand.length !== 6) return prev;
          const draw = drawCard(prev.deck, 1);
          const newHand = [...prev.hand, ...draw.drawnCards];
          setAnimatingIndices([newHand.length - 1]);
          return { ...prev, deck: draw.newDeck, hand: newHand };
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.turn, baseAttr, state.hand.length, setState]);

  useEffect(() => {
    if (showdownResult) {
      const tl = anime.timeline({
        easing: 'easeOutExpo'
      });

      tl.add({
        targets: '.showdown-container',
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 800,
      });

      tl.add({
        targets: '.showdown-card',
        translateY: [30, 0],
        opacity: [0, 1],
        rotateZ: () => anime.random(-10, 10),
        delay: anime.stagger(150),
        duration: 800,
      }, '-=400');

      tl.add({
        targets: '.showdown-title, .showdown-stat',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        duration: 800,
      }, '-=200');

      tl.add({
        targets: '.showdown-word',
        opacity: [0, 1],
        translateY: [10, 0],
        scale: [0.9, 1],
        delay: anime.stagger(30),
        duration: 600,
        easing: 'easeOutBack'
      }, '-=400');
      
      tl.add({
        targets: '.showdown-btn',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800
      }, '-=200');
    }
  }, [showdownResult]);

  const toggleCardSelection = (index: number) => {
    if (state.phase !== 'discard_select' && state.phase !== 'showdown') return;

    setState(prev => {
      if (!prev) return prev;
      const isSelected = prev.selectedCards.includes(index);
      if (isSelected) {
        return { ...prev, selectedCards: prev.selectedCards.filter(i => i !== index) };
      } else {
        const limit = prev.phase === 'showdown' ? 5 : prev.discardLimit;
        if (prev.selectedCards.length < limit) {
          return { ...prev, selectedCards: [...prev.selectedCards, index] };
        }
        return prev;
      }
    });
  };

  const handleDiscardAndReplace = () => {
    if (!state.selectedCards.length) {
      const nextPhase = state.turn === 3 ? 'showdown' : 'decision';
      setState(prev => prev ? { ...prev, phase: nextPhase, selectedCards: [] } : prev);
      return;
    }

    const { drawnCards, newDeck } = drawCard(state.deck, state.selectedCards.length);
    const newHand = [...state.hand];
    const replacedIndices: number[] = [];

    let drawIndex = 0;
    for (let i = 0; i < state.hand.length; i++) {
      if (state.selectedCards.includes(i)) {
        newHand[i] = drawnCards[drawIndex++];
        replacedIndices.push(i);
      }
    }

    setAnimatingIndices(replacedIndices);

    const nextPhase = state.turn === 3 ? 'showdown' : 'decision';
    setState(prev => prev ? {
      ...prev,
      deck: newDeck,
      hand: newHand,
      phase: nextPhase,
      selectedCards: []
    } : prev);
  };

  const handleOmenSelect = (cardIndexInDeck: number) => {
    const chosenCard = state.deck[cardIndexInDeck];
    const newDeck = state.deck.filter((_, idx) => idx !== cardIndexInDeck);
    const newHand = [...state.hand];
    newHand[0] = chosenCard;

    setAnimatingIndices([0]);

    const nextPhase = state.turn === 3 ? 'showdown' : 'decision';
    
    setState(prev => prev ? {
      ...prev,
      deck: newDeck,
      hand: newHand,
      phase: nextPhase,
      selectedCards: []
    } : prev);
  };

  const handleSustentarTranse = () => {
    if (!isRetained) {
      setState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          turn: prev.turn + 1,
          discardLimit: currentDiscardLimit,
          phase: 'discard_select',
          selectedCards: []
        };
      });
      onClose(); 
      return;
    }

    if (actionWrapperRef.current) {
      anime({
        targets: actionWrapperRef.current,
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInOutQuad',
        complete: () => {
          setState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              turn: prev.turn + 1,
              discardLimit: currentDiscardLimit,
              phase: 'discard_select',
              selectedCards: []
            };
          });
          
          anime({
            targets: actionWrapperRef.current,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeInOutQuad'
          });
        }
      });
    } else {
      setState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          turn: prev.turn + 1,
          discardLimit: currentDiscardLimit,
          phase: 'discard_select',
          selectedCards: []
        };
      });
    }
  };

  const handleShowdown = () => {
    if (state.hand.length > 5 && state.selectedCards.length === 5) {
      const finalHand = state.selectedCards.map(idx => state.hand[idx]);
      if (isRetained && onSuspend) {
        onSuspend({ ...state, hand: finalHand, phase: 'showdown', selectedCards: [] });
      } else {
        const evaluation = evaluate5CardHand(finalHand);
        setShowdownResult({ grade: evaluation.grade, handName: evaluation.name, best5: finalHand });
      }
    } else {
      if (isRetained && onSuspend) {
        onSuspend({ ...state, phase: 'showdown', selectedCards: [] });
      } else {
        const evaluation = evaluate5CardHand(state.hand);
        setShowdownResult({ grade: evaluation.grade, handName: evaluation.name, best5: state.hand });
      }
    }
  };

  const initiateShowdown = () => {
    if (state.hand.length > 5) {
      setState(prev => prev ? { ...prev, phase: 'showdown', selectedCards: [] } : prev);
    } else {
      if (isRetained && onSuspend) {
        onSuspend({ ...state, phase: 'showdown', selectedCards: [] });
      } else {
        const evaluation = evaluate5CardHand(state.hand);
        setShowdownResult({ grade: evaluation.grade, handName: evaluation.name, best5: state.hand });
      }
    }
  };

  useEffect(() => {
    if (state.phase === 'immediate_showdown') {
      const evaluation = evaluate5CardHand(state.hand);
      setShowdownResult({ grade: evaluation.grade, handName: evaluation.name, best5: state.hand });
    }
  }, [state.phase, state.hand]);

  const handleReorder = (draggedIdx: number, targetIdx: number) => {
    if (draggedIdx === targetIdx) return;

    const newHand = [...state.hand];
    const [draggedCard] = newHand.splice(draggedIdx, 1);
    newHand.splice(targetIdx, 0, draggedCard);

    let newSelectedCards = state.selectedCards.map(selectedIndex => {
      if (selectedIndex === draggedIdx) return targetIdx;
      if (draggedIdx < targetIdx) {
        if (selectedIndex > draggedIdx && selectedIndex <= targetIdx) return selectedIndex - 1;
      } else {
        if (selectedIndex >= targetIdx && selectedIndex < draggedIdx) return selectedIndex + 1;
      }
      return selectedIndex;
    });

    setState(prev => prev ? { ...prev, hand: newHand, selectedCards: newSelectedCards } : prev);
  };



  if (showdownResult) {
    const effect = getConjurationEffect(showdownResult.grade, (parseInt(ritualCircle) || 1) as 1 | 2 | 3, isRetained);
    const dt = getTargetResistanceDT(showdownResult.grade, parseInt(ritualCircle) || 1);

    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
        <div className="absolute inset-0 opacity-70">
          <BlackHole centre={{ voidY: 35 }} orbitSpeed={3} particleCount={800} colors={['#a855f7', '#d8b4fe', '#ffffff']} outerRadius={100} tilt={15} tiltSideway={170} pullSpeed={1.5} />
        </div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="showdown-container opacity-0 max-w-2xl w-full border-2 border-purple-500 bg-black/80 backdrop-blur-sm p-6 space-y-6 text-center shadow-[0_0_50px_rgba(168,85,247,0.3)] relative z-10">
          <h2 className="showdown-title opacity-0 text-3xl font-display text-purple-300 uppercase tracking-widest">Showdown</h2>

          <div className="flex justify-center gap-2">
            {showdownResult.best5.map((c, i) => (
              <div key={i} className={`showdown-card opacity-0 w-16 h-24 sm:w-20 sm:h-28 flex flex-col justify-between p-2 rounded bg-white shadow-md border ${c.suit === 'hearts' ? 'border-red-200 text-red-600' :
                  c.suit === 'diamonds' ? 'border-amber-300 text-amber-500' :
                    c.suit === 'clubs' ? 'border-purple-300 text-purple-600' :
                      'border-gray-400 text-neutral-900'
                }`}>
                <div className="text-sm sm:text-base font-bold text-left">{c.rank}</div>
                <div className="text-2xl sm:text-3xl text-center">
                  {c.suit === 'hearts' ? '♥' : c.suit === 'diamonds' ? '♦' : c.suit === 'clubs' ? '♣' : c.suit === 'spades' ? '♠' : '🃏'}
                </div>
              </div>
            ))}
          </div>

          <div className="showdown-title opacity-0 text-2xl text-purple-200 font-bold uppercase">{showdownResult.handName} (Grau {showdownResult.grade})</div>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-purple-500/50 py-4">
            <div className="showdown-stat opacity-0">
              <div className="text-xs text-purple-400 uppercase font-bold">Conjuração</div>
              <div className={`text-lg font-bold ${(effect === 'Desastre' || effect === 'Falha') ? 'text-red-400' : effect === 'Anomalia Narrativa' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse' : 'text-purple-100'}`}>{effect}</div>
            </div>
            <div className="showdown-stat opacity-0">
              <div className="text-xs text-purple-400 uppercase font-bold">DT do Ritual</div>
              <div className="text-lg text-purple-100">{dt}</div>
            </div>
          </div>
          
          <div className="text-sm text-purple-300 bg-purple-900/20 p-4 border border-purple-500/30 rounded text-left leading-relaxed min-h-[100px]">
            {effect === 'Desastre' && (
              <span><AnimatedText className="text-red-500 font-bold" text="Desastre:" /> <AnimatedText className="text-red-400" text="O ritual falha catastroficamente. A energia volta contra o Ocultista, causando consequências severas e rompendo o tecido da realidade ao seu redor, sem manifestar o efeito desejado do ritual." /></span>
            )}
            {effect === 'Falha' && (
              <span><AnimatedText className="text-red-400 font-bold" text="Falha:" /> <AnimatedText className="text-red-300" text="O ritual falha e a energia dissipada do Outro Lado estressa a mente do conjurador." /></span>
            )}
            {effect === 'Padrão' && (
              <span><AnimatedText className="text-white font-bold" text="Padrão:" /> <AnimatedText text="O feitiço funciona na sua versão básica." /></span>
            )}
            {effect === 'Discente' && (
              <span><AnimatedText className="text-white font-bold" text="Discente:" /> <AnimatedText text="O feitiço funciona na sua versão aprimorada (Discente)." /></span>
            )}
            {effect === 'Discente Maximizado' && ritualType === 'dano' && (
              <span><AnimatedText className="text-amber-400 font-bold" text="Discente Maximizado - Dano (Sobrecarga Bruta):" /> <AnimatedText text="A aleatoriedade é obliterada. O jogador não rola os dados de dano ou de cura. O ritual aplica automaticamente o valor numérico máximo possível da sua forma Discente (Exemplo: Um ritual que curaria 5d12 restaura instantaneamente 60 pontos)." /></span>
            )}
            {effect === 'Discente Maximizado' && ritualType === 'aflicao' && (
              <span><AnimatedText className="text-amber-400 font-bold" text="Discente Maximizado - Aflição (Decreto Inevitável):" /> <AnimatedText text="A distorção é inescapável. O alvo perde o direito ao teste de resistência. A condição, penalidade ou aflição descrita na versão Discente é aplicada em sua totalidade, ignorando a fortitude física ou mental da criatura." /></span>
            )}
            {effect === 'Discente Maximizado' && ritualType === 'suporte' && (
              <span><AnimatedText className="text-amber-400 font-bold" text="Discente Maximizado - Suporte (Expansão de Domínio):" /> <AnimatedText text="Magias que manipulam a realidade, o ambiente ou oferecem suporte rompem suas limitações físicas. O Ocultista escolhe uma expansão: Multiplicação (dobra o número de alvos permitidos), Projeção (aumenta o alcance em um passo, ex: Curto para Médio) ou Propagação (controle absoluto e customizado sobre a área de efeito)." /></span>
            )}
            {effect === 'Anomalia Narrativa' && (
              <span><AnimatedText className="text-cyan-400 font-bold" text="Anomalia Narrativa:" /> <AnimatedText text="O Ritual atinge um patamar além das métricas. Ocorre de maneira inteiramente narrativa entre o Mestre e o jogador, que colaboram para descrever como a manifestação poderosa altera drasticamente as leis do ambiente e soluciona o conflito." /></span>
            )}
          </div>

          <button onClick={() => onConclude(effect)} className="showdown-btn opacity-0 px-8 py-3 bg-purple-500 text-black font-bold uppercase hover:bg-purple-400 transition-colors">
            Finalizar Transe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <BlackHole centre={{ voidY: 35 }} orbitSpeed={0.5 + state.turn * 0.5} particleCount={600 + state.turn * 150} colors={['#a855f7', '#c084fc', '#ffffff']} outerRadius={80 + state.turn * 10} tilt={20} tiltSideway={160} pullSpeed={(state.turn - 1) * 0.5} />
      </div>
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="absolute top-8 text-center space-y-2 relative z-10">
        <h2 className="text-3xl md:text-5xl font-display text-purple-300 uppercase tracking-widest" style={{ textShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
          Transe: {ritualName}
        </h2>
        <div className="text-purple-400 font-bold uppercase tracking-wide">
          Turno {state.turn} de 3
        </div>
      </div>

      <div className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center gap-8 mt-16">

        {/* ACTION AREA */}
        <div ref={actionWrapperRef} className="flex items-center justify-center w-full relative z-30">
          {state.phase === 'discard_select' && (
            <div className="text-center space-y-6 max-w-lg w-full">
              <div className="text-purple-200">
                <div className="discard-line-1 opacity-0 text-lg mt-2">
                  Sua técnica de ocultismo permite até <span className="font-bold text-purple-400 text-4xl mx-2" style={{ textShadow: '0 0 20px rgba(168,85,247,0.8)' }}>{state.discardLimit}</span> descartes.
                </div>
              </div>
              <button
                onClick={handleDiscardAndReplace}
                className="discard-btn opacity-0 translate-y-4 px-8 py-3 border-2 border-purple-500 text-purple-300 font-bold uppercase hover:bg-purple-500 hover:text-black transition-colors relative z-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                {state.selectedCards.length > 0 ? `Descartar ${state.selectedCards.length} cartas` : 'Manter a Mão'}
              </button>
            </div>
          )}

          {state.phase === 'omen_select' && (
            <div className="text-center space-y-4 w-full max-w-2xl relative z-50">
              <div className="text-yellow-400 font-bold text-xl uppercase tracking-widest animate-pulse">PRESSÁGIO 20!</div>
              <div className="text-purple-200 text-sm">Escolha uma carta do baralho para adicionar à sua mão (substituirá a 1ª carta).</div>
              <select
                className="w-full bg-black border border-purple-500 text-purple-200 p-2 outline-none h-10"
                onChange={(e) => {
                  if (e.target.value) handleOmenSelect(Number(e.target.value));
                }}
              >
                <option value="">-- Buscar no Baralho --</option>
                {state.deck.map((c, i) => (
                  <option key={i} value={i}>{c.rank} de {c.suit}</option>
                ))}
              </select>
            </div>
          )}

          {state.phase === 'decision' && (
            <div className="flex flex-col gap-4 relative z-50">
              <div className="flex gap-4 justify-center">
                {state.turn < 3 && (
                  <button onClick={handleSustentarTranse} className="px-6 py-3 border-2 border-purple-500 text-purple-300 font-bold uppercase hover:bg-purple-500/20 transition-colors">
                    Sustentar Ritual
                  </button>
                )}
                {state.turn > 1 ? (
                  <button onClick={initiateShowdown} className="px-8 py-3 bg-purple-500 text-black font-bold uppercase text-lg hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
                    Showdown
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (defensiveCharges <= 0) return;
                      onConsumeDefensiveCharge();
                      initiateShowdown();
                    }} 
                    disabled={defensiveCharges <= 0}
                    className="px-6 py-3 border-2 border-red-500 text-red-400 font-bold uppercase text-sm hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:shadow-none transition-all flex flex-col items-center justify-center"
                  >
                    <span>Conjuração Impulsiva</span>
                    <span className="text-xs opacity-80">(Gasta 1 Carga Defensiva)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {state.phase === 'showdown' && (
            <div className="text-center space-y-4 relative z-50">
              <div className="text-purple-200">Sua mão estendida possui {state.hand.length} cartas. Selecione exatamente 5 para o Showdown.</div>
              <button
                onClick={handleShowdown}
                disabled={state.selectedCards.length !== 5}
                className="px-8 py-3 bg-purple-500 text-black font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar 5 Cartas
              </button>
            </div>
          )}
        </div>

        {/* HAND AREA */}
        <div ref={handRef} className="flex justify-center gap-2 md:gap-4 flex-wrap mt-8 relative z-50">
          {state.hand.map((card, index) => (
            <DraggablePokerCard
              key={`${card.rank}-${card.suit}`}
              card={card}
              index={index}
              draggedIndex={draggedIndex}
              setDraggedIndex={setDraggedIndex}
              onReorder={handleReorder}
              toggleCardSelection={toggleCardSelection}
              isSelected={state.selectedCards.includes(index)}
              phase={state.phase}
              isFlipped={animatingIndices.includes(index)}
              isNewlyDrawn={animatingIndices.includes(index)}
            />
          ))}
        </div>

      </div>

      <BalatroDeck count={state.deck.length} />

      <div className="absolute top-8 right-8 flex gap-4 z-50">
        <button
          onClick={() => setShowGuide(true)}
          className="text-purple-300 border border-purple-500 px-4 py-2 hover:bg-purple-500/20 uppercase text-xs font-bold transition-colors cursor-pointer"
        >
          Guia de Mãos
        </button>
        <button
          onClick={onClose}
          className="text-purple-300 border border-purple-500 px-4 py-2 hover:bg-purple-500/20 uppercase text-xs font-bold transition-colors"
        >
          Minimizar Transe (Pausar)
        </button>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full border-2 border-purple-500/50 bg-neutral-950 p-6 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-purple-500/30 pb-2">
              <h3 className="text-xl font-display text-purple-300 tracking-wider">GUIA DE MÃOS E GRAUS</h3>
              <button onClick={() => setShowGuide(false)} className="text-purple-400 hover:text-purple-300 font-bold text-lg">✕</button>
            </div>
            <div className="space-y-3 text-sm text-purple-200 font-mono">
              <div className="flex justify-between border-b border-purple-900/40 pb-1">
                <span className="font-bold text-yellow-400">Grau 5</span>
                <span>Quina / Royal Flush</span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-1">
                <span className="font-bold text-purple-300">Grau 4</span>
                <span>Quadra / Straight Flush</span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-1">
                <span className="font-bold text-purple-400">Grau 3</span>
                <span>Full House / Flush / Sequência</span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-1">
                <span className="font-bold text-purple-400/80">Grau 2</span>
                <span>Trinca / Dois Pares</span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-1">
                <span className="font-bold text-purple-500">Grau 1</span>
                <span>Um Par</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="font-bold text-neutral-500">Grau 0</span>
                <span>Carta Alta</span>
              </div>
            </div>
            <div className="pt-2 text-xs text-purple-400/80 text-center italic">
              Obs: Curingas (Jokers) substituem qualquer carta para formar a melhor combinação possível.
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 bg-purple-500/20 border border-purple-500 text-purple-300 font-bold uppercase hover:bg-purple-500 hover:text-black transition-colors rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
