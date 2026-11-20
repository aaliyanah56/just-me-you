# Deploy URWA with Cloudflare Pages

URWA is a static HTML/CSS/JavaScript site backed by Firebase Authentication and Cloud Firestore. Cloudflare Pages only hosts the frontend; Firebase remains the application backend.

## GitHub-connected deployment

1. Sign in to Cloudflare and open **Workers & Pages → Create application → Pages → Connect to Git**.
2. Authorize Cloudflare to access the GitHub repository **aaliyanah56/Urwa**.
3. Select the `main` branch as the production branch.
4. Use these exact build settings:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Root directory | `/` (repository root) |
| Build command | Leave empty |
| Build output directory | `.` |

5. Save and deploy. Cloudflare will publish the existing `index.html` and the other HTML pages from the repository root.
6. After the first deployment, open the assigned `*.pages.dev` URL and test the public pages and sign-in flow.

## Firebase authorized domain

In Firebase Console → Authentication → Settings → Authorized domains, add the exact Cloudflare Pages hostname assigned to the project (without `https://` or a path). If a custom domain is later attached, add that hostname too.

## How updates publish

- Push or merge website changes into `main`: Cloudflare Pages automatically builds and publishes production.
- Push a feature branch: Cloudflare Pages creates a preview deployment (if branch previews are enabled).
- Keep Firebase configuration and Firestore rules in the Firebase project; Cloudflare Pages does not replace Firebase.

## Notes

- No Node build, package installation, or framework preset is required for the current static site.
- The root `_headers` file applies baseline browser security headers and static-asset cache hints.
- Do not add Firebase service-account keys or other server secrets to this public frontend repository.
- Keep Vercel connected as an optional backup if desired; it is not required for Cloudflare Pages.
