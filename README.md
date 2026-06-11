# Dhakal Patro

Nepali calendar with Surya Panchanga, BS/AD date converter, festivals, public holidays, and Janma Kundali.

## Development

```bash
npm install
cp .env.example .env   # optional — defaults to the bundled API URL
npm run dev
```

## Deploy to Vercel

This app is configured for [Vercel](https://vercel.com) (no GitHub required). Deploy from your machine with the CLI:

```bash
npm i -g vercel
vercel login
cd dhakal-patro
vercel link          # create or link a Vercel project (one-time)
vercel               # preview deployment
vercel --prod        # production deployment
```

Or use the npm scripts after linking:

```bash
npm run deploy       # preview
npm run deploy:prod  # production
```

### Environment variables

In the [Vercel dashboard](https://vercel.com/docs/projects/environment-variables) (or via `vercel env`), set:

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Panchanga API base URL (no trailing slash). Example: `https://193-123-67-133.sslip.io` |

Redeploy after changing env vars so Vite can bake them into the build.

### Client-side routing

`vercel.json` rewrites all routes to `index.html` so TanStack Router paths (`/calendar`, `/panchanga`, etc.) work on refresh and direct links.
