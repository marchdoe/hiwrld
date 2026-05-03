// hiwrld · v3 "the split" — Maison Neue edition
// Concept: the product IS the brand. Every asset composed across a single
// vertical hairline. No metaphors. No mascots. No corner marks. Quiet.
// Type: PP Editorial New (display) + Maison Neue (UI) + Maison Neue Mono (meta)
// NOTE: Maison Neue is a paid Milieu Grotesque face; in this preview it falls
// back to Helvetica Neue. License from milieugrotesque.com for production.
// Color: 7-step warm gray, no pure black. Single quiet graphite-blue accent.

const T = {
  g0: '#f7f6f3',
  g1: '#ecebe7',
  g2: '#dcd9d2',
  g3: '#a8a39a',
  g4: '#6e6a62',
  g5: '#3d3a35',
  g6: '#1f1d1a',
  // single accent — quieter than dial-blue, more graphite
  ink:     '#3a4a6b',  // graphite-blue, the only accent
  inkSoft: '#b8c2d4',
  display: '"Editorial New", "PP Editorial New", Georgia, serif',
  ui:      '"Maison Neue", "Helvetica Neue", Helvetica, Arial, sans-serif',
  mono:    '"Maison Neue Mono", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// THE central primitive: a thing rendered across the split.
// Left column / vertical hairline / right column.
function Split({ left, right, ratio = '1fr 1fr', height, bg = T.g0, fg = T.g6, padded = '32px 36px', ruleColor = T.g2, padTop, ruleWeight = 1, style }) {
  return (
    <div style={{
      background: bg, color: fg,
      display: 'grid', gridTemplateColumns: ratio,
      height: height || '100%', minHeight: 0,
      fontFamily: T.ui,
      ...style,
    }}>
      <div style={{ padding: padded, paddingTop: padTop, borderRight: `${ruleWeight}px solid ${ruleColor}`, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>{left}</div>
      <div style={{ padding: padded, paddingTop: padTop, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>{right}</div>
    </div>
  );
}

// ── 01 · COVER ──────────────────────────────────────────────
function Cover() {
  return (
    <div className="ab" style={{ background: T.g0, color: T.g6, border: `1px solid ${T.g2}`, fontFamily: T.ui }}>
      <Split
        padded="44px 56px"
        left={
          <>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g4, letterSpacing: '0.02em' }}>hiwrld · system 003</div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 132, letterSpacing: '-0.05em', lineHeight: 0.86, color: T.g6 }}>
                hi
              </div>
              <div style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 28, marginTop: 14, color: T.g5, lineHeight: 1.2, maxWidth: 320 }}>
                the side you write on.
              </div>
            </div>
            <div style={{ marginTop: 24, fontFamily: T.mono, fontSize: 10, color: T.g3, letterSpacing: '0.02em' }}>est. 2012 / reprinted 2026</div>
          </>
        }
        right={
          <>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g4, letterSpacing: '0.02em', textAlign: 'right' }}>the split</div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 132, letterSpacing: '-0.05em', lineHeight: 0.86, color: T.ink }}>
                wrld
              </div>
              <div style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 28, marginTop: 14, color: T.g5, lineHeight: 1.2, maxWidth: 360 }}>
                the side everyone else reads.
              </div>
            </div>
            <div style={{ marginTop: 24, fontFamily: T.mono, fontSize: 10, color: T.g3, letterSpacing: '0.02em', textAlign: 'right' }}>hiwrld.com</div>
          </>
        }
      />
    </div>
  );
}

