<p align="center">
  <img src="public/logo.svg" alt="Second Brain" width="80" height="80" />
</p>

<h1 align="center">Second Brain</h1>

<p align="center">
  <strong>Where Ideas Crystallize Into Knowledge</strong>
</p>

<p align="center">
  A premium personal knowledge base and blog — write in Obsidian, publish to the web. Interactive code playgrounds, knowledge graphs, math, diagrams, and a polished dark/gold design system. Built with Next.js, zero external services required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn/ui-New_York-18181B?style=flat-square" alt="shadcn/ui" />
</p>

---

## ✨ Live Demo

👉 **[https://second-brain.vercel.app](https://second-brain.vercel.app)**

---

## 📋 Table of Contents

- [Why Second Brain?](#-why-second-brain)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start — Run Locally](#-quick-start--run-locally)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Rename the Folder](#step-2-rename-the-folder)
  - [Step 3: Install Dependencies](#step-3-install-dependencies)
  - [Step 4: Create the .env File](#step-4-create-the-env-file)
  - [Step 5: Setup Database](#step-5-setup-database)
  - [Step 6: Run Locally](#step-6-run-locally)
  - [Step 7: Open in Browser](#step-7-open-in-browser)
- [Writing Posts](#-writing-posts)
- [Push to Your Own GitHub](#-push-to-your-own-github)
- [Deploy to Vercel (Live Site)](#-deploy-to-vercel-live-site)
- [Update Your Live Site](#-update-your-live-site)
- [Fork Option (No Terminal)](#-fork-option-no-terminal)
- [Project Structure](#-project-structure)
- [Obsidian Workflow](#-obsidian-workflow)
- [Troubleshooting](#-troubleshooting)

---

## 🧠 Why Second Brain?

In a world of information overload, the ability to capture, organize, and retrieve knowledge is a superpower. Second Brain is built on the principle that your notes should work for you — not the other way around.

Inspired by the **Zettelkasten method** and tools like **Obsidian**, this platform treats every note as a node in a growing network of understanding. Ideas connect, patterns emerge, and knowledge compounds over time.

**Zero external services required.** No Redis, no MySQL, no API keys. Just clone, install, and run.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 **Markdown Native** | Write in clean, portable Markdown — the language of developers |
| 🕸️ **Knowledge Graph** | Interactive Obsidian-style graph showing connections between posts |
| 🧩 **Code Playground** | Run code directly in the browser — Python, JS, C++, Java, Rust, Go & more |
| 🧮 **Math & Diagrams** | LaTeX math rendering and Mermaid diagrams out of the box |
| 🔍 **Instant Search** | Full-text search across your entire knowledge base |
| 📂 **Categories & Tags** | Organized into clear categories and tags |
| 🌙 **Dark/Light Mode** | Polished dark/gold design system with theme toggle |
| 📖 **Reading Stats** | Track your reading progress and bookmarks |
| 🎨 **Premium Design** | Distraction-free reading experience |
| 🔗 **Obsidian Compatible** | Write in Obsidian, publish to the web |
| 📱 **Responsive** | Works beautifully on mobile, tablet, and desktop |

---

## ⚡ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Prisma ORM + SQLite (zero config)
- **State:** Zustand + TanStack Query
- **Animations:** Framer Motion
- **Code Execution:** Pyodide (Python), Judge0 CE (compiled languages)

---

## 🚀 Quick Start — Run Locally

### Prerequisites

- **[Node.js](https://nodejs.org)** v18+ installed (check: `node --version`)
- **Git** installed

> **All commands below are shown for both Windows (PowerShell) and Mac/Linux.** Use the tab that matches your system.

---

### Step 1: Clone the Repository

**Windows (PowerShell):**
```powershell
git clone https://github.com/xnocode/second-brain.git
cd second-brain
```

**Mac/Linux:**
```bash
git clone https://github.com/xnocode/second-brain.git
cd second-brain
```

---

### Step 2: Rename the Folder

Rename `second-brain` to your own project name. This keeps things clean and avoids confusion if you have multiple projects.

**Windows (PowerShell):**
```powershell
# Go back one level, then rename
cd ..
Rename-Item -Path "second-brain" -NewName "my-brain"
cd my-brain
```

**Mac/Linux:**
```bash
cd ..
mv second-brain my-brain
cd my-brain
```

> **Tip:** You can name it anything — `bro-code`, `my-notes`, `knowledge-base`, etc.

---

### Step 3: Install Dependencies

This downloads all required packages. Takes about 30-60 seconds.

```bash
npm install
```

> Same command on all platforms. If you have `bun` installed, you can use `bun install` instead.

---

### Step 4: Create the .env File

The `.env` file stores your database path. **This step is different on Windows vs Mac/Linux.**

**Windows (PowerShell) — ⚠️ MUST use this exact command:**
```powershell
Set-Content -Path .env -Value "DATABASE_URL=file:./db/custom.db" -NoNewline
```

> **Why not `echo`?** PowerShell's `echo` adds invisible BOM characters that break Prisma. Always use `Set-Content -NoNewline`.

**Mac/Linux:**
```bash
echo "DATABASE_URL=file:./db/custom.db" > .env
```

**Verify the file was created:**
```bash
# Windows
Get-Content .env

# Mac/Linux
cat .env
```
You should see: `DATABASE_URL=file:./db/custom.db`

---

### Step 5: Setup Database

This creates the SQLite database file and all required tables.

```bash
npx prisma db push
```

You should see output like:
```
🚀 Your database is now in sync with your Prisma schema.
```

> This creates a `db/custom.db` file (automatically git-ignored).

---

### Step 6: Run Locally

Start the development server.

**Windows (PowerShell):**
```powershell
npx next dev -p 3000
```

**Mac/Linux:**
```bash
npx next dev -p 3000
```

> **Note:** On Windows, don't use `npm run dev` if the script pipes to `tee` (that command doesn't exist on Windows). Use `npx next dev -p 3000` directly.

You'll see output like:
```
  ▲ Next.js 16.x
  - Local:        http://localhost:3000
  - Environments: .env
```

---

### Step 7: Open in Browser

Go to **http://localhost:3000** — your Second Brain is running! 🎉

---

## 📝 Writing Posts

Place your markdown files in the **`content/posts/`** folder. Each post needs YAML frontmatter at the top:

```markdown
---
title: "Your Post Title"
date: 2025-01-15
category: "Guide"
tags: [obsidian, markdown, productivity]
excerpt: "A short description of your post"
---

# Your Post Content

Write in **Markdown** as usual. Supports:
- **Bold**, *italic*, `code`
- [Links](https://example.com)
- Lists, blockquotes, tables
- Code blocks with syntax highlighting
- LaTeX math: $$E = mc^2$$
- Mermaid diagrams
- Wiki-style [[links]] to other posts
```

### Available Categories
`Guide`, `Knowledge`, `Design`, `Thinking`, `Tools`, or any custom category you create.

---

## 📤 Push to Your Own GitHub

Want to customize and host your own version? Follow these steps:

### Step 1: Create a New Repository on GitHub

Go to **[github.com/new](https://github.com/new)** → Create a new **empty** repository (don't initialize with README, .gitignore, or license).

### Step 2: Remove Old Remote and Add Yours

**Windows (PowerShell):**
```powershell
git init
git add .
git commit -m "Initial commit - My Second Brain"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

**Mac/Linux:**
```bash
git init
git add .
git commit -m "Initial commit - My Second Brain"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

### Using GitHub CLI (One Command)

If you have [GitHub CLI (`gh`)](https://cli.github.com) installed, you can create the repo and push in one command:

```bash
gh repo create YOUR-REPO-NAME --public --source=. --push
```

### Step 3: Verify

Go to your GitHub repo page — you should see all your files. The `db/` folder, `.env` file, and `node_modules/` are automatically excluded by `.gitignore`.

---

## 🌐 Deploy to Vercel (Live Site)

### Method 1: One-Click Deploy (Easiest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xnocode/second-brain&env=DATABASE_URL,file:./db/custom.db)

### Method 2: Manual Deploy

1. Go to **[vercel.com](https://vercel.com)** → Sign in with **GitHub**
2. Click **"Add New Project"**
3. Import your repository
4. Add **Environment Variable**:
   - **Name:** `DATABASE_URL`
   - **Value:** `file:./db/custom.db`
5. Click **Deploy**

Your site will be live at `https://your-project.vercel.app` (or your custom domain).

> **Note:** Every time you push to GitHub, Vercel automatically redeploys your site!

---

## 🔄 Update Your Live Site

Once your site is connected to Vercel, updating is simple:

### Option A: Edit on GitHub (No Terminal Needed) ✨ Easiest

1. Go to your repo on **GitHub**
2. Click on any file to edit it directly in the browser
3. Edit `content/posts/` to add or modify articles
4. Click **"Commit changes"** → Vercel auto-deploys within 1-2 minutes

### Option B: Edit Locally and Push

1. Make changes on your computer
2. Add new posts to `content/posts/`
3. Push to GitHub:

```bash
git add .
git commit -m "Updated content"
git push
```

4. Vercel detects the push and redeploys automatically ✅

### Adding New Blog Posts

Just create a new `.md` file in `content/posts/`:

```
content/posts/
  my-new-post.md      ← Add this
  another-article.md  ← And this
```

Each file needs frontmatter (title, date, category, tags, excerpt). That's it!

---

## 🍴 Fork Option (No Terminal)

If you're not comfortable with the terminal at all:

1. Go to the repo on GitHub
2. Click the **"Fork"** button (top right)
3. This creates a copy under your GitHub account
4. Go to **Vercel** → Import your forked repo
5. Add `DATABASE_URL=file:./db/custom.db` as environment variable
6. Click **Deploy**

To edit content, use GitHub's built-in editor directly in your browser. Every commit auto-deploys via Vercel.

---

## 📁 Project Structure

```
second-brain/
├── content/posts/          # Your markdown blog posts
├── prisma/
│   └── schema.prisma       # Database schema
├── public/
│   ├── logo.png            # Site logo
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── page.tsx        # Main page (blog, about, post views)
│   │   ├── post/[slug]/    # Individual post pages
│   │   └── api/            # API routes (posts, search, graph, etc.)
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities and database client
├── .env.example            # Environment template
├── .gitignore
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## 🔮 Obsidian Workflow

1. **Write** your notes in Obsidian as usual
2. Add YAML frontmatter to notes you want to publish
3. Copy published notes to `content/posts/`
4. Preview locally with `npx next dev -p 3000`
5. Push to GitHub → Vercel deploys automatically

Your vault is the source of truth. The website is just a beautiful window into your published thoughts.

---

## 🔧 Troubleshooting

### `DATABASE_URL` not found by Prisma
- **Windows:** Make sure you used `Set-Content -NoNewline`. Regular `echo` adds invisible characters.
- **Mac/Linux:** Make sure the file was created with `echo "..." > .env`

### `prisma db push` fails
- Ensure your `.env` file is in the **root** of the project (same folder as `package.json`)
- Make sure `DATABASE_URL` has no extra spaces or quotes

### `npx next dev` fails
- Make sure you ran `npm install` first
- Ensure Node.js v18+ is installed: `node --version`
- On Windows, use `npx next dev -p 3000` directly (not `npm run dev` if it pipes to `tee`)

### Port 3000 already in use
- Another process is using port 3000. Kill it or use a different port:
```bash
npx next dev -p 3001
```

### Git push fails with "Repository not found"
- Make sure you **created the repo on GitHub first** before pushing
- The repo must be empty (no README, no .gitignore) on GitHub before the first push

---

## 📜 License

MIT — Use it, modify it, make it yours.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/xnocode">xnocode</a>
</p>
