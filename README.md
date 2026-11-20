# URWA — The Firmest Handhold

URWA is an Islamic learning and community platform with public programme information and secure portals for students, Ablas (teachers) and administrators.

## Technology
- Frontend: HTML, CSS and JavaScript
- Source control: GitHub — https://github.com/aaliyanah56/Urwa
- Authentication: Firebase Authentication
- Database: Cloud Firestore
- Hosting and deployment: Cloudflare Pages

GitHub is the source of truth for code, Firebase provides authentication and application data, and Cloudflare Pages serves the website. Vercel may remain connected as a backup. This repository does not use Supabase or Netlify.

## Firebase project
- Project ID: `urwa-f3263`
- Auth domain: `urwa-f3263.firebaseapp.com`
- Firestore database: Cloud Firestore

The Firebase web configuration in `js/firebase.js` is a public client configuration. Never commit service-account keys or other privileged credentials.

## Project structure
- `assets/` — logos and images
- `css/` — public site, authentication and dashboard styles
- `js/firebase.js` — Firebase client setup
- `js/firebase-auth.js` — Firebase Authentication and role checks
- `js/dashboard-data.js` — student, Abla and admin Firestore workflows
- `js/department-tracker.js` — Firestore department tracker
- `firestore.rules` — role-scoped Firestore security rules
- `portal/admin/` — administrator portal
- `portal/abla/` — Abla / teacher portal
- `portal/student/` — student portal

## Account lifecycle
- Public registration creates student accounts with **pending** status.
- An administrator reviews applications, assigns a halaqa and approves or declines the student.
- Staff accounts must be created in Firebase Authentication and provisioned with a trusted Firestore profile. Never expose admin or teacher role selection in public registration.
- Firestore Security Rules are the final authority; client-side role checks are not a security boundary.

## Firebase setup
1. Open the Firebase project `urwa-f3263`.
2. Enable Email/Password in Authentication.
3. Create the Cloud Firestore database.
4. Add the production Cloudflare Pages domain and localhost development domain to Authentication → Settings → Authorized domains.
5. Publish the rules in `firestore.rules` from Firebase Console → Firestore Database → Rules.
6. Create the initial approved admin user in Firebase Authentication, then provision that user's `users/{uid}` profile using a trusted administrator process. Do not allow a public form to create an admin role.
7. Seed the `halaqas` collection with documents containing `name` and `isActive: true`.

## Local development
1. Clone: `git clone https://github.com/aaliyanah56/Urwa.git`
2. Open the folder in VS Code.
3. Run with VS Code Live Server or another static server (workspace port 5502).
4. Firebase web settings are read from `js/firebase.js`.

## Deploy to Cloudflare Pages
See [CLOUDFLARE-DEPLOY.md](./CLOUDFLARE-DEPLOY.md) for the repository's exact Pages settings.

This is a static HTML/CSS/JavaScript site, so no framework build is required:
- Production branch: `main`
- Framework preset: `None`
- Build command: leave blank
- Build output directory: `.`
- Root directory: `/` (repository root)

Cloudflare Pages Git integration builds and publishes each push to the production branch. Preview branches can be used to test changes before merging.

## Important migration note
The application code is being migrated to Firebase. The former Supabase-hosted database is a separate service and is not deleted by removing its code from this repository. Export and verify any required records before closing that old service. Firebase Authentication users must be reactivated or reset through a secure migration process; passwords cannot simply be copied from the old provider.

## Dashboard coverage
Admin: student and Abla directories, pending student approvals, halaqa assignment and announcements. Abla: assigned roster, attendance entry and assignment creation. Student: admission/programme status, attendance summary and Abla assignments. Department tracker: department memberships, goals and reports. Test all roles and workflows with dedicated accounts before production launch.
