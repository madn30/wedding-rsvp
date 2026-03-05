import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { TableType } from '../../../store/seatingStore';
import { TABLE_SHAPES } from '../constants';

interface AddTablePromptProps {
  onConfirm: (name: string, type: TableType) => void;
  onCancel: () => void;
}

const AddTablePrompt: React.FC<AddTablePromptProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TableType>('round');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { toast.error('הכנס שם לשולחן'); return; }
    onConfirm(trimmed, type);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0d1b2a] border border-[#c9a84c]/30 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4"
      >
        <h2 className="font-serif text-[#e8c97e] text-base">שולחן חדש</h2>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
            שם השולחן
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='לדוגמה: "משפחת כהן"'
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50 placeholder-white/20"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">צורה</label>
          <div className="grid grid-cols-4 gap-2">
            {TABLE_SHAPES.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setType(s.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  type === s.id
                    ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]'
                    : 'bg-white/5 border-white/10 text-white/35'
                }`}
              >
                {s.preview}
                <span className="text-[9px]">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-white/50 hover:text-white transition">
            ביטול
          </button>
          <button type="submit" className="px-5 py-2 bg-[#c9a84c] text-[#0d1b2a] rounded-lg text-sm font-bold hover:scale-105 transition">
            הוסף
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTablePrompt;