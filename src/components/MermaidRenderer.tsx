"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function MermaidRenderer() {
  const [isDark, setIsDark] = useState(false);
  const renderedRef = useRef(new Set<string>());

  const renderDiagrams = useCallback(async () => {
    const container = document.getElementById("post-content");
    if (!container) return;

    const mermaidBlocks = container.querySelectorAll(
      'pre[data-language="mermaid"], pre code.language-mermaid'
    );

    if (mermaidBlocks.length === 0) return;

    // Dynamic import to avoid SSR issues
    const mermaid = (await import("mermaid")).default;

    const darkMode = document.documentElement.classList.contains("light") ? "default" : "dark";

    for (const block of mermaidBlocks) {
      const pre = block.closest("pre") || block;
      if (renderedRef.current.has(pre.id || "")) continue;

      const code = block.tagName === "CODE" ? block.textContent || "" : pre.querySelector("code")?.textContent || "";
      if (!code.trim()) continue;

      const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      renderedRef.current.add(id);

      try {
        const { svg } = await mermaid.render(id, code.trim());

        // Replace the pre block with the rendered SVG
        const wrapper = document.createElement("div");
        wrapper.className = "mermaid-diagram";
        wrapper.setAttribute("data-mermaid-id", id);
        wrapper.innerHTML = svg;

        // Style the SVG to match theme
        const svgEl = wrapper.querySelector("svg");
        if (svgEl) {
          svgEl.style.maxWidth = "100%";
          svgEl.style.height = "auto";
          svgEl.style.margin = "1rem 0";
        }

        pre.replaceWith(wrapper);
      } catch (err) {
        // If rendering fails, show the raw code with error
        const errorDiv = document.createElement("div");
        errorDiv.className = "mermaid-error";
        errorDiv.innerHTML = `<div class="text-red-400 text-xs mb-2">⚠ Diagram render error</div><pre class="text-xs text-[var(--text-muted)] overflow-x-auto">${(err as Error).message}</pre>`;
        pre.replaceWith(errorDiv);
      }
    }
  }, []);

  useEffect(() => {
    // Initial render after content loads
    const timer = setTimeout(renderDiagrams, 300);

    // Watch for DOM changes
    const container = document.getElementById("post-content");
    if (!container) return;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      setTimeout(renderDiagrams, 200);
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [renderDiagrams]);

  // Re-render on theme change
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains("light");
      if (nowDark !== isDark) {
        setIsDark(nowDark);
        renderedRef.current.clear();
        setTimeout(renderDiagrams, 400);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [isDark, renderDiagrams]);

  return null;
}