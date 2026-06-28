import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';

interface WikiLinksOptions {
  slugs: string[];
  slugToTitle: Record<string, string>;
}

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Rehype plugin — converts [[target]] text patterns in the HTML tree into
 * wiki-style <a> links.  Runs AFTER remark-rehype so we can insert proper
 * HAST element nodes (not raw-html snippets that later plugins may strip).
 */
export const rehypeWikiLinks: Plugin<[WikiLinksOptions]> = (options) => {
  const { slugs, slugToTitle } = options;
  const slugSet = new Set(slugs);

  return (tree) => {
    // Collect replacements to apply in reverse order
    const replacements: Array<{
      parent: any;
      index: number;
      newNodes: any[];
    }> = [];

    visit(tree, 'text', (node: any, index: number | null, parent: any) => {
      if (!parent || index === null) return;

      const text: string = node.value;
      const matches = [...text.matchAll(WIKI_LINK_PATTERN)];
      if (matches.length === 0) return;

      const newNodes: any[] = [];
      let lastIdx = 0;

      for (const match of matches) {
        const full = match[0];
        const target = match[1];
        const start = match.index!;

        if (start > lastIdx) {
          newNodes.push({ type: 'text', value: text.slice(lastIdx, start) });
        }

        if (slugSet.has(target)) {
          newNodes.push({
            type: 'element',
            tagName: 'a',
            properties: {
              href: '#',
              'data-wiki-link': target,
              className: ['wiki-link'],
            },
            children: [{ type: 'text', value: slugToTitle[target] || target }],
          });
        } else {
          const matchedSlug = slugs.find((s) => slugToTitle[s] === target);
          if (matchedSlug) {
            newNodes.push({
              type: 'element',
              tagName: 'a',
              properties: {
                href: '#',
                'data-wiki-link': matchedSlug,
                className: ['wiki-link'],
              },
              children: [{ type: 'text', value: target }],
            });
          } else {
            newNodes.push({
              type: 'element',
              tagName: 'span',
              properties: {
                className: ['wiki-link', 'wiki-link-broken'],
              },
              children: [{ type: 'text', value: target }],
            });
          }
        }

        lastIdx = start + full.length;
      }

      if (lastIdx < text.length) {
        newNodes.push({ type: 'text', value: text.slice(lastIdx) });
      }

      replacements.push({ parent, index, newNodes });
    });

    // Apply in reverse order to preserve indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { parent, index, newNodes } = replacements[i];
      parent.children.splice(index, 1, ...newNodes);
    }
  };
};