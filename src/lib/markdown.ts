import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import markdownItGithubAlerts from 'markdown-it-github-alerts';

const md = new MarkdownIt({
  html: true, // allow raw HTML through; DOMPurify sanitizes after
  linkify: true, // bare URL auto-links (equivalent to GFM linkify)
  typographer: false, // we handle smart quotes ourselves in applySmartQuotes
}).use(markdownItGithubAlerts);

// Allow all link URLs through — DOMPurify strips dangerous protocols (javascript:,
// data:, etc.) after rendering. Blocking at the parser level causes markdown-it to
// emit raw markdown text that still contains the literal "javascript:" string,
// which then bypasses DOMPurify (it only processes HTML elements, not text nodes).
md.validateLink = () => true;

// Smart-quote filter must run on markdown-it's output BEFORE DOMPurify, because
// it matches HTML entities (&#39; / &quot;) which DOMPurify decodes to raw
// chars during sanitization. Operating on entity-form is also safer — we
// never touch raw " in attribute values.
export function applySmartQuotes(html: string): string {
  const leftSingleQuote = /([^\w])(?:&#39;|')/g;
  const leftDoubleQuote = /([^\w])&quot;/g;
  const singleQuote = /(?:&#39;|')/g;
  const doubleQuote = /&quot;/g;
  return html
    .replace(leftSingleQuote, '$1‘')
    .replace(leftDoubleQuote, '$1“')
    .replace(singleQuote, '’')
    .replace(doubleQuote, '”');
}

export function renderMarkdown(body: string): string {
  const raw = md.render(body);
  const quoted = applySmartQuotes(raw);
  return DOMPurify.sanitize(quoted);
}

const YT_HOST_RE = /youtube\.com\/watch/;
const YT_ID_RE = /\?v=([\w-]+)/;
export function extractYoutubeId(href: string): string | null {
  if (!YT_HOST_RE.test(href)) return null;
  const m = href.match(YT_ID_RE);
  return m ? m[1] : null;
}

export function youtubeEmbed(id: string): string {
  return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
}
