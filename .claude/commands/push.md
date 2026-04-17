Run the full deployment pipeline for this Next.js project:

1. Run `npm run build` in the project directory and capture any errors
2. If there are build errors, fix them (TypeScript errors, ESLint errors, missing imports, etc.) — keep fixing until the build passes
3. Once the build succeeds, stage all changed files with `git add .`
4. Commit with a short descriptive message summarizing what changed (based on the files modified)
5. Push to `origin main` via SSH

When done, tell the user "Done — check your Vercel site in ~1 minute" and show the commit hash. Also include the live URL: https://lizt-design.vercel.app/