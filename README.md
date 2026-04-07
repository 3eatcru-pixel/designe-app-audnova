<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/53abf1c6-ca68-45e2-a0c8-9bab6d19fc5d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a local environment file (ignored by git) and set your API key:

   - Create `.env.local` at the project root with the following content:

     ```
     GEMINI_API_KEY=your_real_gemini_api_key_here
     ```

   - Do NOT commit this file. `.gitignore` already ignores `.env*` and keeps secrets out of the repo.

3. Run the app locally:
   `npm run dev`

## Build & Deploy

- Build for production:

  `npm run build`

- Serve the production build locally (optional):

  `npm run preview`

- For deployment (Cloud Run, Vercel, Netlify, or AI Studio):
  - Provide `GEMINI_API_KEY` as an environment variable or secret in your hosting provider's UI.
  - Ensure the runtime injects the environment variable (this project reads `process.env.GEMINI_API_KEY`).
  - Follow your host's docs to connect repo and set environment secrets.
