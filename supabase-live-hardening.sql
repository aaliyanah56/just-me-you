-- Applied to live URWA Supabase project on 2026-11-19 via Supabase integration.
-- These statements are already applied; do not run blindly on another database without review.
REVOKE ALL ON FUNCTION public."current_role"() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public."current_role"() TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.is_approved_teacher_of(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_approved_teacher_of(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
CREATE INDEX IF NOT EXISTS idx_announcements_halaqa_id ON public.announcements(halaqa_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published_by ON public.announcements(published_by);
CREATE INDEX IF NOT EXISTS idx_assignments_halaqa_id ON public.assignments(halaqa_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_by ON public.attendance(recorded_by);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_hifdh_records_recorded_by ON public.hifdh_records(recorded_by);
CREATE INDEX IF NOT EXISTS idx_hifdh_records_student_id ON public.hifdh_records(student_id);
CREATE INDEX IF NOT EXISTS idx_murajaah_records_recorded_by ON public.murajaah_records(recorded_by);
CREATE INDEX IF NOT EXISTS idx_murajaah_records_student_id ON public.murajaah_records(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_halaqa_id ON public.student_enrollments(halaqa_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_reviewed_by ON public.student_enrollments(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON public.submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_halaqa_id ON public.teacher_assignments(halaqa_id);


-- Applied to the live project on 2026-11-19. Restrict Abla profile reads to approved students in assigned halaqas.
CREATE POLICY "approved teachers read assigned student profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  role = 'student'::public.urwa_role
  AND EXISTS (
    SELECT 1 FROM public.student_enrollments e
    JOIN public.teacher_assignments ta ON ta.halaqa_id = e.halaqa_id
    WHERE e.student_id = profiles.id
      AND e.status = 'approved'::public.account_status
      AND ta.teacher_id = (SELECT auth.uid())
      AND public.is_approved_teacher_of(e.halaqa_id)
  )
);
