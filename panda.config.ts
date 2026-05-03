import { defineConfig, defineGlobalStyles } from '@pandacss/dev';

const globalCss = defineGlobalStyles({
  // ── Icon buttons — Lucide SVG via CSS mask ───────────────────────
  '.ss-rows, .ss-plus, .ss-write, .ss-view, .ss-trash': {
    maskPosition: 'center center',
    maskRepeat: 'no-repeat',
    maskSize: '1.25rem 1.25rem',
    WebkitMaskPosition: 'center center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: '1.25rem 1.25rem',
    backgroundColor: 'currentColor',
    minWidth: '1.75rem',
    minHeight: '1.75rem',
  },
  '.ss-rows': {
    maskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cline x1=%273%27 y1=%276%27 x2=%2721%27 y2=%276%27/%3E%3Cline x1=%273%27 y1=%2712%27 x2=%2721%27 y2=%2712%27/%3E%3Cline x1=%273%27 y1=%2718%27 x2=%2721%27 y2=%2718%27/%3E%3C/svg%3E")',
    WebkitMaskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cline x1=%273%27 y1=%276%27 x2=%2721%27 y2=%276%27/%3E%3Cline x1=%273%27 y1=%2712%27 x2=%2721%27 y2=%2712%27/%3E%3Cline x1=%273%27 y1=%2718%27 x2=%2721%27 y2=%2718%27/%3E%3C/svg%3E")',
  },
  '.ss-plus': {
    maskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cline x1=%2712%27 y1=%275%27 x2=%2712%27 y2=%2719%27/%3E%3Cline x1=%275%27 y1=%2712%27 x2=%2719%27 y2=%2712%27/%3E%3C/svg%3E")',
    WebkitMaskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cline x1=%2712%27 y1=%275%27 x2=%2712%27 y2=%2719%27/%3E%3Cline x1=%275%27 y1=%2712%27 x2=%2719%27 y2=%2712%27/%3E%3C/svg%3E")',
  },
  '.ss-write': {
    maskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M12 20h9%27/%3E%3Cpath d=%27M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z%27/%3E%3C/svg%3E")',
    WebkitMaskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M12 20h9%27/%3E%3Cpath d=%27M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z%27/%3E%3C/svg%3E")',
  },
  '.ss-view': {
    maskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%273%27/%3E%3C/svg%3E")',
    WebkitMaskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z%27/%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%273%27/%3E%3C/svg%3E")',
  },
  '.ss-trash': {
    maskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%273 6 5 6 21 6%27/%3E%3Cpath d=%27M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2%27/%3E%3Cline x1=%2710%27 y1=%2711%27 x2=%2710%27 y2=%2717%27/%3E%3Cline x1=%2714%27 y1=%2711%27 x2=%2714%27 y2=%2717%27/%3E%3C/svg%3E")',
    WebkitMaskImage: 'url("data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%273 6 5 6 21 6%27/%3E%3Cpath d=%27M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2%27/%3E%3Cline x1=%2710%27 y1=%2711%27 x2=%2710%27 y2=%2717%27/%3E%3Cline x1=%2714%27 y1=%2711%27 x2=%2714%27 y2=%2717%27/%3E%3C/svg%3E")',
  },

  // ── Reset ────────────────────────────────────────────────────────
  '*': {
    margin: '0',
    padding: '0',
  },

  // ── html ─────────────────────────────────────────────────────────
  html: {
    fontSize: '16px',
    lineHeight: '1.45',
    color: 'var(--colors-g5)',
    overflowY: 'scroll',
    overflowX: 'hidden',
    height: '100%',
    width: '100%',
    '@media (min-width: 1200px)': { fontSize: '17px' },
    '@media (min-width: 1300px)': { fontSize: '18px' },
    '@media (min-width: 1600px)': { fontSize: '20px' },
    '@media (min-width: 1800px)': { fontSize: '22px' },
  },

  // ── body ─────────────────────────────────────────────────────────
  body: {
    display: 'flex',
    minHeight: '100%',
    minWidth: '100%',
  },

  // ── React root — transparent to flex layout ───────────────────────
  '#root': {
    display: 'contents',
  },

  // ── button base ──────────────────────────────────────────────────
  button: {
    appearance: 'none',
    WebkitAppearance: 'none',
    background: 'transparent',
    border: 'none',
    fontSize: '12px',
    color: 'var(--colors-g5)',
    padding: '0.5rem',
    cursor: 'pointer',
    opacity: '0.45',
    '&:hover, &:active, &.pressed': { opacity: '1' },
    '&:focus-visible': {
      opacity: '1',
      outline: '2px solid #2f8a5a',
      outlineOffset: '2px',
    },
  },

  // ── article ──────────────────────────────────────────────────────
  article: {
    '& > :first-child': { marginTop: '0' },
    '& > *': { marginTop: '1rem', marginBottom: '1rem' },
    '& h1': {
      fontSize: '1.5rem',
      marginTop: '4rem',
      marginBottom: '2.5rem',
      position: 'relative',
      textAlign: 'center',
      '&::after': {
        content: '""',
        width: '100px',
        left: '50%',
        marginLeft: '-50px',
        borderBottom: '1px solid var(--colors-g2)',
        top: '100%',
        position: 'absolute',
        marginTop: '1rem',
      },
    },
    '& h2': {
      fontSize: '1.25rem',
      marginTop: '2rem',
    },
    '& h3, & h4, & h5, & h6': {
      fontSize: '1rem',
      marginTop: '2rem',
      marginBottom: '-0.5rem',
    },
    '& p': { textAlign: 'left' },
    '& blockquote': {
      marginTop: '1.5rem',
      marginBottom: '1.5rem',
      fontStyle: 'italic',
    },
    '& a': {
      position: 'relative',
      color: '#2f8a5a',
      '&:hover, &:focus': { color: '#28774d' },
      '&:active': { top: '1px' },
    },
    '& ul, & ol': {
      marginLeft: '2em',
      fontSize: '0.9em',
    },
    '& ul > li, & ol > li': {
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    '& ul': { listStyleType: 'disc' },
    '& pre, & code': {
      fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace',
      marginTop: '1.5rem',
      marginBottom: '1.5rem',
    },
    '& pre': {
      fontSize: '0.875em',
      background: 'var(--colors-g0)',
      padding: '1rem 1.25rem',
      borderRadius: '3px',
      margin: '1.25em 0',
    },
    '& pre code, & pre code.hljs': {
      fontSize: '1em',
      background: 'transparent',
      padding: '0',
    },
    '& code': { fontSize: '0.875em' },
    '& hr': {
      background: 'transparent',
      border: 'none',
      width: '100px',
      margin: '1.5em auto',
      borderBottom: '1px solid var(--colors-g2)',
    },
    '& img': { maxWidth: '100%' },
  },

  // ── Plain textarea (React migration) ─────────────────────────────
  'textarea.document-textarea': {
    height: '100%',
    width: '100%',
    background: 'transparent',
    outline: 'none',
    resize: 'none',
    border: 'none',
    padding: '3rem',
    boxSizing: 'border-box',
  },

  // ── CodeMirror 6 write pane ───────────────────────────────────────
  '.cm-editor': {
    height: '100%',
    width: '100%',
    background: 'transparent',
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    fontSize: '13px',
    lineHeight: '1.4',
    '@media (min-width: 1200px)': { fontSize: '14px' },
    '&::-webkit-scrollbar': { width: '7px' },
    '&::-webkit-scrollbar-track': { margin: '3rem' },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: '14px',
      background: 'var(--colors-g2)',
    },
  },

  // ── Mode toggle — html-level class selectors (can't live in slot recipe) ──
  '.write-only .el__read, .read-only .el__write': { display: 'none' },
  '.write-only .el__write, .read-only .el__read': { flex: '1' },
  '.el__readButtons .el__readOnlyButton': { display: 'none' },
  '.read-only .el__readButtons .el__readOnlyButton': { display: 'block' },

  // ── Syntax highlighting ───────────────────────────────────────────
  'pre .comment': { color: 'var(--colors-g3)' },
  'pre .constant, pre .storage, pre .tag, pre .keyword:not(.operator), pre .selector, pre .string:not(.value), pre .regexp, pre .function': {
    color: '#4b8b8d',
  },

  // ── GFM Alert boxes ───────────────────────────────────────────────
  '.el__documentArticle .markdown-alert': {
    borderLeft: '4px solid',
    borderRadius: '0 3px 3px 0',
    padding: '0.75rem 1rem',
    margin: '1.5rem 0',
    '& > :last-child': { marginBottom: '0' },
  },
  '.el__documentArticle .markdown-alert-title': {
    fontSize: '0.8125em',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.4rem',
    marginTop: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4em',
  },
  '.el__documentArticle .markdown-alert-note': {
    background: '#f0f4f8',
    borderLeftColor: '#4a90c4',
    '& .markdown-alert-title': { color: '#4a90c4' },
  },
  '.el__documentArticle .markdown-alert-tip': {
    background: '#f0f7f4',
    borderLeftColor: '#2f8a5a',
    '& .markdown-alert-title': { color: '#2f8a5a' },
  },
  '.el__documentArticle .markdown-alert-important': {
    background: '#f5f0f8',
    borderLeftColor: '#8b5cf6',
    '& .markdown-alert-title': { color: '#8b5cf6' },
  },
  '.el__documentArticle .markdown-alert-warning': {
    background: '#fdf8f0',
    borderLeftColor: '#d97706',
    '& .markdown-alert-title': { color: '#d97706' },
  },
  '.el__documentArticle .markdown-alert-caution': {
    background: '#fdf0f0',
    borderLeftColor: '#dc2626',
    '& .markdown-alert-title': { color: '#dc2626' },
  },

  // ── @media print ─────────────────────────────────────────────────
  '@media print': {
    '.el__write, .el__readButtons': { display: 'none' },
    '.el__read': { border: 'none', boxShadow: 'none' },
    '.el__documentArticle': { margin: '0 auto', maxWidth: '35em', padding: '0' },
    '@page': { margin: '5em 0' },
    'body, .el__write, .el__read': { background: 'white' },
    '.el__documentArticle, .el__documentArticle p, .el__documentArticle h1, .el__documentArticle h2, .el__documentArticle h3, .el__documentArticle h4, .el__documentArticle h5, .el__documentArticle h6, .el__documentArticle li, .el__documentArticle blockquote': {
      color: 'black',
    },
    'a': { textDecoration: 'none' },
    'a[href]::after': { content: '" (" attr(href) ")"' },
    'img': { maxWidth: '100%' },
  },

  // ── Landing page ─────────────────────────────────────────────────
  '.landing-page': {
    maxWidth: '1440px',
    marginInline: 'auto',
    width: '100%',
  },
  '.hero-numeral': {
    fontSize: 'clamp(56px, 10vw, 132px)',
  },

  // Mobile responsive overrides
  '@media (max-width: 767px)': {
    '[data-split]': { gridTemplateColumns: '1fr !important' },
    '[data-split] > *:first-child': {
      borderRight: 'none !important',
      borderBottom: '1px solid var(--colors-g2)',
    },
    '.nav__links-wrap': { display: 'none' },
    '.nav__root': { padding: '16px 20px' },
    '[data-split] .hero-col': { padding: '48px 24px 40px' },
    '[class*="pq__text"]': { fontSize: '28px !important' },
    '[class*="pq__root"]': { padding: '56px 24px !important' },
    '[class*="feat__root"]': {
      gridTemplateColumns: '40px 1fr !important',
      padding: '20px 24px !important',
      gap: '16px !important',
    },
    '[class*="feat__desc"]': { display: 'none' },
    '[class*="stack__root"]': { padding: '40px 24px !important' },
    '[class*="stack__inner"]': {
      gridTemplateColumns: '1fr !important',
      gap: '28px !important',
    },
    '[class*="stack__heading"]': { fontSize: '36px !important' },
    '[data-cta-split]': { gridTemplateColumns: '1fr !important' },
    '[data-cta-split] > *:first-child': {
      borderRight: 'none !important',
      borderBottom: '1px solid var(--colors-g5)',
    },
    '[class*="cta__heading"]': {
      fontSize: '36px !important',
      paddingTop: '20px !important',
    },
  },
});