// ── 02 · WORDMARKS ──────────────────────────────────────────
function ABFrame({ tl, tr, children, bg = T.g0, fg = T.g6, padded = true, rule = T.g2 }) {
  return (
    <div className="ab" style={{
      background: bg, color: fg, border: `1px solid ${rule}`,
      display: 'flex', flexDirection: 'column', fontFamily: T.ui,
    }}>
      <div style={{
        padding: '10px 16px', borderBottom: `1px solid ${rule}`,
        fontFamily: T.mono, fontSize: 10, color: T.g4, letterSpacing: '0.02em',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{tl}</span><span>{tr}</span>
      </div>
      <div style={{ flex: 1, padding: padded ? 18 : 0, minHeight: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// THE mark: hi*wrld* — the asterisks are markdown emphasis syntax,
// so the brand spelling itself reads as markdown. "wrld" between the
// asterisks renders bold; the asterisks are kept visible in the accent
// color as the central glyph of the mark.
//
// modes:
//   'primary' — full lockup: hi*wrld*
//   'mono'    — same lockup, single color (asterisks inherit text color)
//   'short'   — favicon abbreviation: hi*
function Wordmark({
  size = 110,
  color = T.g6,
  accent = T.ink,
  regular = 400,
  bold = 700,
  mode = 'primary',
}) {
  const isMono = mode === 'mono';
  const aColor = isMono ? color : accent;

  if (mode === 'short') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'baseline',
        fontFamily: T.ui, fontSize: size, letterSpacing: '-0.04em', lineHeight: 1,
      }}>
        <span style={{ color, fontWeight: bold }}>hi</span>
        <span style={{ color: aColor, fontWeight: regular, fontSize: size * 0.95, marginLeft: size * 0.03 }}>*</span>
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline',
      fontFamily: T.ui, fontSize: size, letterSpacing: '-0.04em', lineHeight: 1,
    }}>
      <span style={{ color, fontWeight: regular }}>hi</span>
      <span style={{ color: aColor, fontWeight: regular, fontSize: size * 0.95, margin: `0 ${size * 0.005}px 0 ${size * 0.04}px` }}>*</span>
      <span style={{ color, fontWeight: bold }}>wrld</span>
      <span style={{ color: aColor, fontWeight: regular, fontSize: size * 0.95, margin: `0 0 0 ${size * 0.005}px` }}>*</span>
    </span>
  );
}

function WMPrimary() {
  return (
    <ABFrame tl="wordmark / 01" tr="primary" padded={false}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Wordmark size={104} color={T.g6} accent={T.ink} />
      </div>
    </ABFrame>
  );
}

function WMMonochrome() {
  return (
    <ABFrame tl="wordmark / 02" tr="monochrome" padded={false}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Wordmark size={104} color={T.g6} mode="mono" />
      </div>
    </ABFrame>
  );
}

function WMReversed() {
  return (
    <ABFrame tl="wordmark / 03" tr="reversed" padded={false} bg={T.g6} fg={T.g0} rule={T.g5}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Wordmark size={104} color={T.g0} accent={T.inkSoft} />
      </div>
    </ABFrame>
  );
}

function WMEditorial() {
  // wildcard: italic editorial cut. used for the masthead of the project.
  return (
    <ABFrame tl="wordmark / 04" tr="editorial cut" bg={T.g1}>
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', borderLeft: 'none' }}>
        <div style={{ paddingRight: 14, borderRight: `1px solid ${T.g3}`, textAlign: 'right' }}>
          <div style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 78, letterSpacing: '-0.03em', color: T.g6, lineHeight: 0.95 }}>hi,</div>
        </div>
        <div style={{ paddingLeft: 14 }}>
          <div style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 78, letterSpacing: '-0.03em', color: T.ink, lineHeight: 0.95 }}>wrld.</div>
        </div>
      </div>
    </ABFrame>
  );
}

