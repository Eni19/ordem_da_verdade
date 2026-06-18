import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { Card, drawCard, getConjurationEffect, evaluate5CardHand, getTargetResistanceDT, createDeck, HandGrade } from '@/utils/pokerLogic';

export interface PokerConjureState {
  ritualId: string;
  turn: number;
  phase: 'draw' | 'discard_roll' | 'discard_select' | 'omen_select' | 'decision' | 'showdown';
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
  ocultismoLevel: string; // e.g. 'treinado', 'veterano', 'expert'
  inteligencia: number;
  getRollConfig: (attr: 'força' | 'agilidade' | 'inteligência' | 'presença' | 'vigor') => {
    attributeValue: number;
    trainingDie: number;
    wasSwapped: boolean;
    realAttribute: string;
  };
  onClose: () => void;
  onConclude: () => void;
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
  ocultismoLevel,
  inteligencia,
  getRollConfig,
  onClose,
  onConclude,
}: ConjurationOverlayProps) {
  const [selectedAttribute, setSelectedAttribute] = useState<'força' | 'agilidade' | 'inteligência' | 'presença' | 'vigor'>('inteligência');
  const [localRollResult, setLocalRollResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceState, setDiceState] = useState<{ attrDie: number | string, skillDie: number | string, winner: 'attr' | 'skill' | null } | null>(null);
  const [showdownResult, setShowdownResult] = useState<{ grade: HandGrade; handName: string; best5: Card[] } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [animatingIndices, setAnimatingIndices] = useState<number[]>([]);
  const handRef = useRef<HTMLDivElement>(null);
  const actionWrapperRef = useRef<HTMLDivElement>(null);
  const hasAnimatedInitialHand = useRef(false);

  // Define Hand Size
  const handSize = 5 + (parseInt(ritualCircle) || 1); // 1st=6, 2nd=7, 3rd=8, 4th=9

  // Removemos a animação staggada estática antiga pois agora voaremos do baralho
  // useEffect(() => { ... }) foi removido

  useEffect(() => {
    if (state.phase === 'draw' && state.deck.length === 0) {
      // Initialize the deck and draw the first hand
      const initialDeck = createDeck();
      const { drawnCards, newDeck } = drawCard(initialDeck, handSize);

      setAnimatingIndices(drawnCards.map((_, i) => i)); // Anima todas as cartas

      setState(prev => prev ? {
        ...prev,
        deck: newDeck,
        hand: drawnCards,
        phase: 'discard_roll'
      } : prev);
    }
  }, [state.phase, state.deck.length, handSize, setState]);

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
        
        // Compensate for the opacity-0 class logic
        anime.set(cardEl, { opacity: 1 });

        // Calculate delta from deck center to card center to account for transform-origin and scale
        const dx = (deckRect.left + deckRect.width / 2) - (cardRect.left + cardRect.width / 2);
        const dy = (deckRect.top + deckRect.height / 2) - (cardRect.top + cardRect.height / 2);

        const inner = cardEl.querySelector('.poker-card-inner');

        // Reverse the animation order: last DOM elements (visually on top) fly first!
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

  const getAttrDiceConfig = (rawAttrValue: any): { qty: number, sides: number } => {
    const attrValue = Number(rawAttrValue);
    if (isNaN(attrValue) || attrValue <= 1) return { qty: 1, sides: 6 };
    if (attrValue === 2) return { qty: 1, sides: 8 };
    if (attrValue === 3) return { qty: 1, sides: 10 };
    if (attrValue === 4) return { qty: 1, sides: 12 };
    return { qty: 2, sides: 12 };
  };

  const handleRollFiltragem = () => {
    setIsRolling(true);
    setDiceState({ attrDie: '?', skillDie: '?', winner: null });

    // Reseta todos os estilos de animações anteriores para que nada comece escuro, borrado ou distorcido
    anime.set('.conjure-die-attr, .conjure-die-skill', {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)'
    });
    anime.set('.mystic-die-container', {
      scale: 1,
      boxShadow: '0 0 0px rgba(0,0,0,0)'
    });

    const attrConfig = getAttrDiceConfig(getRollConfig(selectedAttribute).attributeValue);
    const skillSides = getRollConfig(selectedAttribute).trainingDie;

    // Dispara as animações de ambiência lentas e místicas
    setTimeout(() => {
      anime({
        targets: '.outer-ring',
        rotateZ: ['0turn', '1turn'],
        duration: 30000,
        easing: 'linear',
        loop: true
      });
      anime({
        targets: '.inner-square',
        rotateZ: ['45deg', '-315deg'],
        duration: 40000,
        easing: 'linear',
        loop: true
      });
      anime({
        targets: '.mystic-text',
        scale: [0.95, 1.1],
        opacity: [0.7, 1],
        direction: 'alternate',
        loop: true,
        duration: 4000, // 4 segundos pra ir e voltar
        easing: 'easeInOutSine'
      });
      anime({
        targets: '.mystic-die-container',
        translateY: [-20, 20],
        direction: 'alternate',
        loop: true,
        duration: 6000,
        easing: 'easeInOutSine'
      });
    }, 50);

    let iterations = 0;
    let currentDelay = 40; // Começa bem rápido (40ms)

    const rollStep = () => {
      // Usando apenas os glifos que você escolheu (A-O, sem K, X e Y)
      const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O'];
      const randomSymbol = () => symbols[Math.floor(Math.random() * symbols.length)];
      
      setDiceState({
        attrDie: randomSymbol(),
        skillDie: randomSymbol(),
        winner: null
      });
      iterations++;
      currentDelay *= 1.1; // Vai ficando 10% mais devagar a cada piscar

      if (iterations < 25) { // Aproximadamente 4 a 5 segundos de duração total
        setTimeout(rollStep, currentDelay);
      } else {
        let finalAttr = 0;
        for (let i = 0; i < attrConfig.qty; i++) {
          finalAttr = Math.max(finalAttr, Math.floor(Math.random() * attrConfig.sides) + 1);
        }
        const finalSkill = Math.floor(Math.random() * skillSides) + 1;
        const finalWinner = finalAttr > finalSkill ? 'attr' : 'skill';
        setDiceState({ attrDie: finalAttr, skillDie: finalSkill, winner: finalWinner });
        
        // Mantém a levitação e os anéis, só tira a pulsação de texto para revelar o número
        anime.remove('.mystic-text');
        
        // Força a opacidade de volta para 100% imediatamente para não congelar escuro
        anime.set('.mystic-text', { opacity: 1, scale: 1 });

        // Calcula a posição para centralizar o dado vencedor na linha
        setTimeout(() => {
          const rowEl = document.querySelector('.dice-row-container');
          const winnerEl = document.querySelector(finalWinner === 'attr' ? '.conjure-die-attr' : '.conjure-die-skill');
          let dx = 0;
          if (rowEl && winnerEl) {
            const rowRect = rowEl.getBoundingClientRect();
            const winnerRect = winnerEl.getBoundingClientRect();
            const rowCenter = rowRect.left + rowRect.width / 2;
            const winnerCenter = winnerRect.left + winnerRect.width / 2;
            dx = rowCenter - winnerCenter;
          }

          anime({
            targets: finalWinner === 'attr' ? '.conjure-die-attr' : '.conjure-die-skill',
            translateX: dx,
            duration: 1500,
            easing: 'easeOutExpo'
          });
        }, 50);

        // Um retorno extremamente suave pro centro
        anime({
          targets: '.mystic-die-container',
          scale: 1,
          translateY: 0,
          duration: 2500,
          easing: 'easeOutElastic(1, .8)',
        });

        // Vencedor acende majestosamente devagar
        anime({
          targets: finalWinner === 'attr' ? '.conjure-die-attr .mystic-die-container' : '.conjure-die-skill .mystic-die-container',
          scale: [1, 1.15],
          boxShadow: ['0 0 0px rgba(168,85,247,0)', '0 0 80px rgba(168,85,247,0.6)'],
          duration: 2500,
          easing: 'easeOutExpo'
        });

        // Perdedor derrete no escuro dolorosamente devagar
        anime({
          targets: finalWinner === 'attr' ? '.conjure-die-skill' : '.conjure-die-attr',
          opacity: [1, 0.05],
          scale: [1, 0.8],
          filter: ['blur(0px)', 'blur(10px)'],
          duration: 2500,
          easing: 'easeOutCubic'
        });
        
        setTimeout(() => {
          const actionArea = document.querySelector('.dice-action-area') as HTMLElement;
          const wrapper = actionWrapperRef.current;
          
          if (actionArea && wrapper) {
            anime({
              targets: actionArea,
              opacity: [1, 0],
              duration: 400,
              easing: 'easeInOutQuad',
              complete: () => {
                // Mede a altura atual e trava nela antes de mudar a fase
                const hStart = wrapper.offsetHeight;
                wrapper.style.height = `${hStart}px`;
                wrapper.style.overflow = 'hidden';

                handleRollComplete(finalAttr, finalSkill);
                setIsRolling(false);

                // Espera um frame para o React montar o novo conteúdo do discard_select
                setTimeout(() => {
                  wrapper.style.height = 'auto';
                  const hEnd = wrapper.offsetHeight;
                  wrapper.style.height = `${hStart}px`;

                  anime({
                    targets: wrapper,
                    height: [hStart, hEnd],
                    duration: 600,
                    easing: 'easeOutCubic',
                    complete: () => {
                      wrapper.style.height = 'auto';
                      wrapper.style.overflow = 'visible';
                    }
                  });
                }, 50);
              }
            });
          } else {
            handleRollComplete(finalAttr, finalSkill);
            setIsRolling(false);
          }
        }, 2500); // Aguarda a revelação e depois transiciona suavemente a altura
      }
    };

    setTimeout(rollStep, currentDelay);
  };

  const handleRollComplete = (finalAttr: number, finalSkill: number) => {
    const maxRoll = Math.max(finalAttr, finalSkill);
    const allowedDiscards = Math.max(1, Math.floor(maxRoll / 2));

    setLocalRollResult(maxRoll);

    setState(prev => prev ? {
      ...prev,
      discardLimit: allowedDiscards,
      phase: 'discard_select',
      selectedCards: []
    } : prev);
  };

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
      // Opted to discard 0 cards
      setState(prev => prev ? { ...prev, phase: prev.turn === 3 ? 'showdown' : 'decision', selectedCards: [] } : prev);
      return;
    }

    const { drawnCards, newDeck } = drawCard(state.deck, state.selectedCards.length);
    const newHand = [...state.hand];
    const replacedIndices: number[] = [];
    
    // Replace discarded cards with new ones
    let drawIndex = 0;
    for (let i = 0; i < state.hand.length; i++) {
      if (state.selectedCards.includes(i)) {
        newHand[i] = drawnCards[drawIndex++];
        replacedIndices.push(i);
      }
    }

    setAnimatingIndices(replacedIndices);

    setState(prev => prev ? {
      ...prev,
      deck: newDeck,
      hand: newHand,
      phase: prev.turn === 3 ? 'showdown' : 'decision',
      selectedCards: []
    } : prev);
  };

  const handleOmenSelect = (cardIndexInDeck: number) => {
    // Fetch a specific card from the deck, swap with a card in hand (or just add if hand isn't full, but we maintain handSize)
    // Actually, rules say "buscar 1 carta no baralho". Usually you discard 1 and get that 1.
    // Let's assume you just pick one to replace the first card, or you select which one to discard first.
    // For simplicity, Presságio 20 replaces the leftmost card (or a chosen one).
    // Let's just give them the card and discard the first one.
    const chosenCard = state.deck[cardIndexInDeck];
    const newDeck = state.deck.filter((_, idx) => idx !== cardIndexInDeck);
    const newHand = [...state.hand];
    newHand[0] = chosenCard; // Overwrite first card for simplicity in this MVP

    setAnimatingIndices([0]);

    setState(prev => prev ? {
      ...prev,
      deck: newDeck,
      hand: newHand,
      phase: prev.turn === 3 ? 'showdown' : 'decision',
      selectedCards: []
    } : prev);
  };

  const handleSustentarTranse = () => {
    setState(prev => prev ? {
      ...prev,
      turn: prev.turn + 1,
      phase: 'discard_roll',
      selectedCards: []
    } : prev);
    setLocalRollResult(null);
    onClose(); // Pausa a overlay
  };

  const handleShowdown = () => {
    if (state.hand.length > 5) {
      if (state.selectedCards.length === 5) {
        const finalHand = state.selectedCards.map(idx => state.hand[idx]);
        const evaluation = evaluate5CardHand(finalHand);
        setShowdownResult({ grade: evaluation.grade, handName: evaluation.name, best5: finalHand });
      }
    } else {
      const evaluation = evaluate5CardHand(state.hand);
      setShowdownResult({ grade: evaluation.grade, handName: evaluation.name, best5: state.hand });
    }
  };

  const initiateShowdown = () => {
    if (state.hand.length > 5) {
      setState(prev => prev ? { ...prev, phase: 'showdown', selectedCards: [] } : prev);
    } else {
      const evaluation = evaluate5CardHand(state.hand);
      setShowdownResult({ grade: evaluation.grade, handName: evaluation.name, best5: state.hand });
    }
  };

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
    const effect = getConjurationEffect(showdownResult.grade, (parseInt(ritualCircle) || 1) as 1 | 2 | 3);
    const dt = getTargetResistanceDT(showdownResult.grade, parseInt(ritualCircle) || 1);

    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-2xl w-full border-2 border-purple-500 bg-black p-6 space-y-6 text-center shadow-[0_0_50px_rgba(168,85,247,0.3)]">
          <h2 className="text-3xl font-display text-purple-300 uppercase tracking-widest">Showdown</h2>
          
          <div className="flex justify-center gap-2">
            {showdownResult.best5.map((c, i) => (
              <div key={i} className={`w-16 h-24 sm:w-20 sm:h-28 flex flex-col justify-between p-2 rounded bg-white shadow-md border ${
                c.suit === 'hearts' ? 'border-red-200 text-red-600' : 
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

          <div className="text-2xl text-purple-200 font-bold uppercase">{showdownResult.handName} (Grau {showdownResult.grade})</div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-b border-purple-500/50 py-4">
            <div>
              <div className="text-xs text-purple-400 uppercase font-bold">Efeito Resultante</div>
              <div className="text-lg text-purple-100">{effect}</div>
            </div>
            <div>
              <div className="text-xs text-purple-400 uppercase font-bold">DT do Ritual</div>
              <div className="text-lg text-purple-100">{dt}</div>
            </div>
          </div>

          <button onClick={onConclude} className="px-8 py-3 bg-purple-500 text-black font-bold uppercase hover:bg-purple-400 transition-colors">
            Finalizar Transe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 text-center space-y-2">
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
          {state.phase === 'discard_roll' && (
            <div className="dice-action-area text-center space-y-6 max-w-lg w-full overflow-hidden">
              <div className="text-purple-200 text-sm md:text-base">Escolha o Atributo para rolar junto com Ocultismo.</div>
              
              <div className="flex gap-2 justify-center flex-wrap">
                {['força', 'agilidade', 'inteligência', 'presença', 'vigor'].map(attr => (
                  <button
                    key={attr}
                    disabled={isRolling || !!diceState}
                    onClick={() => setSelectedAttribute(attr as any)}
                    className={`px-3 py-1.5 border uppercase font-bold text-xs transition-colors rounded ${
                      selectedAttribute === attr
                        ? 'bg-purple-500 border-purple-500 text-black shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                        : 'border-purple-500/50 text-purple-300 hover:bg-purple-500/20 disabled:opacity-50'
                    }`}
                  >
                    {attr.substring(0,3)}
                  </button>
                ))}
              </div>

              <div className="h-64 md:h-80 w-full max-w-2xl flex flex-col items-center justify-center gap-8 border border-purple-500/20 bg-black/60 rounded-xl relative shadow-[0_0_30px_rgba(168,85,247,0.1)] overflow-hidden">
                {!isRolling && !diceState ? (
                  <button onClick={handleRollFiltragem} className="px-10 py-4 bg-transparent border-2 border-purple-500 text-purple-300 font-display uppercase tracking-[0.3em] text-xl hover:bg-purple-500 hover:text-black transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] relative z-50">
                    Conjurar Teste
                  </button>
                ) : diceState ? (
                  <div className="dice-row-container flex gap-12 md:gap-24 relative z-10">
                    
                    {/* ATTR DIE */}
                    <div className="conjure-die-attr flex flex-col items-center gap-8">
                      <div className="text-xs md:text-sm uppercase text-purple-300/80 font-display tracking-[0.4em] -mt-6">{selectedAttribute}</div>
                      <div className="mystic-die-container rounded-full relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
                        <div className="outer-ring absolute inset-0 rounded-full border-2 border-dashed border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]" style={{ borderStyle: 'dotted' }}></div>
                        <div className="inner-square absolute w-20 h-20 md:w-24 md:h-24 border border-purple-300/40 rotate-45 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 to-purple-500/30 rounded-full mix-blend-overlay"></div>
                        <span className={`mystic-text absolute inset-0 flex items-center justify-center leading-none ${typeof diceState.attrDie === 'string' ? 'text-7xl md:text-8xl' : 'text-5xl md:text-6xl'} font-bold ${diceState.winner === 'attr' || !diceState.winner ? 'text-white' : 'text-purple-300'} z-10 pt-2`} style={{ textShadow: diceState.winner ? (diceState.winner === 'attr' ? '0 0 30px #fff, 0 0 50px #a855f7' : '0 0 5px rgba(168,85,247,0.2)') : '0 0 20px #c084fc, 0 0 10px #fff', fontFamily: typeof diceState.attrDie === 'string' ? 'AFonteParanormal, sans-serif' : 'inherit' }}>
                          {diceState.attrDie}
                        </span>
                      </div>
                    </div>
                    
                    {/* SKILL DIE */}
                    <div className="conjure-die-skill flex flex-col items-center gap-8">
                      <div className="text-xs md:text-sm uppercase text-purple-300/80 font-display tracking-[0.4em] -mt-6">Ocultismo</div>
                      <div className="mystic-die-container rounded-full relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
                        <div className="outer-ring absolute inset-0 rounded-full border-2 border-dashed border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]" style={{ borderStyle: 'dotted' }}></div>
                        <div className="inner-square absolute w-20 h-20 md:w-24 md:h-24 border border-purple-300/40 rotate-45 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 to-purple-500/30 rounded-full mix-blend-overlay"></div>
                        <span className={`mystic-text absolute inset-0 flex items-center justify-center leading-none ${typeof diceState.skillDie === 'string' ? 'text-7xl md:text-8xl' : 'text-5xl md:text-6xl'} font-bold ${diceState.winner === 'skill' || !diceState.winner ? 'text-white' : 'text-purple-300'} z-10 pt-2`} style={{ textShadow: diceState.winner ? (diceState.winner === 'skill' ? '0 0 30px #fff, 0 0 50px #a855f7' : '0 0 5px rgba(168,85,247,0.2)') : '0 0 20px #c084fc, 0 0 10px #fff', fontFamily: typeof diceState.skillDie === 'string' ? 'AFonteParanormal, sans-serif' : 'inherit' }}>
                          {diceState.skillDie}
                        </span>
                      </div>
                    </div>

                  </div>
                ) : null}
              </div>
            </div>
          )}

          {state.phase === 'discard_select' && (
            <div className="text-center space-y-6 max-w-lg w-full">
              <div className="text-purple-200">
                <div className="discard-line-1 opacity-0 text-lg">
                  Teste de Transe: <span className="font-bold text-white text-3xl mx-2" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{localRollResult}</span>
                </div>
                <div className="discard-line-2 opacity-0 text-base mt-2">
                  Sua intuição revela até <span className="font-bold text-purple-400 text-4xl mx-2" style={{ textShadow: '0 0 20px rgba(168,85,247,0.8)' }}>{state.discardLimit}</span> descartes permitidos.
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
                  if(e.target.value) handleOmenSelect(Number(e.target.value));
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
                {state.turn > 1 && (
                  <button onClick={initiateShowdown} className="px-8 py-3 bg-purple-500 text-black font-bold uppercase text-lg hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
                    Showdown
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
