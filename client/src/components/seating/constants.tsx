import React from "react";
import { TableType } from "../../store/seatingStore";

const SNAP_PCT = 1;

export function snap(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v / SNAP_PCT) * SNAP_PCT));
}

export const ELEMENT_TYPES_SET = new Set(["dj", "dance", "bar", "stage"]);

export const ELEMENTS: {
  type: TableType;
  label: string;
  emoji: string;
  defaultName: string;
}[] = [
  { type: "dj", label: "DJ בוקס", emoji: "🎛️", defaultName: "DJ" },
  {
    type: "dance",
    label: "רחבת ריקודים",
    emoji: "💃",
    defaultName: "רחבת ריקודים",
  },
  { type: "bar", label: "בר", emoji: "🍹", defaultName: "בר" },
  { type: "stage", label: "במה", emoji: "🎤", defaultName: "במה" },
];

export const TABLE_SHAPES: {
  id: TableType;
  label: string;
  preview: React.ReactNode;
}[] = [
  {
    id: "round",
    label: "עגול",
    preview: <div className="w-5 h-5 rounded-full border-2 border-current" />,
  },
  {
    id: "rect",
    label: "מלבן",
    preview: <div className="w-6 h-4 border-2 border-current rounded" />,
  },
  {
    id: "square",
    label: "ריבוע",
    preview: <div className="w-5 h-5 border-2 border-current rounded" />,
  },
  {
    id: "oval",
    label: "אליפסה",
    preview: <div className="w-6 h-4 border-2 border-current rounded-[50%]" />,
  },
];
