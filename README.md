# HTML to Text

Upload an HTML file and get its source code as plain text you can copy, paste or download.
Every upload is saved to a history you can open from any PC, protected by a password.

Hosted on Netlify: the page is in `public/`, the API is a Netlify Function
(`netlify/functions/files.mjs`), and files are stored in Netlify Blobs.

## Deploy to Netlify

1. In Netlify, choose **Add new site → Import an existing project** and pick this GitHub repository.
   The settings in `netlify.toml` are picked up automatically (no build command needed).
2. Go to **Site configuration → Environment variables** and add `APP_PASSWORD` with a strong password.
3. Trigger a redeploy (**Deploys → Trigger deploy**) so the function sees the password.
4. Open the site, enter the password, and start uploading.

Netlify Blobs needs no setup; it is enabled automatically for the site.

## Run locally

```sh
npm install
APP_PASSWORD=secret npm run dev   # http://localhost:8888
```

The local server keeps files in memory only, so history is lost when it stops.

## Limits

- Files up to 5 MB each.
- One shared password; anyone who has it can see and delete the history.
