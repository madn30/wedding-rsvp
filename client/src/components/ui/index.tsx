import { ReactNode } from 'react';
import { RSVPResponse } from '../../types';

// ── Spinner ──────────────────────────────────────────────
export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div
      className={`${sizes[size]} border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin`}
    />
  );
};

// ── FullPageLoader ────────────────────────────────────────
export const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-rose-400 font-medium">טוען...</p>
    </div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────
interface BadgeProps {
  response: RSVPResponse;
}

const RESPONSE_CONFIG: Record<
  NonNullable<RSVPResponse> | 'pending',
  { label: string; className: string }
> = {
  yes: { label: 'מגיע ✅', className: 'bg-emerald-100 text-emerald-700' },
  no: { label: 'לא מגיע ❌', className: 'bg-red-100 text-red-700' },
  maybe: { label: 'אולי 🤔', className: 'bg-amber-100 text-amber-700' },
  pending: { label: 'ממתין ⏳', className: 'bg-gray-100 text-gray-600' },
};

export const ResponseBadge = ({ response }: BadgeProps) => {
  const key = response ?? 'pending';
  const config = RESPONSE_CONFIG[key];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

// ── StatCard ──────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
}

export const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
  <div className={`stat-card border-r-4 ${color}`}>
    <div className="flex items-center justify-between">
      <span className="text-2xl">{icon}</span>
      <span className="text-3xl font-bold text-gray-800">{value}</span>
    </div>
    <p className="text-gray-600 font-medium text-sm">{title}</p>
    {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
  </div>
);

// ── Modal ─────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-md p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
        <h2 className="text-xl font-serif font-semibold text-gray-800 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};
