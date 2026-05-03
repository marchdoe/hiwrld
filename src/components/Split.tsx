import { split } from '../../styled-system/recipes';

export interface SplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  ratio?: string;
  bg?: string;
  fg?: string;
  ruleColor?: string;
  padded?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
}

export function Split({
  left,
  right,
  ratio = '1fr 1fr',
  bg,
  fg,
  ruleColor,
  padded = '32px 36px',
  style,
  responsive,
}: SplitProps) {
  const styles = split();

  return (
    <div
      data-split={responsive ? '' : undefined}
      className={styles.root}
      style={{
        gridTemplateColumns: ratio,
        background: bg,
        color: fg,
        // ruleColor is read by the slot recipe via CSS custom property
        '--split-rule': ruleColor ?? 'var(--colors-g2)',
        ...style,
      } as React.CSSProperties}
    >
      <div className={styles.left} style={{ padding: padded }}>
        {left}
      </div>
      <div className={styles.right} style={{ padding: padded }}>
        {right}
      </div>
    </div>
  );
}