function WMConstruction() {
  return (
    <ABFrame tl="construction" tr="x = cap-height">
      <div style={{
        position: 'relative', height: '100%',
        backgroundImage: `linear-gradient(to right, ${T.ink}1f 1px, transparent 1px), linear-gradient(to bottom, ${T.ink}1f 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ position: 'absolute', top: '32%', left: 0, right: 0, height: 1, background: T.ink, opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: '32%', left: 0, right: 0, height: 1, background: T.ink, opacity: 0.5 }}></div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Wordmark size={88} color={T.g6} accent={T.ink} />
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 14, fontFamily: T.mono, fontSize: 10, color: T.g4 }}>
          maison neue · 400 / 700 · ls -4% · the spelling is markdown
        </div>
      </div>
    </ABFrame>
  );
}

function WMScale() {
  const sizes = [64, 40, 24, 16];
  return (
    <ABFrame tl="scale" tr="min = 16px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', height: '100%' }}>
        {sizes.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <Wordmark size={s} color={T.g6} accent={T.ink} />
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.g4, marginLeft: 'auto' }}>{s}px</span>
          </div>
        ))}
      </div>
    </ABFrame>
  );
}

// Anatomy: pull the four parts apart with callouts.
function WMAnatomy() {
  return (
    <ABFrame tl="anatomy" tr="four parts">
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
        <Wordmark size={96} color={T.g6} accent={T.ink} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 32, fontFamily: T.mono, fontSize: 10, color: T.g4, letterSpacing: '0.02em', textAlign: 'center' }}>
          <div><div style={{ color: T.g6, fontFamily: T.ui, fontWeight: 400, fontSize: 22 }}>hi</div><div style={{ marginTop: 4 }}>regular</div></div>
          <div><div style={{ color: T.ink, fontFamily: T.ui, fontWeight: 400, fontSize: 22 }}>*</div><div style={{ marginTop: 4 }}>open emph</div></div>
          <div><div style={{ color: T.g6, fontFamily: T.ui, fontWeight: 700, fontSize: 22 }}>wrld</div><div style={{ marginTop: 4 }}>bold</div></div>
          <div><div style={{ color: T.ink, fontFamily: T.ui, fontWeight: 400, fontSize: 22 }}>*</div><div style={{ marginTop: 4 }}>close emph</div></div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g4, letterSpacing: '0.02em' }}>
          the spelling itself is markdown — *wrld* renders bold
        </div>
      </div>
    </ABFrame>
  );
}

// In context: nav bar + signature.
function WMInContext() {
  return (
    <ABFrame tl="in context" tr="@ 24 / 28px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', height: '100%' }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4, marginBottom: 8 }}>nav bar</div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', border: `1px solid ${T.g2}`, background: T.g0,
          }}>
            <Wordmark size={24} color={T.g6} accent={T.ink} />
            <div style={{ display: 'flex', gap: 16, fontFamily: T.ui, fontSize: 13, color: T.g5, alignItems: 'center' }}>
              <span>features</span><span>stack</span><span>github</span>
              <span style={{ padding: '4px 10px', background: T.g6, color: T.g0, fontWeight: 500 }}>open editor →</span>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4, marginBottom: 8 }}>signature · dark</div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 22px', background: T.g6, color: T.g0,
          }}>
            <Wordmark size={28} color={T.g0} accent={T.inkSoft} />
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.g3 }}>est. 2012 / 2026</span>
          </div>
        </div>
      </div>
    </ABFrame>
  );
}

// ── 03 · TOKENS ─────────────────────────────────────────────
function GrayScale() {
  const steps = [
    { name: 'g0', hex: T.g0, role: 'canvas' },
    { name: 'g1', hex: T.g1, role: 'panel' },
    { name: 'g2', hex: T.g2, role: 'rule' },
    { name: 'g3', hex: T.g3, role: 'mute' },
    { name: 'g4', hex: T.g4, role: 'meta' },
    { name: 'g5', hex: T.g5, role: 'body' },
    { name: 'g6', hex: T.g6, role: 'graphite' },
  ];
  return (
    <ABFrame tl="gray / 7-step" tr="no pure black">
      <div style={{ display: 'flex', height: '100%', gap: 0 }}>
        {steps.map((s, i) => (
          <div key={s.name} style={{
            flex: 1, background: s.hex, color: i < 4 ? T.g6 : T.g0,
            padding: '14px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.02em',
          }}>
            <div style={{ fontWeight: 500 }}>{s.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ opacity: 0.85 }}>{s.hex}</span>
              <span style={{ opacity: 0.65 }}>{s.role}</span>
            </div>
          </div>
        ))}
      </div>
    </ABFrame>
  );
}

function AccentTokens() {
  const a = [
    { name: 'ink',      hex: T.ink,     role: 'wrld · link · live', dark: true },
    { name: 'ink-soft', hex: T.inkSoft, role: 'wash · selection',   dark: false },
  ];
  return (
    <ABFrame tl="accent / 1+1" tr="oklch(0.55 0.10 250)">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: '100%' }}>
        {a.map(s => (
          <div key={s.name} style={{
            background: s.hex, color: s.dark ? T.g0 : T.g6,
            padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            fontFamily: T.mono, fontSize: 11,
          }}>
            <div style={{ fontWeight: 500 }}>--{s.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ opacity: 0.9 }}>{s.hex}</span>
              <span style={{ opacity: 0.7, fontSize: 10 }}>{s.role}</span>
            </div>
          </div>
        ))}
      </div>
    </ABFrame>
  );
}

function TypeSpec() {
  return (
    <ABFrame tl="type / 3 families" tr="display · ui · mono">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, height: '100%' }}>
        <div style={{ paddingRight: 18, borderRight: `1px solid ${T.g2}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>display — italic, sparingly</div>
          <div style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.03em' }}>Aa</div>
          <div style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 22, color: T.g5 }}>Editorial New</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>200 / 300 — pull quotes only</div>
        </div>
        <div style={{ padding: '0 18px', borderRight: `1px solid ${T.g2}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>ui — workhorse</div>
          <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.04em' }}>Aa</div>
          <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em' }}>Geist</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>300 / 400 / 500 / 600</div>
        </div>
        <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>mono — labels, ids</div>
          <div style={{ fontFamily: T.mono, fontWeight: 500, fontSize: 56, lineHeight: 0.95 }}>Aa</div>
          <div style={{ fontFamily: T.mono, fontSize: 20 }}>Geist Mono</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>// timestamps · code · meta</div>
        </div>
      </div>
    </ABFrame>
  );
}

// ── 04 · COMPONENTS ─────────────────────────────────────────
function Components() {
  return (
    <ABFrame tl="components" tr="quiet">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <Row label="buttons">
          <Btn variant="solid">new doc</Btn>
          <Btn variant="line">share url</Btn>
          <Btn variant="link">view source ↗</Btn>
          <Btn variant="ghost">delete</Btn>
        </Row>
        <Row label="modes">
          <Seg active>split</Seg><Seg>read</Seg><Seg>write</Seg>
        </Row>
        <Row label="status">
          <Tag dot={T.ink}>live</Tag>
          <Tag dot={T.g4}>saved</Tag>
          <Tag>offline</Tag>
        </Row>
        <Row label="link">
          <span style={{ fontFamily: T.ui, fontSize: 16, color: T.g6 }}>
            paste a youtube link or read the&nbsp;
            <a style={{ color: T.ink, textDecoration: 'none', borderBottom: `1px solid ${T.ink}`, paddingBottom: 1 }}>readme</a>.
          </span>
        </Row>
      </div>
    </ABFrame>
  );
}
function Row({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 16 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}
function Btn({ variant, children }) {
  const base = { fontFamily: T.ui, fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em', padding: '8px 14px', cursor: 'pointer', border: `1px solid ${T.g6}`, borderRadius: 0 };
  if (variant === 'solid') return <button style={{ ...base, background: T.g6, color: T.g0 }}>{children}</button>;
  if (variant === 'line')  return <button style={{ ...base, background: 'transparent', color: T.g6 }}>{children}</button>;
  if (variant === 'ghost') return <button style={{ ...base, background: 'transparent', color: T.g4, border: `1px dashed ${T.g3}` }}>{children}</button>;
  if (variant === 'link')  return <button style={{ ...base, background: 'transparent', color: T.ink, border: 'none', padding: '8px 0', textDecoration: 'none', borderBottom: `1px solid ${T.ink}`, borderRadius: 0 }}>{children}</button>;
  return <button style={base}>{children}</button>;
}
function Seg({ active, children }) {
  return <span style={{ fontFamily: T.ui, fontSize: 13, fontWeight: active ? 500 : 400, color: active ? T.g6 : T.g4, borderBottom: active ? `1px solid ${T.ink}` : '1px solid transparent', paddingBottom: 2 }}>{children}</span>;
}
function Tag({ dot, children }) {
  return (
    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.g5, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 10px', border: `1px solid ${T.g2}` }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }}></span>}
      {children}
    </span>
  );
}

// ── 05 · FAVICON ────────────────────────────────────────────
function Favicons() {
  const sizes = [16, 24, 32, 48, 96];
  return (
    <ABFrame tl="favicon" tr="the split, in a square">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, height: '100%', justifyContent: 'center' }}>
        {sizes.map(s => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <FavTile size={s} />
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>{s}px</span>
          </div>
        ))}
        <div style={{ width: 1, alignSelf: 'stretch', background: T.g2, margin: '0 8px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <FavTile size={96} variant="light" />
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>light</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <FavTile size={96} variant="accent" />
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.g4 }}>accent</span>
        </div>
      </div>
    </ABFrame>
  );
}
// Favicon = the wordmark abbreviated. "hi" bold + "*" accent — same
// construction logic as the wordmark, just clipped to two glyphs.
function FavTile({ size, variant = 'graphite' }) {
  const isLight = variant === 'light';
  const isAccent = variant === 'accent';
  const bg = isLight ? T.g0 : isAccent ? T.ink : T.g6;
  const fg = isLight ? T.g6 : T.g0;
  // On the accent (graphite-blue) tile, the asterisk needs to read against
  // its own background — use light fg instead of the accent color.
  const astColor = isAccent ? T.g0 : T.inkSoft;
  return (
    <div style={{
      width: size, height: size, background: bg,
      border: isLight ? `1px solid ${T.g2}` : 'none', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'baseline',
        fontFamily: T.ui, letterSpacing: '-0.05em', lineHeight: 1,
      }}>
        <span style={{ color: fg, fontWeight: 700, fontSize: size * 0.58 }}>hi</span>
        <span style={{ color: astColor, fontWeight: 400, fontSize: size * 0.58, marginLeft: size * 0.03 }}>*</span>
      </span>
    </div>
  );
}

// ── 06 · OG CARD ────────────────────────────────────────────
function OG() {
  return (
    <ABFrame tl="og / 1200×630" tr="hiwrld.com" padded={false}>
      <Split
        bg={T.g0}
        padded="32px 36px"
        left={
          <>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g4 }}>hi —</div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 96, lineHeight: 0.86, letterSpacing: '-0.05em', color: T.g6 }}>write</div>
              <div style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 22, color: T.g5, marginTop: 10 }}>plain markdown.</div>
            </div>
          </>
        }
        right={
          <>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g4, textAlign: 'right' }}>— wrld</div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 96, lineHeight: 0.86, letterSpacing: '-0.05em', color: T.ink }}>read</div>
              <div style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 22, color: T.g5, marginTop: 10 }}>share the url.</div>
            </div>
          </>
        }
      />
    </ABFrame>
  );
}

// ── 07 · PRODUCT EDITOR ─────────────────────────────────────
function ProductEditor() {
  const [text, setText] = React.useState(`# notes — may 2

> the side you write on, the side everyone else reads.

## what i'm thinking about

- the *split* is the brand
- one rule, two columns
- everything else is restraint

the url is the document. the document is the post.`);
  return (
    <div className="ab" style={{ background: T.g0, color: T.g6, border: `1px solid ${T.g2}`, display: 'flex', flexDirection: 'column', fontFamily: T.ui }}>
      <div style={{
        padding: '14px 22px', borderBottom: `1px solid ${T.g2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Wordmark size={22} color={T.g6} accent={T.ink} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.g4 }}>k7m2x9q</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Seg active>split</Seg>
          <Seg>read</Seg>
          <Seg>write</Seg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: T.mono, fontSize: 11, color: T.g4 }}>
          <Tag dot={T.ink}>live</Tag>
          <Btn variant="link">share ↗</Btn>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          spellCheck={false}
          style={{
            background: T.g0, color: T.g6,
            border: 'none', borderRight: `1px solid ${T.g2}`,
            outline: 'none', resize: 'none', padding: '36px 44px',
            fontFamily: T.mono, fontSize: 14, lineHeight: 1.7,
          }}
        />
        <div style={{
          padding: '36px 48px', overflow: 'auto',
          fontFamily: T.ui, fontSize: 17, lineHeight: 1.55, color: T.g6, background: T.g1,
        }}>
          {window.renderMD(text, {
            h1: { fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 40, letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1, color: T.g6 },
            h2: { fontFamily: T.ui, fontWeight: 500, fontSize: 17, letterSpacing: '-0.01em', margin: '24px 0 8px', color: T.g4, textTransform: 'uppercase' },
            p: { margin: '0 0 14px', textWrap: 'pretty' },
            blockquote: { fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 22, borderLeft: `2px solid ${T.ink}`, padding: '4px 0 4px 18px', margin: '14px 0', color: T.g5 },
            li: { margin: '4px 0' },
            accent: T.ink,
          })}
        </div>
      </div>
    </div>
  );
}

