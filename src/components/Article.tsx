import hljs from 'highlight.js/lib/core';
import { memo, useEffect, useRef } from 'react';
import { editorLayout } from '../../styled-system/recipes';
import { extractYoutubeId, renderMarkdown, youtubeEmbed } from '../lib/markdown';

interface ArticleProps {
  body: string;
}

export const Article = memo(function Article({ body }: ArticleProps) {
  const el = editorLayout();
  const ref = useRef<HTMLElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: body is a prop dependency; re-run effect when content changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
      try {
        hljs.highlightElement(block);
      } catch {
        /* skip unknown languages */
      }
    });
    const timer = setTimeout(() => {
      el.querySelectorAll<HTMLAnchorElement>('a[href*="youtube.com/watch?v="]').forEach((a) => {
        const id = extractYoutubeId(a.href);
        if (!id) return;
        const iframe = document.createElement('div');
        iframe.innerHTML = youtubeEmbed(id);
        // biome-ignore lint/style/noNonNullAssertion: youtubeEmbed always returns a valid iframe element
        a.replaceWith(iframe.firstElementChild!);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [body]);

  return (
    <article
      ref={ref}
      className={el.documentArticle}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: renderMarkdown runs DOMPurify internally
      dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
    />
  );
});
