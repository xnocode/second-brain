/**
 * Post-processes HTML to convert Obsidian Ink code blocks into visual embeds.
 * Runs on the final HTML string after the unified pipeline.
 */

const INK_LANGUAGES = ['handwritten-ink', 'handdrawn-ink'];

function isSvgContent(content: string): boolean {
  return content.trimStart().startsWith('<svg');
}

function getInkMeta(lang: string) {
  const isHandwriting = lang === 'handwritten-ink';
  return {
    cssClass: isHandwriting ? 'ink-handwriting' : 'ink-drawing',
    icon: isHandwriting ? '✍️' : '🎨',
    label: isHandwriting ? 'Handwritten Note' : 'Hand Drawn Sketch',
  };
}

function htmlDecode(str: string): string {
  // Decode HTML entities (named, numeric decimal, numeric hex)
  return str
    // Hex entities: &#x3C; → <
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decimal entities: &#60; → <
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)))
    // Named entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmbedHtml(cssClass: string, icon: string, label: string, content: string): string {
  const trimmed = content.trim();

  if (isSvgContent(trimmed)) {
    return [
      `<div class="ink-embed ${cssClass}">`,
      `  <div class="ink-embed-inner">`,
      `    ${trimmed}`,
      `  </div>`,
      `  <div class="ink-embed-label">${escapeHtml(label)}</div>`,
      `</div>`,
    ].join('\n');
  }

  if (trimmed.length > 0) {
    return [
      `<div class="ink-embed ${cssClass}">`,
      `  <div class="ink-embed-placeholder">`,
      `    <div class="ink-embed-icon">${icon}</div>`,
      `    <div class="ink-embed-text">${escapeHtml(label)}</div>`,
      `    <div class="ink-embed-file">${escapeHtml(trimmed)}</div>`,
      `  </div>`,
      `</div>`,
    ].join('\n');
  }

  return [
    `<div class="ink-embed ${cssClass}">`,
    `  <div class="ink-embed-placeholder">`,
    `    <div class="ink-embed-icon">${icon}</div>`,
    `    <div class="ink-embed-text">${escapeHtml(label)}</div>`,
    `  </div>`,
    `</div>`,
  ].join('\n');
}

/** Strip HTML tags to get plain text content from code element */
function extractCodeContent(html: string): string {
  // First decode HTML entities to get the actual content
  let decoded = htmlDecode(html);
  // Then strip remaining tags
  decoded = decoded
    .replace(/<span data-line=""><span>([\s\S]*?)<\/span><\/span>/g, '$1')
    .replace(/<span data-line="">([\s\S]*?)<\/span>/g, '$1')
    .replace(/<span[^>]*>/g, '')
    .replace(/<\/span>/g, '')
    .replace(/<code[^>]*>/g, '')
    .replace(/<\/code>/g, '')
    .replace(/<pre[^>]*>/g, '')
    .replace(/<\/pre>/g, '')
    .replace(/<figure[^>]*>/g, '')
    .replace(/<\/figure>/g, '')
    .trim();
  return decoded;
}

export function transformInkEmbeds(html: string): string {
  const langPattern = INK_LANGUAGES.join('|');

  // Match rehype-pretty-code output: <figure ...><pre ... data-language="handwritten-ink" ...><code ...>...</code></pre></figure>
  const figureRegex = new RegExp(
    `<figure[^>]*>\\s*<pre[^>]*data-language="(${langPattern})"[^>]*>([\\s\\S]*?)<\\/pre>\\s*<\\/figure>`,
    'gi'
  );

  let result = html.replace(figureRegex, (_match, lang: string, innerHtml: string) => {
    const content = extractCodeContent(innerHtml);
    const { cssClass, icon, label } = getInkMeta(lang);
    return buildEmbedHtml(cssClass, icon, label, content);
  });

  // Fallback: simple <pre ... data-language="..."><code ...>...</code></pre>
  const preRegex = new RegExp(
    `<pre[^>]*data-language="(${langPattern})"[^>]*>([\\s\\S]*?)<\\/pre>`,
    'gi'
  );

  result = result.replace(preRegex, (_match, lang: string, innerHtml: string) => {
    const content = extractCodeContent(innerHtml);
    const { cssClass, icon, label } = getInkMeta(lang);
    return buildEmbedHtml(cssClass, icon, label, content);
  });

  return result;
}