// ── 08 · LANDING ────────────────────────────────────────────
function Landing() {
  return (
    <div className="ab" style={{ background: T.g0, color: T.g6, fontFamily: T.ui, border: `1px solid ${T.g2}`, overflow: 'auto' }}>
      {/* nav — itself a split */}
      <header style={{
        position: 'sticky', top: 0, background: T.g0, zIndex: 5,
        padding: '20px 32px', borderBottom: `1px solid ${T.g2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Wordmark size={26} color={T.g6} accent={T.ink} />
        <nav style={{ display: 'flex', gap: 22, alignItems: 'center', fontFamily: T.ui, fontSize: 14, color: T.g5 }}>
          <a style={{ color: T.g5, textDecoration: 'none', cursor: 'pointer' }}>features</a>
          <a style={{ color: T.g5, textDecoration: 'none', cursor: 'pointer' }}>stack</a>
          <a style={{ color: T.g5, textDecoration: 'none', cursor: 'pointer' }}>github</a>
          <a style={{ padding: '8px 14px', background: T.g6, color: T.g0, textDecoration: 'none', cursor: 'pointer', fontWeight: 500 }}>open editor →</a>
        </nav>
      </header>

      {/* hero — the brand, lived */}
      <section style={{ borderBottom: `1px solid ${T.g2}` }}>
        <Split
          padded="80px 56px 64px"
          left={
            <>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g4 }}>hi —</div>
              <div style={{ marginTop: 36 }}>
                <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 132, lineHeight: 0.86, letterSpacing: '-0.05em', color: T.g6 }}>
                  write.
                </div>
                <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.5, color: T.g5, maxWidth: 380, textWrap: 'pretty' }}>
                  Open a tab, type plain markdown. The browser is the only
                  software you need. <span style={{ color: T.g4 }}>No accounts, no toolbar, no nonsense.</span>
                </p>
              </div>
              <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                <a style={{ padding: '14px 22px', background: T.g6, color: T.g0, textDecoration: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>open a new document →</a>
              </div>
            </>
          }
          right={
            <>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g4, textAlign: 'right' }}>— wrld</div>
              <div style={{ marginTop: 36 }}>
                <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 132, lineHeight: 0.86, letterSpacing: '-0.05em', color: T.ink }}>
                  read.
                </div>
                <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.5, color: T.g5, maxWidth: 380, textWrap: 'pretty' }}>
                  Anyone with the URL reads along, live. Every keystroke
                  syncs across tabs and devices. <span style={{ color: T.g4 }}>The link is the document.</span>
                </p>
              </div>
              <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                <a style={{ padding: '14px 22px', background: 'transparent', color: T.g6, border: `1px solid ${T.g6}`, textDecoration: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>view a sample ↗</a>
              </div>
            </>
          }
        />
      </section>

      {/* the pull-quote — italic display, single line, on its own */}
      <section style={{ padding: '90px 56px', borderBottom: `1px solid ${T.g2}`, textAlign: 'center', background: T.g1 }}>
        <blockquote style={{
          margin: 0, fontFamily: T.display, fontStyle: 'italic', fontWeight: 300,
          fontSize: 56, lineHeight: 1.15, letterSpacing: '-0.02em', color: T.g6,
          textWrap: 'balance', maxWidth: 920, marginInline: 'auto',
        }}>
          the manuscript is the artifact, the url is the&nbsp;distribution,<br/>
          the silence is the <span style={{ color: T.ink }}>feature</span>.
        </blockquote>
      </section>

      {/* features — split into 4 numbered rows, each a mini-split */}
      <section style={{ borderBottom: `1px solid ${T.g2}` }}>
        {[
          ['01', 'split pane',   'Write left. Read right. Or hide either pane and use one column.'],
          ['02', 'realtime',     'Tabs and devices on the same URL stay in lockstep, character by character.'],
          ['03', 'no account',   'Access is gated by the URL. 7 random characters. Forget it, lose it.'],
          ['04', 'offline-ready','localStorage fallback when the network drops. Works on a plane.'],
        ].map(([n, t, d], i, arr) => (
          <div key={n} style={{
            display: 'grid', gridTemplateColumns: '64px 1fr 2fr',
            padding: '28px 32px', alignItems: 'baseline', gap: 32,
            borderBottom: i < arr.length - 1 ? `1px solid ${T.g2}` : 'none',
          }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.g3 }}>{n}</span>
            <span style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 28, letterSpacing: '-0.03em' }}>{t}</span>
            <span style={{ fontFamily: T.ui, fontSize: 16, color: T.g4, lineHeight: 1.5, textWrap: 'pretty' }}>{d}</span>
          </div>
        ))}
      </section>

      {/* stack — quiet table */}
      <section style={{ padding: '56px 32px', borderBottom: `1px solid ${T.g2}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 36 }}>
          <h2 style={{ margin: 0, fontFamily: T.display, fontStyle: 'italic', fontWeight: 300, fontSize: 56, letterSpacing: '-0.03em', lineHeight: 0.95, color: T.g6 }}>
            the <span style={{ color: T.ink }}>quiet</span> stack.
          </h2>
          <div>
            {[
              ['ui',         'React 19 · TanStack Router'],
              ['editor',     'CodeMirror 6'],
              ['markdown',   'markdown-it 14 · DOMPurify 3'],
              ['realtime',   'Supabase · BroadcastChannel fallback'],
              ['styles',     'Plain CSS · Inter Tight · Editorial New'],
              ['bundler',    'Vite 7 · Biome 2'],
            ].map(([k, v], i) => (
              <div key={k} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 40px',
                padding: '14px 0', borderTop: `1px solid ${T.g2}`,
                borderBottom: i === 5 ? `1px solid ${T.g2}` : 'none',
                fontFamily: T.ui, fontSize: 15, alignItems: 'baseline',
              }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.g4 }}>{k}</span>
                <span>{v}</span>
                <span style={{ textAlign: 'right', fontFamily: T.mono, fontSize: 10, color: T.g3 }}>{String(i + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — one final split, in graphite */}
      <section style={{ background: T.g6, color: T.g0, borderBottom: `1px solid ${T.g5}` }}>
        <Split
          bg={T.g6} fg={T.g0} ruleColor={T.g5} padded="64px 56px"
          left={
            <>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g3 }}>hi —</div>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.04em' }}>ready when you are.</div>
              </div>
            </>
          }
          right={
            <>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.g3, textAlign: 'right' }}>— wrld</div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <a style={{
                  padding: '18px 28px', background: T.inkSoft, color: T.g6,
                  textDecoration: 'none', cursor: 'pointer',
                  fontFamily: T.ui, fontSize: 16, fontWeight: 500,
                }}>open hiwrld.com →</a>
              </div>
            </>
          }
        />
      </section>

      {/* footer */}
      <footer style={{
        padding: '14px 32px', fontFamily: T.mono, fontSize: 11, color: T.g4,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>© 2026 · MIT</span>
        <span>est. 2012 / reprinted 2026</span>
      </footer>
    </div>
  );
}

