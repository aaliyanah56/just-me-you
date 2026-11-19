# URWA — Supabase setup

**GitHub:** https://github.com/aaliyanah56/Urwa  
**Supabase project:** https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg  
**Project ref:** `kwqaorzvflrgepepfwwg`  
**Hosting:** Vercel (Netlify is no longer used)

## Existing backend
The active Supabase project contains `profiles`, `halaqas`, `teacher_assignments`, `student_enrollments`, `attendance`, `assignments`, `submissions`, `hifdh_records`, `murajaah_records` and `announcements`. Row Level Security is enabled on these public tables.

**Do not rerun `supabase-schema.sql` on the live project.** It is retained as a reference copy.

## Browser connection
`js/auth.js` initialises the Supabase client with the project URL and publishable key. Never expose a Supabase secret key, `service_role` key, database password or SMTP credentials in frontend code or GitHub.

## Authentication URL configuration
After Vercel assigns the production domain, open [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/auth/url-configuration):
- Site URL: the exact production URL assigned by Vercel.
- Additional Redirect URLs:
  ```
  https://*.vercel.app/**
  http://localhost:5502/**
  ```

The website uses `location.origin` for confirmation and password recovery redirects.

## Account lifecycle
1. Public registration creates student accounts only; the trigger creates a pending profile and enrollment.
2. An administrator reviews the application, assigns a halaqa and accepts or declines the student.
3. Abla accounts are provisioned by an administrator in Supabase Auth. Set the profile role to `teacher`, approve the account and assign one or more halaqas. Never expose staff role selection publicly.
4. Administrators use existing authorised admin accounts.

## Security
- Keep RLS enabled on every exposed table.
- Test student, teacher and admin accounts independently.
- Never use user-editable user metadata for authorization decisions.
- Configure reliable SMTP before public launch.
- The live project has a policy allowing approved teachers to read only profiles of students enrolled in their assigned halaqas.

## Dashboard coverage
Admin admissions, teacher approval/assignment, announcements, teacher attendance and assignment creation, and student assignment visibility are connected to Supabase. Student submissions, Hifdh/Muraja'ah entry, reporting and timetable management remain future workflow work.
