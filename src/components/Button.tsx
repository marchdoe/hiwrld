import { button } from '../../styled-system/recipes';

type ButtonVariant = 'solid' | 'line' | 'ghost' | 'link';
type ButtonVisual = 'default' | 'inverted' | 'ink';

export interface ButtonProps {
  variant?: ButtonVariant;
  visual?: ButtonVisual;
  href?: string;
  onClick?: React.MouseEventHandler;
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = 'solid',
  visual = 'default',
  href,
  onClick,
  children,
  className,
}: ButtonProps) {
  const cls = button({ variant, visual });
  const combined = [cls, className].filter(Boolean).join(' ');

  if (href) {
    return (
      <a href={href} className={combined}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={combined}>
      {children}
    </button>
  );
}
