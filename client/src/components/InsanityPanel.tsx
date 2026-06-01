import { useState } from 'react';
import { ChevronLeft, Trash2, Plus } from 'lucide-react';

interface Insanity {
  id: string;
  name: string;
  description: string;
  type: 'fobia' | 'mania' | 'surto';
}

interface ParanormalPower {
  id: string;
  name: string;
  description: string;
}

interface InsanityPanelProps {
  isOpen: boolean;
  showToggle: boolean;
  onToggle: () => void;
  insanities: Insanity[];
  paranormalPowers: ParanormalPower[];
  onInsanityAdd: (insanity: Insanity) => void;
  onInsanityRemove: (id: string) => void;
  onInsanityUpdate: (id: string, insanity: Insanity) => void;
  onInsanityInvoke?: (insanity: Insanity) => void;
  onPowerAdd: (power: ParanormalPower) => void;
  onPowerRemove: (id: string) => void;
  onPowerUpdate: (id: string, power: ParanormalPower) => void;
}

export default function InsanityPanel({
  isOpen,
  showToggle,
  onToggle,
  insanities,
  paranormalPowers,
  onInsanityAdd,
  onInsanityRemove,
  onInsanityUpdate,
  onInsanityInvoke,
  onPowerAdd,
  onPowerRemove,
  onPowerUpdate,
}: InsanityPanelProps) {
  const [showInsanityForm, setShowInsanityForm] = useState(false);
  const [showPowerForm, setShowPowerForm] = useState(false);
  const [newInsanityName, setNewInsanityName] = useState('');
  const [newInsanityDesc, setNewInsanityDesc] = useState('');
  const [newInsanityType, setNewInsanityType] = useState<Insanity['type']>('fobia');
  const [newPowerName, setNewPowerName] = useState('');
  const [newPowerDesc, setNewPowerDesc] = useState('');

  const autoResizeTextarea = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const addInsanity = () => {
    if (newInsanityName.trim()) {
      const newInsanity: Insanity = {
        id: Date.now().toString(),
        name: newInsanityName,
        description: newInsanityDesc,
        type: newInsanityType,
      };
      onInsanityAdd(newInsanity);
      setNewInsanityName('');
      setNewInsanityDesc('');
        setNewInsanityType('fobia');
      setShowInsanityForm(false);
    }
  };

  const addPower = () => {
    if (newPowerName.trim()) {
      const newPower: ParanormalPower = {
        id: Date.now().toString(),
        name: newPowerName,
        description: newPowerDesc,
      };
      onPowerAdd(newPower);
      setNewPowerName('');
      setNewPowerDesc('');
      setShowPowerForm(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen z-30">
      {/* Toggle Button */}
      {showToggle && (
        <button
          onClick={onToggle}
          className={`group fixed top-28 z-40 h-12 w-12 hover:w-40 overflow-hidden bg-black border-2 border-orange-500 hover:bg-orange-500 hover:bg-opacity-10 flex items-center justify-start text-orange-300 transition-all duration-300 ${
            isOpen ? 'right-80' : 'right-0'
          }`}
        >
          <span className="flex h-full w-12 flex-shrink-0 items-center justify-center">
            <ChevronLeft size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
          <span className="pr-4 text-sm font-display uppercase tracking-wide whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Insanidades
          </span>
        </button>
      )}

      {/* Panel */}
      <div
        className={`h-full bg-black overflow-y-auto transition-all duration-300 ${
          isOpen ? 'w-80 border-l-2 border-orange-500' : 'w-0 border-l-0'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Insanities Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b-2 border-orange-500 pb-2">
              <h3 className="font-display text-lg text-orange-300 uppercase">Insanidades</h3>
              <button
                onClick={() => setShowInsanityForm((prev) => !prev)}
                className="bg-orange-500 text-black font-bold px-2 py-1 hover:bg-orange-400 transition-colors flex items-center gap-1 text-xs uppercase"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {insanities.map((insanity) => (
                <div key={insanity.id} className="bg-black border-2 border-orange-500 p-2 space-y-1">
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      value={insanity.name}
                      onChange={(e) =>
                        onInsanityUpdate(insanity.id, { ...insanity, name: e.target.value })
                      }
                      className="bg-black text-orange-200 text-sm font-bold border-b border-orange-500 outline-none flex-1"
                      placeholder="Nome"
                    />
                    <div className="ml-2 text-[10px] px-2 py-0.5 uppercase font-bold text-orange-300 border border-orange-500 rounded">
                      {insanity.type}
                    </div>
                    <button
                      onClick={() => onInsanityRemove(insanity.id)}
                      className="text-orange-400 hover:text-orange-300 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    value={insanity.description}
                    onChange={(e) =>
                      onInsanityUpdate(insanity.id, { ...insanity, description: e.target.value })
                    }
                    onInput={(e) => autoResizeTextarea(e.currentTarget)}
                    className="w-full bg-black text-orange-200 text-xs border border-orange-500 p-1 outline-none resize-none overflow-hidden"
                    rows={2}
                    placeholder="Descrição"
                  />
                  <div className="mt-2">
                    <button
                      onClick={() => onInsanityInvoke ? onInsanityInvoke(insanity) : window.alert(`Invocando ${insanity.name} (${insanity.type})`)}
                      className="w-full bg-orange-500 text-black font-bold py-1 uppercase text-xs"
                    >
                      Invocar Insanidade
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Insanity */}
            {showInsanityForm && (
              <div className="space-y-2 border border-orange-500 p-2 bg-orange-950/10">
                <input
                  type="text"
                  value={newInsanityName}
                  onChange={(e) => setNewInsanityName(e.target.value)}
                  className="w-full bg-black text-orange-200 text-sm border border-orange-500 p-2 outline-none"
                  placeholder="Nova Insanidade"
                />
                <textarea
                  value={newInsanityDesc}
                  onChange={(e) => setNewInsanityDesc(e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.currentTarget)}
                  className="w-full bg-black text-orange-200 text-sm border border-orange-500 p-2 outline-none resize-none overflow-hidden"
                  rows={2}
                  placeholder="Descrição"
                />
                <div className="flex items-center gap-2 text-xs uppercase font-bold">
                  <div className="text-[10px] text-orange-400">Tipo:</div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setNewInsanityType('fobia')}
                      className={`px-2 py-1 text-xs rounded cursor-pointer ${newInsanityType === 'fobia' ? 'bg-orange-500 text-black border border-orange-500' : 'bg-black text-orange-300 border border-orange-500 hover:bg-orange-500/20'}`}
                    >
                      Fobia
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewInsanityType('mania')}
                      className={`px-2 py-1 text-xs rounded cursor-pointer ${newInsanityType === 'mania' ? 'bg-orange-500 text-black border border-orange-500' : 'bg-black text-orange-300 border border-orange-500 hover:bg-orange-500/20'}`}
                    >
                      Mania
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewInsanityType('surto')}
                      className={`px-2 py-1 text-xs rounded cursor-pointer ${newInsanityType === 'surto' ? 'bg-orange-500 text-black border border-orange-500' : 'bg-black text-orange-300 border border-orange-500 hover:bg-orange-500/20'}`}
                    >
                      Surto
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addInsanity}
                    className="flex-1 bg-orange-500 text-black font-bold py-1 hover:bg-orange-400 transition-colors flex items-center justify-center gap-1 text-xs uppercase"
                  >
                    <Plus size={14} />
                    Salvar
                  </button>
                  <button
                    onClick={() => setShowInsanityForm(false)}
                    className="flex-1 border border-orange-500 text-orange-300 font-bold py-1 hover:bg-orange-500 hover:text-black transition-colors text-xs uppercase"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Paranormal Powers Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b-2 border-orange-500 pb-2">
              <h3 className="font-display text-lg text-orange-300 uppercase">Poderes Paranormais</h3>
              <button
                onClick={() => setShowPowerForm((prev) => !prev)}
                className="bg-orange-500 text-black font-bold px-2 py-1 hover:bg-orange-400 transition-colors flex items-center gap-1 text-xs uppercase"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {paranormalPowers.map((power) => (
                <div key={power.id} className="bg-black border-2 border-orange-500 p-2 space-y-1">
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      value={power.name}
                      onChange={(e) => onPowerUpdate(power.id, { ...power, name: e.target.value })}
                      className="bg-black text-orange-200 text-sm font-bold border-b border-orange-500 outline-none flex-1"
                      placeholder="Nome"
                    />
                    <button
                      onClick={() => onPowerRemove(power.id)}
                      className="text-orange-400 hover:text-orange-300 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    value={power.description}
                    onChange={(e) =>
                      onPowerUpdate(power.id, { ...power, description: e.target.value })
                    }
                    onInput={(e) => autoResizeTextarea(e.currentTarget)}
                    className="w-full bg-black text-orange-200 text-xs border border-orange-500 p-1 outline-none resize-none overflow-hidden"
                    rows={2}
                    placeholder="Descrição"
                  />
                </div>
              ))}
            </div>

            {/* Add Power */}
            {showPowerForm && (
              <div className="space-y-2 border border-orange-500 p-2 bg-orange-950/10">
                <input
                  type="text"
                  value={newPowerName}
                  onChange={(e) => setNewPowerName(e.target.value)}
                  className="w-full bg-black text-orange-200 text-sm border border-orange-500 p-2 outline-none"
                  placeholder="Novo Poder Paranormal"
                />
                <textarea
                  value={newPowerDesc}
                  onChange={(e) => setNewPowerDesc(e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.currentTarget)}
                  className="w-full bg-black text-orange-200 text-sm border border-orange-500 p-2 outline-none resize-none overflow-hidden"
                  rows={2}
                  placeholder="Descrição"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addPower}
                    className="flex-1 bg-orange-500 text-black font-bold py-1 hover:bg-orange-400 transition-colors flex items-center justify-center gap-1 text-xs uppercase"
                  >
                    <Plus size={14} />
                    Salvar
                  </button>
                  <button
                    onClick={() => setShowPowerForm(false)}
                    className="flex-1 border border-orange-500 text-orange-300 font-bold py-1 hover:bg-orange-500 hover:text-black transition-colors text-xs uppercase"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
