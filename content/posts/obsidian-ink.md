---
title: "Obsidian Ink: Digital Handwriting"
date: 2025-06-28
tags: ["obsidian", "ink", "handwriting", "features"]
category: "Features"
draft: false
excerpt: "Add digital handwriting and hand-drawn sketches to your blog posts with Obsidian Ink."
cover: "/covers/obsidian-ink.png"
---

# Obsidian Ink: Digital Handwriting

Obsidian Ink is a community plugin that lets you write and draw directly inside Obsidian notes. Second Brain natively renders Ink content as inline SVG elements. Available at [https://github.com/daledesilva/obsidian_ink](https://github.com/daledesilva/obsidian_ink).

## What It Does

Instead of typing everything, you can handwrite notes, sketch diagrams, and draw annotations directly in Obsidian. The Ink plugin renders these as SVG data embedded in your markdown. The blog extracts the SVG and renders it inline in the article.

The SVG uses `currentColor` for strokes, so handwriting automatically adapts to light and dark themes. Here's what a handwritten note looks like rendered on the blog:

```handwritten-ink
<svg data-ink xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 120">
  <path d="M15,75 C20,30 35,30 40,75 C42,90 38,95 35,95 C32,95 30,90 32,80 C35,55 50,30 60,75 C62,85 58,90 55,90 C52,90 50,85 52,78" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M70,75 C75,35 88,35 90,75 C91,88 85,92 82,92 C79,92 78,87 80,78 C83,55 95,30 105,75 C107,88 101,92 98,92 C95,92 94,87 96,78" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M115,75 C120,40 135,35 140,55 C143,65 135,80 130,80 C126,80 125,72 130,60 C135,48 145,40 150,75" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M160,75 L160,40 C160,35 165,35 165,40 L165,75" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M155,72 L170,72" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
  <path d="M185,55 C188,35 198,35 200,55 C201,65 197,70 194,70 C191,70 190,65 192,58 C195,45 205,38 210,55 L210,80" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M230,40 L230,80 C230,85 240,85 240,80 L240,40" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M255,55 C258,38 268,35 270,50 C271,58 266,62 263,62 C260,62 259,57 261,52 C264,42 274,36 278,52 L278,80" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M295,40 C300,35 310,35 310,45 C310,55 295,60 295,70 C295,80 305,82 310,75" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M325,75 C330,40 345,35 348,55 C349,62 344,65 341,65 C338,65 337,60 340,53 C343,42 353,38 358,55 L358,80" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M370,75 C375,40 388,35 390,55 C391,62 386,65 383,65 C380,65 379,60 382,53 C385,42 395,38 400,55 L400,80" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M415,75 L430,55 L415,55 L430,75" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M440,75 L440,45 C440,40 448,40 448,45 L448,75" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M435,72 L452,72" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
</svg>
```

And here's a hand-drawn sketch — a simple system architecture diagram:

```handdrawn-ink
<svg data-ink xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 200">
  <rect x="10" y="70" width="110" height="55" rx="6" stroke="currentColor" fill="none" stroke-width="2" stroke-dasharray="none"/>
  <text x="65" y="102" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="13" font-weight="600">Obsidian</text>
  <rect x="195" y="25" width="120" height="55" rx="6" stroke="currentColor" fill="none" stroke-width="2"/>
  <text x="255" y="57" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="13" font-weight="600">Sync Script</text>
  <rect x="195" y="140" width="120" height="50" rx="6" stroke="currentColor" fill="none" stroke-width="2"/>
  <text x="255" y="170" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="13" font-weight="600">Attachments</text>
  <rect x="390" y="70" width="120" height="55" rx="6" stroke="currentColor" fill="none" stroke-width="2"/>
  <text x="450" y="102" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="13" font-weight="600">Blog Site</text>
  <line x1="120" y1="85" x2="195" y2="55" stroke="currentColor" stroke-width="1.8" marker-end="url(#arrow1)"/>
  <line x1="120" y1="100" x2="195" y2="165" stroke="currentColor" stroke-width="1.8" marker-end="url(#arrow1)"/>
  <line x1="315" y1="55" x2="390" y2="85" stroke="currentColor" stroke-width="1.8" marker-end="url(#arrow1)"/>
  <line x1="315" y1="165" x2="390" y2="110" stroke="currentColor" stroke-width="1.8" marker-end="url(#arrow1)"/>
  <defs>
    <marker id="arrow1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
    </marker>
  </defs>
</svg>
```

And a handwritten math equation alongside typed text:

```handwritten-ink
<svg data-ink xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80">
  <path d="M10,50 C12,20 22,18 25,30 C27,38 22,42 20,42 C18,42 17,38 19,33 C22,25 30,20 34,35 L34,50" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M45,35 L55,20 L55,50" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="65" y="42" fill="currentColor" font-family="serif" font-size="22" font-style="italic">x</text>
  <path d="M85,50 L85,25" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
  <text x="95" y="42" fill="currentColor" font-family="serif" font-size="22" font-style="italic">d</text>
  <text x="108" y="42" fill="currentColor" font-family="serif" font-size="22" font-style="italic">x</text>
  <path d="M135,30 C140,15 150,15 155,30 C157,38 152,42 150,42 C148,42 147,38 149,33 C152,22 162,18 167,33 L167,50" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round"/>
  <text x="180" y="42" fill="currentColor" font-family="serif" font-size="22">=</text>
  <text x="200" y="42" fill="currentColor" font-family="serif" font-size="22" font-style="italic">e</text>
  <path d="M218,20 C222,15 228,15 228,22 C228,28 218,32 218,38 C218,44 224,46 228,42" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M240,50 L240,22 C240,18 246,18 246,22 L246,50" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M237,48 L249,48" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M270,25 C275,18 285,15 285,30 C285,40 268,45 268,55 C268,65 280,67 285,58" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M300,20 C305,15 312,15 312,22 C312,29 300,33 300,40 C300,47 308,49 312,42" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M330,50 L345,25 L330,25 L345,50" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="355" y="42" fill="currentColor" font-family="serif" font-size="22">+</text>
  <text x="375" y="42" fill="currentColor" font-family="serif" font-size="22" font-style="italic">C</text>
</svg>
```

## Installation

1. Open **Settings > Community plugins** in Obsidian.
2. Enable community plugins if not already on.
3. Click **Browse**, search for **"Ink"**.
4. Install and enable the plugin.
5. Create the Ink directory:

```bash
mkdir -p blog/Ink
```

## How to Use

1. Open a note in Obsidian.
2. Open the command palette (`Cmd+P` / `Ctrl+P`).
3. Search for "Ink" and select **New handwriting section**.
4. A canvas appears. Write or draw using your mouse, trackpad, or stylus.
5. **Freeze** the drawing when finished. This converts the live canvas into static SVG data embedded in the markdown.

The freeze step is required. Until you freeze, the Ink content is a live editable canvas stored in Obsidian's internal state, not in the markdown file. Only frozen Ink blocks survive the sync to the blog.

## How the Renderer Works

The blog recognizes two code block types:

- **`handwritten-ink`** — for handwritten text (notes, equations). Renders with a "Handwritten Note" label.
- **`handdrawn-ink`** — for freehand sketches and diagrams. Renders with a "Hand Drawn Sketch" label.

Instead of wrapping the content in a `<pre><code>` block, the renderer extracts the SVG and renders it inline in a styled container. The three examples above demonstrate all three types: handwriting, a diagram, and a math equation.

## Use Cases

- **Handwritten notes** — annotations with a personal notebook feel
- **Sketch diagrams** — quick box-and-arrow diagrams faster than Mermaid for simple concepts
- **Math by hand** — handwritten equations alongside typed LaTeX
- **Sketchnotes** — combine handwriting, small diagrams, and arrows into visual summaries
- **Signatures** — a handwritten touch on about pages or author sections

## Tips

- Use a stylus for best results — pressure sensitivity produces noticeably better strokes
- Match the Ink canvas width to your blog's content column
- Use multiple focused Ink blocks rather than one dense block
- Test in both light and dark themes — complex drawings with many overlapping strokes may be harder to read in dark mode
- Keep drawings simple and focused — the hand-drawn style works best for clear, minimal sketches

## Limitations

- No animation — Ink content renders as static SVG
- No interactivity — readers cannot edit drawings on the published blog
- Pen pressure data may not survive SVG rendering — strokes render at uniform width
- Highly complex drawings with hundreds of strokes produce large SVG markup

## Next Steps

- [[obsidian-workflow]] — Full Obsidian setup with attachment configuration and writing workflow.
- [[writing-posts]] — All other content features: wiki-links, code blocks, math, diagrams.