export default defineConfig({
  // Do not inject a CSS reset — globalCss owns base resets
  preflight: false,

  // Enable styled factory + style props for React
  jsxFramework: 'react',

  // Files scanned for used class names (tree-shaking)
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],

  outdir: 'styled-system',

  globalCss,

  theme: {
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },

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
      sectionTitle: { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '500', fontSize: '28px', letterSpacing: '-0.03em', lineHeight: '1' } },
      bodyLg:       { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '400', fontSize: '18px', lineHeight: '1.5' } },
      body:         { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '400', fontSize: '16px', lineHeight: '1.5' } },
      uiBtn:        { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '500', fontSize: '14px', lineHeight: '1' } },
      caption:      { value: { fontFamily: 'var(--fonts-ui)', fontWeight: '400', fontSize: '12px', lineHeight: '1.4' } },
      meta:         { value: { fontFamily: 'var(--fonts-mono)', fontWeight: '400', fontSize: '11px', letterSpacing: '0.02em', lineHeight: '1' } },
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
          opacity: '1',
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
            ink: {
              background: '{colors.ink}',
              color: '{colors.g0}',
              borderColor: '{colors.ink}',
              _hover: { background: '{colors.g6}', borderColor: '{colors.g6}' },
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
        slots: ['root', 'links', 'link', 'cta'],
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
          desc:  { fontFamily: 'var(--fonts-ui)', fontSize: '16px', color: 'var(--colors-g4)', lineHeight: '1.5', textWrap: 'pretty' as const }, // cast required: not in PandaCSS 1.x type union but valid CSS
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

      contextMenu: {
        className: 'ctx',
        slots: ['root', 'item', 'icon'],
        base: {
          root: {
            background: 'var(--colors-g0)',
            border: '1px solid var(--colors-g2)',
            borderRadius: '0',
            padding: '4px 0',
            minWidth: '160px',
            boxShadow: '0 4px 16px color-mix(in srgb, var(--colors-g5) 12%, transparent)',
            fontSize: '12px',
          },
          item: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '6px 12px',
            background: 'none',
            border: 'none',
            color: 'var(--colors-g5)',
            cursor: 'pointer',
            textAlign: 'left',
            '&:hover': { background: 'color-mix(in srgb, var(--colors-g5) 8%, transparent)' },
          },
          icon: { fontSize: '13px' },
        },
        variants: {
          danger: {
            true: {
              item: { color: '#c0392b' },
            },
          },
        },
      },

      documentMenu: {
        className: 'dmenu',
        slots: ['backdrop', 'drawer', 'list', 'item', 'itemWrap', 'itemTitle', 'deleteBtn'],
        base: {
          backdrop: {
            position: 'fixed',
            inset: '0',
            zIndex: '199',
            background: 'color-mix(in srgb, var(--colors-g5) 15%, transparent)',
            border: 'none',
            padding: '0',
            cursor: 'default',
          },
          drawer: {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '280px',
            height: '100vh',
            background: 'var(--colors-g0)',
            borderRight: '1px solid var(--colors-g2)',
            boxShadow: '4px 0 24px color-mix(in srgb, var(--colors-g5) 10%, transparent)',
            zIndex: '200',
            overflowY: 'auto',
            transform: 'translateX(-100%)',
            transition: 'transform 200ms ease',
            '&.open': { transform: 'translateX(0)' },
          },
          list: {
            listStyle: 'none',
            padding: '6px 0',
            '&::-webkit-scrollbar': { width: '0' },
          },
          item: {
            overflow: 'hidden',
            cursor: 'pointer',
            borderLeft: '2px solid transparent',
            '&:hover, &:focus-within': {
              background: 'color-mix(in srgb, var(--colors-g5) 6%, transparent)',
              outline: 'none',
            },
            '&:active': { background: 'color-mix(in srgb, var(--colors-g5) 10%, transparent)' },
            '&:has(a[aria-current="page"])': {
              background: 'color-mix(in srgb, var(--colors-g5) 8%, transparent)',
              borderLeftColor: 'var(--colors-ink)',
            },
            '&:hover .dmenu__itemTitle, &:has(a[aria-current="page"]) .dmenu__itemTitle': {
              color: 'var(--colors-g6)',
            },
            '&:hover .dmenu__deleteBtn': { opacity: '1' },
          },
          itemWrap: {
            display: 'flex',
            alignItems: 'center',
            padding: '5px 12px',
            gap: '4px',
            minWidth: '0',
          },
          itemTitle: {
            flex: '1',
            minWidth: '0',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            lineHeight: '1.5',
            color: 'var(--colors-g5)',
            textDecoration: 'none',
            padding: '2px 0',
          },
          deleteBtn: {
            flexShrink: '0',
            opacity: '0',
            background: 'none',
            border: 'none',
            color: 'var(--colors-g3)',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: '11px',
            lineHeight: '1',
          },
        },
      },

      workspaceCreate: {
        className: 'wscreate',
        slots: ['root', 'icon', 'title', 'desc', 'form', 'input', 'btn'],
        base: {
          root: { padding: '16px 12px', textAlign: 'center', color: 'var(--colors-g4)' },
          icon: { fontSize: '24px', display: 'block', marginBottom: '8px' },
          title: { color: 'var(--colors-g6)', fontWeight: '600', fontSize: '13px', margin: '0 0 4px' },
          desc: { fontSize: '11px', margin: '0 0 12px', lineHeight: '1.5' },
          form: { display: 'flex', flexDirection: 'column', gap: '8px' },
          input: {
            padding: '6px 10px',
            border: '1px solid var(--colors-g2)',
            borderRadius: '0',
            background: 'var(--colors-g0)',
            color: 'var(--colors-g6)',
            fontSize: '12px',
          },
          btn: {
            padding: '7px 12px',
            background: 'var(--colors-g6)',
            color: 'var(--colors-g0)',
            border: '1px solid var(--colors-g6)',
            borderRadius: '0',
            fontSize: '12px',
            cursor: 'pointer',
            '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
          },
        },
      },

      workspaceDrawer: {
        className: 'wsdrawer',
        slots: [
          'root', 'header', 'title', 'titleIcon', 'actions', 'actionBtn',
          'tree', 'key', 'keyValue', 'keyCopy', 'createCta',
          'confirmOverlay', 'confirm', 'confirmActions', 'confirmDelete',
        ],
        base: {
          root: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--colors-g0)', color: 'var(--colors-g5)' },
          header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            borderBottom: '1px solid var(--colors-g2)',
            flexShrink: '0',
          },
          title: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--colors-g6)', fontWeight: '600', fontSize: '12px' },
          titleIcon: { fontSize: '10px' },
          actions: { display: 'flex', gap: '10px' },
          actionBtn: {
            background: 'none',
            border: 'none',
            color: 'var(--colors-g3)',
            cursor: 'pointer',
            fontSize: '13px',
            padding: '2px',
            opacity: '0.45',
            '&:hover': { color: 'var(--colors-g6)', opacity: '1' },
          },
          tree: { flex: '1', overflowY: 'auto', padding: '6px 0' },
          key: {
            padding: '8px 12px',
            borderTop: '1px solid var(--colors-g2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            color: 'var(--colors-g3)',
            flexShrink: '0',
          },
          keyValue: { fontFamily: 'monospace', flex: '1' },
          keyCopy: {
            background: 'none',
            border: 'none',
            color: 'var(--colors-g3)',
            cursor: 'pointer',
            fontSize: '10px',
            padding: '0',
            opacity: '0.45',
            '&:hover': { color: 'var(--colors-g4)', opacity: '1' },
          },
          createCta: { borderTop: '1px solid var(--colors-g2)', marginTop: '8px' },
          confirmOverlay: {
            position: 'fixed',
            inset: '0',
            background: 'color-mix(in srgb, var(--colors-g5) 50%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '200',
          },
          confirm: {
            background: 'var(--colors-g0)',
            border: '1px solid var(--colors-g2)',
            borderRadius: '0',
            padding: '20px',
            maxWidth: '320px',
            color: 'var(--colors-g5)',
            fontSize: '13px',
            '& p': { margin: '0 0 16px' },
          },
          confirmActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
          confirmDelete: { background: '#c0392b', borderColor: '#c0392b', color: 'var(--colors-g0)' },
        },
      },

      folderTree: {
        className: 'ftree',
        slots: ['row', 'folderBtn', 'docBtn', 'chevron', 'icon', 'label'],
        base: {
          row: { display: 'flex', alignItems: 'center' },
          folderBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            width: '100%',
            padding: '4px 8px 4px 0',
            background: 'none',
            border: 'none',
            color: 'var(--colors-g5)',
            cursor: 'pointer',
            fontSize: '12px',
            textAlign: 'left',
            opacity: '0.45',
            '&:hover': { color: 'var(--colors-g6)', opacity: '1' },
          },
          docBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            width: '100%',
            padding: '4px 8px 4px 0',
            background: 'none',
            border: 'none',
            color: 'var(--colors-g5)',
            cursor: 'pointer',
            fontSize: '12px',
            textAlign: 'left',
            opacity: '0.45',
            '&:hover': { color: 'var(--colors-g6)', opacity: '1' },
          },
          chevron: { fontSize: '9px', color: 'var(--colors-g3)', width: '10px' },
          icon: { fontSize: '12px' },
          label: { flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        },
        variants: {
          active: {
            true: {
              row: {
                background: 'color-mix(in srgb, var(--colors-g5) 8%, transparent)',
                borderLeft: '2px solid var(--colors-ink)',
              },
            },
          },
        },
      },

      editorLayout: {
        className: 'el',
        slots: [
          'write', 'read', 'writeForm', 'writeButtons', 'readButtons',
          'textareaWrap', 'menuButton', 'addButton', 'readOnlyButton',
          'writeOnlyButton', 'documentArticle',
        ],
        base: {
          write: {
            position: 'relative',
            overflow: 'hidden',
            flex: '0 0 33rem',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--colors-g0)',
            fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace',
            fontSize: '13px',
            lineHeight: '1.4',
            '@media (min-width: 1200px)': { fontSize: '14px' },
          },
          read: {
            position: 'relative',
            overflow: 'hidden',
            flex: '1',
            fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif',
            borderLeft: '1px solid var(--colors-g1)',
            boxShadow: '0 -1px 10px var(--colors-g1)',
          },
          writeForm: {
            position: 'relative',
            flex: '1',
            '&:focus-within .el__textareaWrap': {
              backgroundColor: 'var(--colors-g0)',
              boxShadow: '0 0 0 1px var(--colors-g1), 0 2px 24px -8px color-mix(in srgb, var(--colors-g5) 8%, transparent)',
            },
            '&:has(.cm-content:focus-visible) .el__textareaWrap, &:has(textarea:focus-visible) .el__textareaWrap': {
              boxShadow: '0 0 0 1px var(--colors-g2), 0 2px 24px -8px color-mix(in srgb, var(--colors-g5) 12%, transparent)',
            },
          },
          writeButtons: {
            position: 'relative',
            overflow: 'hidden',
            zIndex: '1',
          },
          readButtons: {
            position: 'relative',
            overflow: 'hidden',
            zIndex: '1',
          },
          textareaWrap: {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            borderRadius: '4px',
            transition: 'box-shadow 250ms ease, background-color 250ms ease',
          },
          menuButton: {
            position: 'relative',
            zIndex: '2',
            float: 'left',
          },
          addButton: {
            position: 'relative',
            zIndex: '2',
            float: 'left',
          },
          readOnlyButton: {
            position: 'relative',
            zIndex: '2',
            float: 'left',
          },
          writeOnlyButton: {
            position: 'relative',
            zIndex: '2',
            float: 'right',
          },
          documentArticle: {
            padding: '3rem',
            maxWidth: '32rem',
            margin: '0 auto',
          },
        },
      },
    },
  },
});