// ── ROOT ────────────────────────────────────────────────────
function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="intro"
        title="hiwrld · v3 — the split"
        subtitle="The product is the brand. Every asset composed across one vertical hairline: hi / wrld, write / read, input / output. No metaphors, no glyphs, no costumes. Inter Tight + Editorial New italic + JetBrains Mono. Single graphite-blue accent. Quiet."
      />

      <DCSection id="cover" title="01 · cover" subtitle="The system in one frame.">
        <DCArtboard id="cover" label="cover" width={1200} height={500}><Cover/></DCArtboard>
      </DCSection>

      <DCSection id="wm" title="02 · wordmark" subtitle="Four cuts plus construction and scale.">
        <DCArtboard id="w1" label="primary" width={520} height={280}><WMPrimary/></DCArtboard>
        <DCArtboard id="w2" label="monochrome" width={520} height={280}><WMMonochrome/></DCArtboard>
        <DCArtboard id="w3" label="reversed" width={520} height={280}><WMReversed/></DCArtboard>
        <DCArtboard id="w4" label="editorial cut" width={520} height={280}><WMEditorial/></DCArtboard>
        <DCArtboard id="w5" label="construction" width={620} height={320}><WMConstruction/></DCArtboard>
        <DCArtboard id="w6" label="scale" width={460} height={320}><WMScale/></DCArtboard>
      </DCSection>

      <DCSection id="wm-study" title="02b · anatomy & context" subtitle="The mark broken into its four parts, and how it sits in nav and signature.">
        <DCArtboard id="ws1" label="anatomy" width={780} height={420}><WMAnatomy/></DCArtboard>
        <DCArtboard id="ws2" label="in context" width={780} height={420}><WMInContext/></DCArtboard>
      </DCSection>

      <DCSection id="tokens" title="03 · tokens" subtitle="7 grays, one quiet accent, three families.">
        <DCArtboard id="t1" label="gray scale" width={1080} height={220}><GrayScale/></DCArtboard>
        <DCArtboard id="t2" label="accent" width={520} height={220}><AccentTokens/></DCArtboard>
        <DCArtboard id="t3" label="type" width={1080} height={300}><TypeSpec/></DCArtboard>
      </DCSection>

      <DCSection id="comp" title="04 · components" subtitle="Buttons, modes, status, link styles. No flourish.">
        <DCArtboard id="c1" label="components" width={760} height={360}><Components/></DCArtboard>
      </DCSection>

      <DCSection id="apps" title="05 · brand applications" subtitle="Favicon, OG card, full editor.">
        <DCArtboard id="a1" label="favicons" width={780} height={280}><Favicons/></DCArtboard>
        <DCArtboard id="a2" label="og · 1200×630" width={620} height={326}><OG/></DCArtboard>
        <DCArtboard id="a3" label="editor" width={1320} height={520}><ProductEditor/></DCArtboard>
      </DCSection>

      <DCSection id="lp" title="06 · landing page" subtitle="hiwrld.com — the brand lived in one document.">
        <DCArtboard id="lpx" label="hiwrld.com" width={1280} height={1880}><Landing/></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
