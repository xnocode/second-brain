---
title: "Audio and Video Embeds"
date: 2025-06-28
tags: ["features", "guide", "audio", "video"]
category: "Guide"
draft: false
excerpt: "Embed audio players and video iframes from YouTube, Vimeo, and self-hosted files."
cover: "/covers/audio-and-video.png"
---

Your blog supports embedded audio players and video iframes. Audio files render as native browser players with controls. Video links (YouTube, Vimeo) automatically convert into responsive embedded players.

## Audio Embeds

To embed audio, use a standard markdown image syntax pointing to an audio file:

```markdown
![My Podcast Episode](/images/episode-01.mp3)
```

The file can be any of these formats: `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.webm`.

### Where to Put Audio Files

Place audio files in your `blog/attachments/` folder (the same place you put images). When you run `bun run sync-vault.ts`, audio files are copied to `public/images/` and the markdown reference is updated automatically.

### Obsidian Wiki-Link Style

You can also use the Obsidian `![[...]]` syntax:

```markdown
![[episode-01.mp3]]
```

The sync script handles this the same way — it copies the file and converts the reference.

### What Readers See

When a reader visits the post, they see a styled audio player with:

- A header bar with a music note icon and the file name (from the alt text)
- Native browser audio controls (play, pause, seek, volume, download)
- The player matches the blog's dark theme automatically

The audio preload is set to `metadata` so the file doesn't download until the reader clicks play.

## Video Embeds

Video embedding works by pasting a YouTube or Vimeo URL on its own line. No special syntax needed.

### YouTube

Paste any YouTube URL format on its own line:

```markdown
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

These URL formats all work:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

### Vimeo

```markdown
https://vimeo.com/123456789
```

### Markdown Link Style

You can also wrap the URL in a markdown link:

```markdown
[Watch the demo](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
```

Both styles produce the same embedded player.

### Live Demo

Here's what a YouTube embed looks like when you paste a link on its own line:

https://www.youtube.com/watch?v=lLFoLJIXayk&list=RDlLFoLJIXayk&start_radio=1

It renders as a responsive video player with controls, matching the blog's dark theme. The "Open in New Tab" button in the header lets viewers watch on YouTube directly.

### What Readers See

A responsive 16:9 video player with:

- A header bar showing the platform name (YouTube or Vimeo) with a video icon
- An "Open in New Tab" button to view the video on the original platform
- The iframe loads lazily with autoplay disabled — readers click play to start
- Fullscreen support is enabled

The embed wrapper is responsive — it scales to fit the article width on any screen size.

## Privacy Note

YouTube and Vimeo embeds load their own tracking scripts when the reader plays the video. If you need full privacy, consider self-hosting video files and using the audio embed format (which also supports `.webm` video).

## How It Works Internally

The markdown-to-HTML pipeline runs on the server:

1. Audio: `![alt](file.mp3)` becomes an `<img>` tag during markdown parsing. A server-side transformer detects the audio extension in the `src` attribute and replaces the `<img>` with a styled `<audio>` element.

2. Video: A YouTube/Vimeo URL in markdown becomes an `<a>` tag (or stays in a `<p>` tag). A server-side transformer detects the URL pattern, extracts the video ID, and replaces the entire element with an `<iframe>` embed wrapped in a responsive container.

No client-side JavaScript is needed for either — the HTML arrives ready to render.

## Next Steps

- [[writing-posts]] — Wiki-links, task lists, PDF embeds, and more content features.
- [[adding-images]] — How to add and manage images in your posts.
- [[code-playground]] — Interactive code execution with stdin support.
- [[website-features]] — Full list of every feature your blog supports.