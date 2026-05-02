import { describe, expect, it } from 'vitest';
import { samples } from '../../test/fixtures/markdown-samples';
import { applySmartQuotes, extractYoutubeId, renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('returns sanitized HTML for plain markdown', () => {
    const html = renderMarkdown('# Hello\n\nworld');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('<p>world</p>');
  });

  it('strips script tags via DOMPurify', () => {
    const html = renderMarkdown('hello <script>alert(1)</script> world');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });
});

describe('applySmartQuotes', () => {
  it('curls leading double quote after space', () => {
    expect(applySmartQuotes('a &quot;b&quot;')).toBe('a “hello”'.replace('hello', 'b'));
  });

  it('curls leading single quote after space', () => {
    expect(applySmartQuotes('a &#39;b&#39;')).toBe('a ‘b’');
  });

  it('uses right single quote for apostrophe (no preceding non-word char)', () => {
    expect(applySmartQuotes('it&#39;s')).toBe('it’s');
  });
});

describe('extractYoutubeId', () => {
  it('pulls v= param from a watch URL', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-youtube URLs', () => {
    expect(extractYoutubeId('https://example.com/foo')).toBeNull();
  });
});

describe('renderMarkdown — sanitization', () => {
  it('strips onerror attributes', () => {
    const html = renderMarkdown(samples.htmlInjection);
    expect(html).not.toMatch(/onerror/i);
  });

  it('strips iframe with javascript: src', () => {
    const html = renderMarkdown(samples.iframeInjection);
    expect(html).not.toMatch(/javascript:/i);
  });

  it('strips javascript: protocol from links', () => {
    const html = renderMarkdown(samples.linkJs);
    expect(html).not.toMatch(/javascript:/i);
  });
});

describe('renderMarkdown — fences and inline code', () => {
  it('emits <pre><code class="language-js"> for fenced code', () => {
    const html = renderMarkdown(samples.fencedCode);
    expect(html).toMatch(/<pre>.*<code[^>]*language-js/s);
    expect(html).toContain('const x = 1;');
  });

  it('emits inline <code> for backtick text', () => {
    const html = renderMarkdown(samples.inlineCode);
    expect(html).toContain('<code>var</code>');
  });
});

describe('renderMarkdown — typography', () => {
  it('preserves em-dash characters in text', () => {
    const html = renderMarkdown(samples.emDash);
    expect(html).toContain('a -- b --- c');
  });

  it('curls quotes in mixed input', () => {
    const html = renderMarkdown(samples.mixedQuotes);
    expect(html).toContain('“hello”');
    expect(html).toContain('‘goodbye’');
  });

  it('curls apostrophes mid-word as right single quotes', () => {
    const html = renderMarkdown(samples.apostrophes);
    expect(html).toContain('it’s');
    expect(html).toContain('friend’s');
  });
});

describe('extractYoutubeId — additional cases', () => {
  it('handles URLs with extra query params', () => {
    expect(extractYoutubeId('https://youtube.com/watch?v=abc123&t=42s')).toBe('abc123');
  });

  it('returns null for youtube URLs without v=', () => {
    expect(extractYoutubeId('https://youtube.com/watch')).toBeNull();
  });
});
