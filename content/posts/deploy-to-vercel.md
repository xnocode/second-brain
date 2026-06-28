---
title: "Deploy to Vercel"
date: 2025-06-28
tags: ["deploy", "vercel", "guide"]
category: "Guide"
draft: false
excerpt: "Publish your Second Brain blog to the web with zero configuration."
cover: "/covers/deploy-to-vercel.png"
---

# Deploy to Vercel

The project deploys to Vercel with zero configuration. The source code is at [https://github.com/xnocode](https://github.com/xnocode).

## Before Deploying

Make sure your `blog/` folder has at least one published post and you've run the sync script locally to verify everything works.

```bash
bun run scripts/sync-vault.ts
bun run dev
```

Verify the site loads and posts appear. Then push to GitHub.

## Deploy Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "ready to deploy"
git push origin main
```

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New > Project**.
3. Select your `second-brain` repository.
4. Vercel detects Next.js automatically.

### 3. Configure Build

Leave the framework preset as Next.js. The only change is the **Build Command**:

```bash
bun run scripts/sync-vault.ts && bun run build
```

This ensures posts are synced before every build. Without this step, the `content/posts/` folder won't have your latest content.

**Install Command**: Leave as `bun install` (Vercel auto-detects this from the lockfile).

**Output Directory**: Leave as `.next` (Next.js default).

### 4. Deploy

Click **Deploy**. Vercel builds and deploys your site. Every subsequent push to `main` triggers an automatic redeployment.

## Custom Domain

1. Go to your Vercel project **Settings > Domains**.
2. Add your domain (e.g., `blog.yourdomain.com`).
3. Update your DNS records as Vercel instructs (usually a CNAME record).
4. HTTPS is provisioned automatically.

## Environment Variables

The blog doesn't require any environment variables for basic operation. If you add features that need environment variables, set them in Vercel project **Settings > Environment Variables**.

## How Builds Work

Every time you push to `main`:

1. Vercel runs `bun install`
2. Runs the build command (sync + build)
3. The sync script reads `blog/`, processes posts, copies images
4. Next.js builds the static site
5. Vercel deploys to their CDN

The entire process typically takes under 60 seconds.

## One Command to Go Live

After the initial Vercel setup, your entire workflow is one command:

```bash
bun run publish
```

This does everything in sequence:

1. Syncs your posts from `blog/` to `content/posts/` (with `--clean` to remove deleted posts)
2. Stages `content/posts/`, `public/images/`, and `public/covers/`
3. Commits with the message `blog: publish`
4. Pushes to GitHub

Vercel detects the push, rebuilds, and deploys automatically. Your changes are live.

### Day-to-Day Workflow

1. Write or edit posts in `blog/` (or in Obsidian)
2. Run `bun run dev` to preview locally
3. Run `bun run publish` when ready to go live

That's it. One command to publish.

## Next Steps

- [[setup-guide]] — If you haven't set up the project yet.
- [[adding-images]] — Make sure your images sync correctly before deploying.
- [[website-features]] — All the features your deployed blog will have.