# URWA — Project links

## Services
- GitHub: https://github.com/aaliyanah56/Urwa
- Vercel dashboard: https://vercel.com/dashboard
- Supabase project: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg
- Supabase SQL Editor: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/sql/new
- Supabase Table Editor: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/editor
- Supabase Auth users: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/auth/users
- Supabase Auth URL Configuration: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/auth/url-configuration
- Supabase API keys: https://supabase.com/dashboard/project/kwqaorzvflrgepepfwwg/settings/api-keys

## Routes
Vercel assigns the production hostname during first deployment. Replace `YOUR-VERCEL-DOMAIN` with that actual hostname.

| Page | Route |
|---|---|
| Main website | `/` |
| About | `/about.html` |
| Programmes | `/programmes.html` |
| Classes | `/classes.html` |
| Teachers | `/teachers.html` |
| Events | `/events.html` |
| Contact | `/contact.html` |
| Enrolment | `/enroll.html` |
| Become an Abla | `/become-teacher.html` |
| Student registration | `/portal/student/student-register.html` |
| Student login | `/portal/student/student-login.html` |
| Student dashboard | `/portal/student/student-dashboard.html` |
| Abla login | `/portal/abla/teacher-login.html` |
| Abla dashboard | `/portal/abla/teacher-dashboard.html` |
| Admin login | `/portal/admin/login.html` |
| Admin dashboard | `/portal/admin/admin-dashboard.html` |

## Supabase redirect configuration
Set the Site URL to the exact Vercel production domain and add:
```
https://*.vercel.app/**
http://localhost:5502/**
```
Add any future custom domain explicitly.

## Hosting
URWA uses GitHub for source control, Supabase for backend services and Vercel for deployment. Netlify configuration has been removed from the repository.
