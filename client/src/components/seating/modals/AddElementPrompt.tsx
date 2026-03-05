import React, { useState } from "react";
import { TableType } from "../../../store/seatingStore";
import { ELEMENTS } from "../constants";

interface AddElementPromptProps {
  onConfirm: (name: string, type: TableType) => void;
  onCancel: () => void;
}

const AddElementPrompt: React.FC<AddElementPromptProps> = ({
  onConfirm,
  onCancel,
}) => {
  const [selected, setSelected] = useState(ELEMENTS[0]);
  const [name, setName] = useState(ELEMENTS[0].defaultName);

  const handleSelect = (el: (typeof ELEMENTS)[0]) => {
    setSelected(el);
    setName(el.defaultName);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-[#0d1b2a] border border-[#c9a84c]/30 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
        <h2 className="font-serif text-[#e8c97e] text-base">הוסף אלמנט</h2>

        {}
        <div className="grid grid-cols-2 gap-2">
          {ELEMENTS.map((el) => (
            <button
              key={el.type}
              onClick={() => handleSelect(el)}
              className={`flex items-center justify-center p-3 rounded-xl border transition-all text-sm font-semibold ${
                selected.type === el.type
                  ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
              }`}
            >
              {el.label}
            </button>
          ))}
        </div>

        {}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
            שם (אופציונלי)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-white/50 hover:text-white transition"
          >
            ביטול
          </button>
          <button
            onClick={() =>
              onConfirm(name || selected.defaultName, selected.type)
            }
            className="px-5 py-2 bg-[#c9a84c] text-[#0d1b2a] rounded-lg text-sm font-bold hover:scale-105 transition"
          >
            הוסף
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddElementPrompt;
