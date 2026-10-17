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
