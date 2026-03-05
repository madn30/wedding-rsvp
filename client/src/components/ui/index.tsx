import React from "react";
import { ReactNode } from "react";
import { RSVPResponse } from "../../types";
import s from "./ui.module.css";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

export const Spinner = ({ size = "md" }: SpinnerProps) => {
  const sizeClass =
    size === "sm" ? s.spinnerSm : size === "lg" ? s.spinnerLg : s.spinnerMd;
  return (
    <span
      className={`${s.spinner} ${sizeClass}`}
      role="status"
      aria-label="טוען"
    />
  );
};

export const FullPageLoader = () => (
  <div className={s.fullPageLoader}>
    <div className={s.loaderContent}>
      <Spinner size="lg" />
      <p className={s.loaderText}>טוען...</p>
    </div>
  </div>
);

interface BadgeProps {
  response: RSVPResponse;
}

const BADGE_CONFIG: Record<
  NonNullable<RSVPResponse> | "pending",
  { label: string; cls: string }
> = {
  yes: { label: "מגיע", cls: s.badgeYes },
  no: { label: "לא מגיע", cls: s.badgeNo },
  maybe: { label: "אולי", cls: s.badgeMaybe },
  pending: { label: "ממתין", cls: s.badgePending },
};

export const ResponseBadge = ({ response }: BadgeProps) => {
  const { label, cls } = BADGE_CONFIG[response ?? "pending"];
  return <span className={`${s.badge} ${cls}`}>{label}</span>;
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  accentColor: string;
  subtitle?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  accentColor,
  subtitle,
}: StatCardProps) => (
  <article className={s.statCard} style={{ borderRightColor: accentColor }}>
    <div className={s.statCardTop}>
      <span className={s.statCardIcon} aria-hidden="true">
        {icon}
      </span>
      <strong className={s.statCardValue}>{value}</strong>
    </div>
    <p className={s.statCardTitle}>{title}</p>
    {subtitle && <p className={s.statCardSub}>{subtitle}</p>}
  </article>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className={s.overlay}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={s.modalPanel} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>{title}</h2>
          <button className={s.modalClose} onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
