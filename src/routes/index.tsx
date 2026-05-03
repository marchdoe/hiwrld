import { createFileRoute } from '@tanstack/react-router';
import type React from 'react';
import { ctaSection, featureRow, nav, pullQuote, stackSection } from '../../styled-system/recipes';
import { Button } from '../components/Button';
import { Split } from '../components/Split';
import { Wordmark } from '../components/Wordmark';
import { generateDocumentId } from '../lib/generateId';

const FEATURES = [
  ['01', 'split pane', 'Write left. Read right. Or hide either pane and use one column.'],
  ['02', 'realtime', 'Tabs and devices on the same URL stay in lockstep, character by character.'],
  ['03', 'no account', 'Access is gated by the URL. 7 random characters. Forget it, lose it.'],
  ['04', 'offline-ready', 'localStorage fallback when the network drops. Works on a plane.'],
] as const;

const STACK = [
  ['ui', 'React 19 · TanStack Router'],
  ['editor', 'CodeMirror 6'],
  ['markdown', 'markdown-it 14 · DOMPurify 3'],
  ['realtime', 'Supabase · BroadcastChannel fallback'],
  ['styles', 'PandaCSS · Geist · Geist Mono'],
  ['bundler', 'Vite 7 · Biome 2'],
] as const;

interface HeroColumnProps {
  word: string;
  wordColor: string;
  body: React.ReactNode;
  button: React.ReactNode;
}

function HeroColumn({ word, wordColor, body, button }: HeroColumnProps) {
  return (
    <div style={{ marginTop: '36px' }}>
      <div
        className="hero-numeral"
        style={{
          fontFamily: 'var(--fonts-ui)',
          fontWeight: 500,
          lineHeight: 0.86,
          letterSpacing: '-0.05em',
          color: wordColor,
        }}
      >
        {word}
      </div>
      <p
        style={
          {
            marginTop: '24px',
            fontSize: '18px',
            lineHeight: 1.5,
            color: 'var(--colors-g5)',
            maxWidth: '380px',
            textWrap: 'pretty',
          } as React.CSSProperties
        }
      >
        {body}
      </p>
      <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>{button}</div>
    </div>
  );
}

function LandingPage() {
  const n = nav();
  const pq = pullQuote();
  const f = featureRow();
  const ss = stackSection();
  const cta = ctaSection();

  function openNewDoc() {
    window.location.href = `/${generateDocumentId()}`;
  }

  return (
    <div
      className="landing-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--colors-g0)',
        color: 'var(--colors-g6)',
        fontFamily: 'var(--fonts-ui)',
      }}
    >
      {/* NAV */}
      <header className={n.root}>
        <Wordmark size={24} />
        <nav className={`${n.links} nav__links-wrap`}>
          <a className={n.link} href="#features">
            features
          </a>
          <a className={n.link} href="#stack">
            stack
          </a>
          <a className={n.link} href="https://github.com" target="_blank" rel="noreferrer">
            github
          </a>
          <button type="button" className={n.cta} onClick={openNewDoc}>
            open editor →
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section style={{ borderBottom: '1px solid var(--colors-g2)' }}>
        <Split
          responsive
          padded="80px 56px 64px"
          left={
            <>
              <div
                style={{
                  fontFamily: 'var(--fonts-mono)',
                  fontSize: '11px',
                  color: 'var(--colors-g4)',
                  letterSpacing: '0.02em',
                }}
              >
                hi —
              </div>
              <HeroColumn
                word="write."
                wordColor="var(--colors-g6)"
                body={
                  <>
                    Open a tab, type plain markdown. The browser is the only software you need.{' '}
                    <span style={{ color: 'var(--colors-g4)' }}>
                      No accounts, no toolbar, no nonsense.
                    </span>
                  </>
                }
                button={
                  <Button variant="solid" visual="ink" onClick={openNewDoc}>
                    open a new document →
                  </Button>
                }
              />
            </>
          }
          right={
            <>
              <div
                style={{
                  fontFamily: 'var(--fonts-mono)',
                  fontSize: '11px',
                  color: 'var(--colors-g4)',
                  letterSpacing: '0.02em',
                  textAlign: 'right',
                }}
              >
                — wrld
              </div>
              <HeroColumn
                word="read."
                wordColor="var(--colors-ink)"
                body={
                  <>
                    Anyone with the URL reads along, live. Every keystroke syncs across tabs and
                    devices.{' '}
                    <span style={{ color: 'var(--colors-g4)' }}>The link is the document.</span>
                  </>
                }
                button={
                  <Button variant="line" onClick={openNewDoc}>
                    open a document →
                  </Button>
                }
              />
            </>
          }
        />
      </section>

      {/* PULL QUOTE */}
      <section className={pq.root}>
        <blockquote className={pq.text}>
          the manuscript is the artifact, the url is the distribution,
          <br />
          the silence is the <span className={pq.accent}>feature</span>.
        </blockquote>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ borderBottom: '1px solid var(--colors-g2)' }}>
        {FEATURES.map(([num, title, desc]) => (
          <div key={num} className={f.root}>
            <span className={f.num}>{num}</span>
            <span className={f.title}>{title}</span>
            <span className={f.desc}>{desc}</span>
          </div>
        ))}
      </section>

      {/* STACK */}
      <section id="stack" className={ss.root}>
        <div className={ss.inner}>
          <h2 className={ss.heading}>
            the <span className={ss.accent}>quiet</span> stack.
          </h2>
          <div className={ss.table}>
            {STACK.map(([key, val], i) => (
              <div key={key} className={ss.row}>
                <span className={ss.key}>{key}</span>
                <span className={ss.val}>{val}</span>
                <span className={ss.idx}>{String(i + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — margin-top: auto pins it to the bottom when content is shorter than viewport */}
      <section className={cta.root} style={{ marginTop: 'auto' }}>
        <Split
          responsive
          bg="var(--colors-g6)"
          fg="var(--colors-g0)"
          ruleColor="var(--colors-g5)"
          padded="64px 56px"
          left={
            <>
              <div className={cta.metaLeft}>hi —</div>
              <div className={cta.heading} style={{ marginTop: 'auto', paddingTop: '36px' }}>
                ready when you are.
              </div>
            </>
          }
          right={
            <>
              <div className={cta.metaRight}>— wrld</div>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '36px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Button variant="solid" visual="inverted" onClick={openNewDoc}>
                  open hiwrld.com →
                </Button>
              </div>
            </>
          }
        />
      </section>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: LandingPage,
});
