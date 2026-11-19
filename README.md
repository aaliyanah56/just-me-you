# URWA — The Firmest Handhold

URWA is an Islamic learning and community platform with public programme information and secure portals for students, Ablas (teachers) and administrators.

## Technology
- Frontend: HTML, CSS and JavaScript
- Source control: GitHub — https://github.com/aaliyanah56/Urwa
- Backend: Supabase (Postgres, Auth and Row Level Security)
- Hosting: Vercel (Git-connected deployments)

GitHub is the source of truth for code, Supabase stores application data and handles authentication, and Vercel serves the website.

## Project structure
- `assets/` — logos and images
- `css/` — public site, authentication and dashboard styles
- `js/` — authentication and dashboard behaviour
- `portal/admin/` — administrator portal
- `portal/abla/` — Abla / teacher portal
- `portal/student/` — student portal
- `supabase-schema.sql` — reference initial schema; do not rerun on the live database
- `SUPABASE-SETUP.md` — backend setup and security notes

## Local development
1. Clone: `git clone https://github.com/aaliyanah56/Urwa.git`
2. Open the folder in VS Code.
3. Run with VS Code Live Server or another static server (workspace port 5502).
4. The browser client uses the Supabase project URL and publishable key in `js/auth.js`.

Never commit a Supabase secret/service-role key, database password, SMTP credential or Vercel token.

## Account lifecycle
- Public registration creates student accounts only; new applications start pending.
- Admin reviews applications, assigns a halaqa and accepts or declines the student.
- Abla accounts are invited by an administrator in Supabase Auth, then assigned the `teacher` role, approved and allocated to halaqas.
- Database RLS is the final authority; client-side role checks are not a security boundary.

## Deploy to Vercel
1. In Vercel choose **Add New → Project** and import `aaliyanah56/Urwa`.
2. Select branch `main`, framework preset **Other**, leave build/install commands empty and set output directory to `.`.
3. Deploy and copy the actual production URL assigned by Vercel.
4. Set that URL as Supabase Auth Site URL and add `https://*.vercel.app/**` and `http://localhost:5502/**` as redirect URLs.
5. Pushes to `main` trigger automatic Vercel deployments.

## Dashboard features
Admin: student and Abla directories, pending student approvals, halaqa assignment and announcements. Abla: assigned roster, attendance entry and assignment creation. Student: admission/programme status, attendance summary and Abla assignments. Student submissions, Hifdh/Muraja'ah entry, reporting and timetable management still require dedicated workflows and end-to-end testing.

## Responsive design
Dashboard tables scroll horizontally on small screens and the layouts adapt for desktop, tablet and mobile widths.
