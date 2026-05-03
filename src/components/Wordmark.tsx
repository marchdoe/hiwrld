import { wordmark } from '../../styled-system/recipes';

export type WordmarkVariant = 'primary' | 'mono' | 'short';

export interface WordmarkProps {
  size?: number;
  variant?: WordmarkVariant;
  reversed?: boolean;
  className?: string;
}

export function Wordmark({
  size = 24,
  variant = 'primary',
  reversed = false,
  className,
}: WordmarkProps) {
  const styles = wordmark({ variant, reversed });

  // Glyph spacing is size-dependent — cannot live in the recipe.
  // s = base font-size in px per spec.
  const s = size;
  const astStyle: React.CSSProperties = {
    fontSize: s * 0.95,
    marginLeft: s * 0.04,
    marginRight: variant === 'primary' ? s * 0.005 : undefined,
  };
  const closeAstStyle: React.CSSProperties = {
    fontSize: s * 0.95,
    marginLeft: s * 0.005,
  };

  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')} style={{ fontSize: size }}>
      <span className={styles.hi}>hi</span>
      <span className={styles.ast} style={astStyle}>
        *
      </span>
      {variant !== 'short' && (
        <>
          <span className={styles.wrld}>wrld</span>
          <span className={styles.ast} style={closeAstStyle}>
            *
          </span>
        </>
      )}
    </span>
  );
}
