---
title: "Knowledge Graph"
date: 2025-06-28
tags: ["graph", "features", "obsidian"]
category: "Knowledge"
draft: false
excerpt: "How the force-directed knowledge graph connects your posts visually."
cover: "/covers/knowledge-graph.png"
---

The knowledge graph is a force-directed visualization of all your posts and their connections. It works exactly like Obsidian's graph view — every wiki-link between posts becomes a visible edge.

## How Connections Work

When you write `[[another-post]]` in a post, the sync script creates a link. In the graph:

- Each **node** is a post, colored by its `category` field
- Each **edge** is a wiki-link between two posts
- The graph uses pure repulsion (no gravity), so nodes spread out naturally like Obsidian

If Post A links to Post B, a directed arrow is drawn from A to B. The more connections a post has, the more central it appears.

## What the Graph Looks Like

Below is a preview of how the knowledge graph renders on your blog. Each colored dot is a post, and the lines between them are wiki-links. Hovering a node highlights its connections. Clicking navigates to that post.

The graph uses a dark background with a subtle grid pattern, matching the Obsidian aesthetic. Nodes are color-coded by category:

| Category | Color |
|----------|-------|
| Guide | Gold (#E2B340) |
| Thinking | Emerald (#34D399) |
| Tools | Orange (#FB923C) |
| Knowledge | Blue (#60A5FA) |
| Design | Purple (#A78BFA) |

The color system is consistent everywhere — graph nodes, category filter buttons, and post card badges all use the same colors.

## Two Graph Views

### Full Graph Modal

Click the graph icon in the header to open a full-screen modal showing all posts and connections. The graph is interactive:

- **Drag** any node to reposition it
- **Hover** a node to highlight it and dim others
- **Click** a node to navigate to that post
- A subtle background grid gives it the Obsidian feel

The full graph modal has a frosted glass background and animates in smoothly. It works on both desktop and mobile (touch drag supported).

### Per-Article Sidebar Graph

When reading a post, the right column shows a focused graph with only that post's direct connections. The current post is highlighted with a glowing ring. This gives you context without visual noise. The sidebar graph uses the same interaction model — hover and click work the same way.

The sidebar graph is visible on desktop (`lg` breakpoint and above). On mobile, the full graph modal is still accessible via the header icon.

## How to Build Connections

Write posts that reference each other using wiki-links:

```markdown
This is related to [[code-playground]] and [[writing-posts]].
```

When you sync, these become clickable links. They also create edges in the graph. The more you cross-reference your posts, the richer the graph becomes.

A well-connected knowledge base helps readers discover related posts they might not find through search alone. The graph gives them a visual map of how your ideas connect.

## Technical Details

- The graph is rendered on an HTML5 Canvas using a custom force-directed layout
- Physics simulation runs at 60fps with configurable repulsion, spring stiffness, and damping
- Nodes start at random positions and settle into a stable layout within seconds
- The simulation pauses automatically when nodes stop moving (energy conservation check)
- On hover, non-connected nodes fade to 15% opacity while connected nodes stay bright
- The layout is deterministic per session — same posts produce the same graph structure

## Broken Links

Linking to a post that doesn't exist yet is fine. The wiki-link renders as text (like Obsidian's unresolved links) but does not create a graph node. Once you write the post and re-sync, the connection appears automatically.

## Next Steps

- [[writing-posts]] — How to write wiki-links that create graph connections.
- [[website-features]] — Search, bookmarks, TOC, and every other feature.
- [[setup-guide]] — Initial project setup.