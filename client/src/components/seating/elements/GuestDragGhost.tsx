import React from "react";
import { SeatingGuest } from "../../../store/seatingStore";

interface GuestDragGhostProps {
  guest: SeatingGuest;
}

export const GuestDragGhost: React.FC<GuestDragGhostProps> = ({ guest }) => (
  <div className="flex items-center gap-2.5 px-3 py-2 bg-[#1a2e45] border border-[#60a5fa]/60 rounded-xl shadow-xl shadow-[#60a5fa]/20 opacity-90 cursor-grabbing select-none max-w-[180px]">
    <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#f5e6c0] text-[#0d1b2a] flex items-center justify-center font-bold text-[10px]">
      {guest.name[0]}
    </div>
    <span className="text-xs text-[#faf6ef] font-semibold truncate">
      {guest.name}
    </span>
  </div>
);
