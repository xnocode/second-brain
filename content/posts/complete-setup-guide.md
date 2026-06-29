---
title: "Complete Setup Guide: From Clone to Live in 5 Minutes"
date: 2024-01-20
category: "Guide"
tags: [setup, tutorial, windows, deployment, vercel, github]
excerpt: "Step-by-step guide to set up your own Second Brain — clone, install, run locally, push to GitHub, and deploy to Vercel. Includes Windows PowerShell and Mac/Linux commands for every step."
cover: "/covers/setup-guide-complete.png"
draft: false
---

# Complete Setup Guide: From Clone to Live in 5 Minutes

This guide walks you through the **entire journey** of setting up your own Second Brain — from downloading the code to having a live website on the internet. Every step includes commands for both **Windows (PowerShell)** and **Mac/Linux**.

---

## Prerequisites

Before you start, make sure you have:

- **[Node.js](https://nodejs.org)** v18 or higher installed
  - Check with: `node --version`
  - If not installed, download from [nodejs.org](https://nodejs.org) and run the installer
- **[Git](https://git-scm.com)** installed
  - Check with: `git --version`
  - Windows: Download from [git-scm.com](https://git-scm.com)
  - Mac: `git` is usually pre-installed, or install via Xcode Command Line Tools

---

## Step 1: Clone the Repository

Open your terminal (PowerShell on Windows, Terminal on Mac) and run:

```bash
git clone https://github.com/xnocode/second-brain.git
cd second-brain
```

This downloads the entire project to your computer.

---

## Step 2: Rename the Folder

Rename the folder from `second-brain` to your own project name. This is important so it doesn't get confused with the original repo.

### Windows (PowerShell):

```powershell
cd ..
Rename-Item -Path "second-brain" -NewName "my-brain"
cd my-brain
```

### Mac/Linux:

```bash
cd ..
mv second-brain my-brain
cd my-brain
```

> You can name it anything you want — `bro-code`, `my-notes`, `knowledge-base`, `dev-blog`, etc.

---

## Step 3: Install Dependencies

This downloads all the required packages (Next.js, React, Tailwind, etc.). It takes about 30-60 seconds depending on your internet speed.

```bash
npm install
```

This command is the **same on all platforms**. If you have `bun` installed, you can also use `bun install`.

---

## Step 4: Create the `.env` File

The `.env` file tells the app where to store the database. **This step is different on Windows vs Mac/Linux — pay attention!**

### Windows (PowerShell) — ⚠️ Use this exact command:

```powershell
Set-Content -Path .env -Value "DATABASE_URL=file:./db/custom.db" -NoNewline
```

### Mac/Linux:

```bash
echo "DATABASE_URL=file:./db/custom.db" > .env
```

### Why Windows is different

On Windows, PowerShell's `echo` command adds invisible **BOM (Byte Order Mark)** characters at the beginning of the file. Prisma can't read these invisible characters, so it fails to find the `DATABASE_URL`.

The `Set-Content -NoNewline` command creates a clean file without any extra characters.

### Verify the file was created:

**Windows:**
```powershell
Get-Content .env
```

**Mac/Linux:**
```bash
cat .env
```

You should see exactly:
```
DATABASE_URL=file:./db/custom.db
```

---

## Step 5: Setup the Database

This creates the SQLite database file and all the required tables:

```bash
npx prisma db push
```

You should see output like:
```
✔ Generated Prisma Client
🚀 Your database is now in sync with your Prisma schema.
```

This creates a `db/custom.db` file in your project folder. This file is **automatically excluded** from Git (it's in `.gitignore`), so your personal data never gets pushed to GitHub.

---

## Step 6: Run Locally

Start the development server:

### Windows (PowerShell):

```powershell
npx next dev -p 3000
```

### Mac/Linux:

```bash
npx next dev -p 3000
```

> **Windows tip:** Don't use `npm run dev` if the script pipes output to `tee` — that command doesn't exist on Windows. Use `npx next dev -p 3000` directly.

You should see:
```
  ▲ Next.js 16.x
  - Local:        http://localhost:3000
  - Environments: .env
```

### Open in your browser:

Go to **http://localhost:3000** — your Second Brain is running! 🎉

---

## Step 7: Push to Your Own GitHub

Now that you have it running locally, let's push it to your own GitHub repository.

### 7a. Create an empty repository on GitHub

1. Go to **[github.com/new](https://github.com/new)**
2. Enter your repo name (e.g., `my-brain`, `bro-code`)
3. Choose **Public** or **Private**
4. **Do NOT** initialize with README, `.gitignore`, or license — leave everything unchecked
5. Click **"Create repository"**

### 7b. Push your code

Run these commands from your project folder:

```bash
git init
git add .
git commit -m "Initial commit - My Second Brain"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

Replace `YOUR-USERNAME/YOUR-REPO-NAME` with your actual GitHub username and repo name.

### Using GitHub CLI (one command)

If you have [GitHub CLI](https://cli.github.com) installed:

```bash
gh repo create YOUR-REPO-NAME --public --source=. --push
```

This creates the repo AND pushes in a single command.

### What gets pushed

The `.gitignore` file automatically excludes:
- `node_modules/` (dependencies — too large)
- `db/` and `*.db` (your local database)
- `.env` (contains database path — sensitive)
- `tool-results/`, `upload/` (temporary files)
- `mini-services/*/node_modules/`

So only your source code, content, and config files get pushed.

---

## Step 8: Deploy to Vercel

[Vercel](https://vercel.com) is a free hosting platform that connects to GitHub and automatically deploys your site every time you push code.

### 8a. Sign up / Sign in

1. Go to **[vercel.com](https://vercel.com)**
2. Sign in with your **GitHub** account

### 8b. Import your repository

1. Click **"Add New..."** → **"Project"**
2. Find and click your repository (the one you just pushed)
3. Click **"Import"**

### 8c. Add environment variable

Before deploying, add one environment variable:

| Setting | Value |
|---------|-------|
| **Name** | `DATABASE_URL` |
| **Value** | `file:./db/custom.db` |

This tells Vercel where to create the database on their servers.

### 8d. Deploy

Click the **"Deploy"** button. Wait 1-2 minutes. That's it — your site is live! 🚀

Your URL will be something like `https://your-project-name.vercel.app`.

---

## Step 9: Update Your Live Site

Once deployed, updating your site is automatic:

### Method A: Edit on GitHub (No terminal needed)

1. Go to your repo on GitHub
2. Navigate to `content/posts/`
3. Click any file, then click the **pencil icon** to edit
4. Make your changes
5. Click **"Commit changes"**
6. Vercel detects the change and **automatically redeploys** within 1-2 minutes ✅

### Method B: Edit locally and push

1. Make changes on your computer
2. Add new `.md` files to `content/posts/`
3. Push to GitHub:

```bash
git add .
git commit -m "Added new article"
git push
```

4. Vercel detects the push and redeploys automatically ✅

### Adding a new blog post

Create a new `.md` file in `content/posts/`:

```markdown
---
title: "My New Article"
date: 2025-01-20
category: "Guide"
tags: [productivity, tips]
excerpt: "A short description that appears in the card preview"
---

# My New Article

Write your content here in **Markdown**.
```

That's all you need — the frontmatter (the `---` block at the top) tells the site everything it needs to display the article.

---

## For Non-Technical Users: The Fork Method

If you're not comfortable with the terminal at all, you can skip Steps 1-6:

1. Go to the repo on GitHub
2. Click the **"Fork"** button (top-right corner)
3. This creates a copy under your GitHub account
4. Go to [vercel.com](https://vercel.com) → Import your forked repo
5. Add `DATABASE_URL=file:./db/custom.db` as environment variable
6. Click **Deploy**
7. To edit content: use GitHub's built-in file editor in your browser
8. Every commit on GitHub triggers an automatic Vercel deploy

---

## Troubleshooting

### "DATABASE_URL not found" by Prisma

- **Windows:** Make sure you used `Set-Content -NoNewline`. Regular `echo` adds invisible BOM characters.
- **Mac/Linux:** Make sure you used `echo "..." > .env` (not `echo ... > .env` without quotes)
- Make sure the `.env` file is in the **root** of your project (same folder as `package.json`)

### `npx prisma db push` fails

- Ensure you created the `.env` file first (Step 4)
- Ensure Node.js v18+ is installed: `node --version`

### `npm install` fails

- Ensure you're in the correct folder (the one with `package.json`)
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- On Windows, make sure you're running PowerShell as **Administrator** if you get permission errors

### Port 3000 already in use

- Another app is using port 3000. Use a different port:
```bash
npx next dev -p 3001
```

### `git push` fails with "Repository not found"

- Make sure you **created the repository on GitHub first** (Step 7a) before pushing
- The repository on GitHub must be **empty** (no README, no .gitignore) before the first push
- Make sure your GitHub username and repo name are correct in the remote URL

---

## Summary

| Step | What | Command |
|------|------|---------|
| 1 | Clone repo | `git clone https://github.com/xnocode/second-brain.git` |
| 2 | Rename folder | `Rename-Item -Path "second-brain" -NewName "my-brain"` (Win) |
| 3 | Install | `npm install` |
| 4 | Create .env | `Set-Content -Path .env -Value "DATABASE_URL=file:./db/custom.db" -NoNewline` (Win) |
| 5 | Setup DB | `npx prisma db push` |
| 6 | Run locally | `npx next dev -p 3000` |
| 7 | Push to GitHub | `git init → git add . → git commit → git push` |
| 8 | Deploy | Vercel → Import repo → Add env var → Deploy |
| 9 | Update | Edit on GitHub or push locally → Auto-deploy ✅ |

You're now ready to build your own Second Brain. Happy writing! ✍️