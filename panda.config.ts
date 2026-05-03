import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // Do not inject a CSS reset — hiwrld.css owns base resets
  preflight: false,

  // Files scanned for used class names (tree-shaking)
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],

  outdir: 'styled-system',

  theme: {
    tokens: {
      colors: {
        g0:      { value: '#f7f6f3', description: 'page bg, light surfaces' },
        g1:      { value: '#ecebe7', description: 'panel bg, alt sections' },
        g2:      { value: '#dcd9d2', description: 'hairline rules, borders' },
        g3:      { value: '#a8a39a', description: 'tertiary text, captions' },
        g4:      { value: '#6e6a62', description: 'secondary text' },
        g5:      { value: '#3d3a35', description: 'body on light, secondary on dark' },
        g6:      { value: '#1f1d1a', description: 'primary text, dark surfaces' },
        ink:     { value: '#3a4a6b', description: 'graphite-blue — the only accent' },
        inkSoft: { value: '#b8c2d4', description: 'accent on dark, soft variant' },
      },
      fonts: {
        ui:      { value: '"Geist", "Helvetica Neue", Helvetica, Arial, sans-serif' },
        mono:    { value: '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace' },
        // Same stack as ui for now; swap to Editorial New when licensed
        display: { value: '"Geist", "Helvetica Neue", Helvetica, Arial, sans-serif' },
      },
    },

    textStyles: {
      heroNum:      { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '500', fontSize: '132px', letterSpacing: '-0.05em', lineHeight: '0.86' } },
      h1:           { value: { fontFamily: 'var(--fonts-display)', fontStyle: 'italic', fontWeight: '300', fontSize: '56px', letterSpacing: '-0.03em', lineHeight: '0.95' } },
      sectionTitle: { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '500', fontSize: '28px', letterSpacing: '-0.03em', lineHeight: '1.0' } },
      bodyLg:       { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '400', fontSize: '18px', lineHeight: '1.5' } },
      body:         { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '400', fontSize: '16px', lineHeight: '1.5' } },
      uiBtn:        { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '500', fontSize: '14px', lineHeight: '1.0' } },
      caption:      { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '400', fontSize: '12px', lineHeight: '1.4' } },
      meta:         { value: { fontFamily: 'var(--fonts-mono)', fontWeight: '400', fontSize: '11px', letterSpacing: '0.02em', lineHeight: '1.0' } },
    },

    recipes: {
      button: {
        className: 'btn',
        base: {
          fontFamily: 'var(--fonts-ui)',
          fontWeight: '500',
          fontSize: '14px',
          lineHeight: '1',
          letterSpacing: '-0.01em',
          cursor: 'pointer',
          borderRadius: '0',
          display: 'inline-block',
          textDecoration: 'none',
          border: '1px solid',
          padding: '14px 22px',
          transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
          userSelect: 'none',
        },
        variants: {
          variant: {
            solid: {
              background: '{colors.g6}',
              color: '{colors.g0}',
              borderColor: '{colors.g6}',
              _hover: { background: '{colors.ink}', borderColor: '{colors.ink}' },
            },
            line: {
              background: 'transparent',
              color: '{colors.g6}',
              borderColor: '{colors.g6}',
              _hover: { background: '{colors.g6}', color: '{colors.g0}' },
            },
            ghost: {
              background: 'transparent',
              color: '{colors.g4}',
              borderStyle: 'dashed',
              borderColor: '{colors.g3}',
              _hover: { color: '{colors.g6}' },
            },
            link: {
              background: 'transparent',
              color: '{colors.ink}',
              border: 'none',
              borderBottom: '1px solid',
              borderBottomColor: '{colors.ink}',
              padding: '8px 0',
              _hover: { borderBottomColor: '{colors.g6}' },
            },
          },
          visual: {
            default: {},
            inverted: {
              background: '{colors.inkSoft}',
              color: '{colors.g6}',
              borderColor: '{colors.inkSoft}',
              padding: '18px 28px',
              fontSize: '16px',
              _hover: { background: '{colors.g0}' },
            },
          },
        },
        defaultVariants: { variant: 'solid', visual: 'default' },
      },
    },

    slotRecipes: {
      wordmark: {
        className: 'wm',
        slots: ['root', 'hi', 'ast', 'wrld'],
        base: {
          root: {
            display: 'inline-flex',
            alignItems: 'baseline',
            fontFamily: 'var(--fonts-ui)',
            letterSpacing: '-0.04em',
            lineHeight: '1',
          },
          hi:   { fontWeight: '400' },
          ast:  { fontWeight: '400', fontSize: '95%' },
          wrld: { fontWeight: '700' },
        },
        variants: {
          variant: {
            primary: {
              hi:   { color: '{colors.g6}' },
              ast:  { color: '{colors.ink}' },
              wrld: { color: '{colors.g6}' },
            },
            mono: {
              hi:   { color: '{colors.g6}' },
              ast:  { color: '{colors.g6}' },
              wrld: { color: '{colors.g6}' },
            },
            short: {
              hi:   { color: '{colors.g6}', fontWeight: '700' },
              ast:  { color: '{colors.ink}' },
              wrld: { display: 'none' },
            },
          },
          reversed: {
            true: {
              hi:   { color: '{colors.g0}' },
              ast:  { color: '{colors.inkSoft}' },
              wrld: { color: '{colors.g0}' },
            },
          },
        },
        defaultVariants: { variant: 'primary', reversed: false },
      },

      split: {
        className: 'split',
        slots: ['root', 'left', 'right'],
        base: {
          root: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            fontFamily: 'var(--fonts-ui)',
          },
          left: {
            // --split-rule is set as an inline CSS var by the Split component
            borderRight: '1px solid var(--split-rule, var(--colors-g2))',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '0',
            overflow: 'hidden',
          },
          right: {
            display: 'flex',
            flexDirection: 'column',
            minWidth: '0',
            overflow: 'hidden',
          },
        },
      },

      nav: {
        className: 'nav',
        slots: ['root', 'logo', 'links', 'link', 'cta'],
        base: {
          root: {
            position: 'sticky',
            top: '0',
            background: 'var(--colors-g0)',
            zIndex: '10',
            padding: '20px 32px',
            borderBottom: '1px solid var(--colors-g2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          links: {
            display: 'flex',
            gap: '22px',
            alignItems: 'center',
            fontFamily: 'var(--fonts-ui)',
            fontSize: '14px',
            color: 'var(--colors-g5)',
          },
          link: {
            color: 'var(--colors-g5)',
            textDecoration: 'none',
            _hover: { color: 'var(--colors-g6)' },
          },
          cta: {
            padding: '8px 14px',
            background: 'var(--colors-g6)',
            color: 'var(--colors-g0)',
            fontWeight: '500',
            fontSize: '14px',
            textDecoration: 'none',
            fontFamily: 'var(--fonts-ui)',
            transition: 'background-color 150ms ease',
            _hover: { background: 'var(--colors-ink)' },
          },
        },
      },

      pullQuote: {
        className: 'pq',
        slots: ['root', 'text', 'accent'],
        base: {
          root: {
            padding: '90px 56px',
            background: 'var(--colors-g1)',
            borderBottom: '1px solid var(--colors-g2)',
            textAlign: 'center',
          },
          text: {
            fontFamily: 'var(--fonts-display)',
            fontStyle: 'italic',
            fontWeight: '300',
            fontSize: '56px',
            lineHeight: '1.15',
            letterSpacing: '-0.02em',
            color: 'var(--colors-g6)',
            textWrap: 'balance' as const,
            maxWidth: '920px',
            marginInline: 'auto',
          },
          accent: { color: 'var(--colors-ink)' },
        },
      },

      featureRow: {
        className: 'feat',
        slots: ['root', 'num', 'title', 'desc'],
        base: {
          root: {
            display: 'grid',
            gridTemplateColumns: '64px 1fr 2fr',
            padding: '28px 32px',
            alignItems: 'baseline',
            gap: '32px',
            borderBottom: '1px solid var(--colors-g2)',
            '&:last-child': { borderBottom: 'none' },
          },
          num:   { fontFamily: 'var(--fonts-mono)', fontSize: '12px', color: 'var(--colors-g3)' },
          title: { fontFamily: 'var(--fonts-ui)', fontWeight: '500', fontSize: '28px', letterSpacing: '-0.03em' },
          desc:  { fontFamily: 'var(--fonts-ui)', fontSize: '16px', color: 'var(--colors-g4)', lineHeight: '1.5', textWrap: 'pretty' as const },
        },
      },

      stackSection: {
        className: 'stack',
        slots: ['root', 'inner', 'heading', 'accent', 'table', 'row', 'key', 'val', 'idx'],
        base: {
          root:    { padding: '56px 32px', borderBottom: '1px solid var(--colors-g2)' },
          inner:   { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '36px' },
          heading: {
            fontFamily: 'var(--fonts-display)',
            fontStyle: 'italic',
            fontWeight: '300',
            fontSize: '56px',
            letterSpacing: '-0.03em',
            lineHeight: '0.95',
            color: 'var(--colors-g6)',
          },
          accent: { color: 'var(--colors-ink)' },
          row: {
            display: 'grid',
            gridTemplateColumns: '120px 1fr 40px',
            padding: '14px 0',
            borderTop: '1px solid var(--colors-g2)',
            alignItems: 'baseline',
            '&:last-child': { borderBottom: '1px solid var(--colors-g2)' },
          },
          key: { fontFamily: 'var(--fonts-mono)', fontSize: '11px', color: 'var(--colors-g4)' },
          val: { fontFamily: 'var(--fonts-ui)', fontSize: '15px' },
          idx: { textAlign: 'right', fontFamily: 'var(--fonts-mono)', fontSize: '10px', color: 'var(--colors-g3)' },
        },
      },

      ctaSection: {
        className: 'cta',
        slots: ['root', 'metaLeft', 'metaRight', 'heading'],
        base: {
          root:      { background: 'var(--colors-g6)', color: 'var(--colors-g0)', borderBottom: '1px solid var(--colors-g5)' },
          metaLeft:  { fontFamily: 'var(--fonts-mono)', fontSize: '11px', color: 'var(--colors-g3)', letterSpacing: '0.02em' },
          metaRight: { fontFamily: 'var(--fonts-mono)', fontSize: '11px', color: 'var(--colors-g3)', letterSpacing: '0.02em', textAlign: 'right' },
          heading:   { fontFamily: 'var(--fonts-ui)', fontWeight: '500', fontSize: '64px', letterSpacing: '-0.04em', lineHeight: '0.95' },
        },
      },

      pageFooter: {
        className: 'footer',
        slots: ['root', 'left', 'right'],
        base: {
          root:  { padding: '14px 32px', fontFamily: 'var(--fonts-mono)', fontSize: '11px', color: 'var(--colors-g4)', display: 'flex', justifyContent: 'space-between' },
          left:  {},
          right: {},
        },
      },
    },
  },
});
