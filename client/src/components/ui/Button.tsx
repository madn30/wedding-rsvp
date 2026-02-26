import { ButtonHTMLAttributes, ReactNode } from 'react';
import s from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  full = false,
  className = '',
  children,
  ...rest
}: ButtonProps) => {
  const variantClass = s[variant] ?? s.primary;
  const sizeClass    = size === 'sm' ? s.sm : size === 'lg' ? s.lg : '';
  const fullClass    = full ? s.full : '';

  return (
    <button
      className={`${variantClass} ${sizeClass} ${fullClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
};
