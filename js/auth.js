/* URWA Supabase authentication. Public publishable key only. */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://kwqaorzvflrgepepfwwg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dr-L_IXcqt1Rw4ROmoH62w_AoTn204K';
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
function showMessage(form, message, isError = true) {
  let node = form.querySelector('[data-auth-message]');
  if (!node) {
    node = document.createElement('p'); node.dataset.authMessage = 'true';
    node.setAttribute('role','status'); node.setAttribute('aria-live','polite');
    node.style.cssText = 'margin:14px 0;padding:12px;border-radius:8px;background:#e3f0ea;color:#0e4a40;font-size:.9rem;line-height:1.5';
    form.appendChild(node);
  }
  node.textContent = message;
  node.style.background = isError ? '#fff0ed' : '#e3f0ea';
  node.style.color = isError ? '#8c2f20' : '#0e4a40';
}
function portalFor(role) {
  if (role === 'student') return '/portal/student/student-dashboard.html';
  if (role === 'teacher') return '/portal/abla/teacher-dashboard.html';
  if (role === 'admin') return '/portal/admin/admin-dashboard.html';
  return '/';
}
async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('id,full_name,email,role,status').eq('id', userId).single();
  if (error) throw error;
  return data;
}
async function signIn(form, expectedRole) {
  const email = $('email')?.value.trim();
  const password = $('password')?.value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  let profile;
  try { profile = await getProfile(data.user.id); }
  catch (err) { await supabase.auth.signOut(); throw new Error('Your URWA profile is not ready. Please contact administration.'); }
  if (profile.role !== expectedRole) {
    await supabase.auth.signOut();
    throw new Error('This account is not authorised for this portal. Please use the correct login page.');
  }
  if (profile.status !== 'approved') {
    await supabase.auth.signOut();
    throw new Error('Your account is awaiting URWA approval or has been suspended. Please contact administration.');
  }
  window.location.href = portalFor(profile.role);
}

const studentLogin = $('studentLoginForm');
if (studentLogin) studentLogin.addEventListener('submit', async (e) => {
  e.preventDefault(); const button = studentLogin.querySelector('[type="submit"]');
  button.disabled = true;
  try { await signIn(studentLogin, 'student'); }
  catch (err) { showMessage(studentLogin, err.message); }
  finally { button.disabled = false; }
});

const staffForm = document.querySelector('[data-staff-login]');
if (staffForm) staffForm.addEventListener('submit', async (e) => {
  e.preventDefault(); const button = staffForm.querySelector('[type="submit"]'); button.disabled = true;
  try { await signIn(staffForm, staffForm.dataset.staffLogin); }
  catch (err) { showMessage(staffForm, err.message); }
  finally { button.disabled = false; }
});

const adminForm = $('adminLoginForm');
if (adminForm) adminForm.addEventListener('submit', async (e) => {
  e.preventDefault(); const button = adminForm.querySelector('[type="submit"]'); button.disabled = true;
  try { await signIn(adminForm, 'admin'); }
  catch (err) { showMessage(adminForm, err.message); }
  finally { button.disabled = false; }
});

const registrationForm = $('studentRegistrationForm');
if (registrationForm) registrationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = $('password').value;
  if (password !== $('confirmPassword').value) return showMessage(registrationForm, 'Your passwords do not match.');
  const button = registrationForm.querySelector('[type="submit"]'); button.disabled = true;
  try {
    const fullName = $('fullName').value.trim();
    const email = $('email').value.trim();
    const phone = $('phone').value.trim();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone, level: $('level').value, programme: $('programme').value, preferred_session: $('session').value || null }, emailRedirectTo: `${location.origin}/portal/student/student-login.html` }
    });
    if (error) throw error;
    showMessage(registrationForm, 'Your student account has been created and approved automatically. Check your email to confirm your email address if requested, then sign in to access your URWA student portal.', false);
    registrationForm.reset();
  } catch (err) { showMessage(registrationForm, err.message || 'Registration could not be completed.'); }
  finally { button.disabled = false; }
});

// Toggle-password controls used by the existing login and registration designs.
document.querySelectorAll('[data-toggle-password]').forEach(btn => btn.addEventListener('click', () => {
  const input = $(btn.dataset.togglePassword); if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password'; btn.textContent = input.type === 'password' ? 'Show' : 'Hide';
}));

// Protect each dashboard using both an active Supabase session and database role/status.
const dashboard = document.body.dataset.urwaRole;
if (dashboard) (async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.replace(dashboard === 'student' ? '/portal/student/student-login.html' : dashboard === 'teacher' ? '/portal/abla/teacher-login.html' : '/portal/admin/login.html'); return; }
  try {
    const profile = await getProfile(session.user.id);
    if (profile.role !== dashboard || profile.status !== 'approved') throw new Error('Not authorised');
    document.querySelectorAll('[data-profile-name]').forEach(el => el.textContent = profile.full_name || 'URWA member');
    document.querySelectorAll('[data-profile-email]').forEach(el => el.textContent = profile.email || session.user.email || '');
  } catch (_) { await supabase.auth.signOut(); window.location.replace('/'); }
})();

document.querySelectorAll('[data-urwa-logout]').forEach(el => el.addEventListener('click', async (e) => {
  e.preventDefault(); await supabase.auth.signOut(); window.location.href = '/';
}));

// Student password recovery: send the reset email to the dedicated reset page.
const forgotPasswordForm = $('studentForgotPasswordForm');
if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = forgotPasswordForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const email = $('email')?.value.trim();
    if (!email) throw new Error('Enter the email address linked to your URWA account.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/portal/student/student-reset-password.html`
    });
    if (error) throw error;
    showMessage(forgotPasswordForm, 'Password reset instructions have been sent, if an account exists for that email. Please check your inbox.', false);
  } catch (err) {
    showMessage(forgotPasswordForm, err.message || 'Unable to send the password reset email.');
  } finally {
    button.disabled = false;
  }
});

// Set a new password after the user opens the Supabase recovery link.
const resetPasswordForm = $('studentResetPasswordForm');
if (resetPasswordForm) resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = resetPasswordForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const password = $('newPassword')?.value || '';
    const confirmation = $('confirmNewPassword')?.value || '';
    if (password.length < 8) throw new Error('Your new password must be at least 8 characters long.');
    if (password !== confirmation) throw new Error('Your passwords do not match.');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('This password-reset link is invalid or has expired. Request a new one.');
    let destination = '/portal/student/student-login.html';
    try {
      const resetProfile = await getProfile(session.user.id);
      if (resetProfile.role === 'admin') destination = '/portal/admin/login.html';
      else if (resetProfile.role === 'teacher') destination = '/portal/abla/teacher-login.html';
    } catch (_) {}
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    showMessage(resetPasswordForm, 'Your password has been updated. You can now sign in to URWA.', false);
    await supabase.auth.signOut();
    setTimeout(() => { window.location.href = destination; }, 1200);
  } catch (err) {
    showMessage(resetPasswordForm, err.message || 'Your password could not be updated.');
  } finally {
    button.disabled = false;
  }
});


// Admin account activation for an existing, already-approved Supabase admin.
// This deliberately uses a magic link with shouldCreateUser:false: it cannot
// create a new user, assign roles, or turn a public signup into admin access.
const adminActivationRequestForm = $('adminActivationRequestForm');
const adminPasswordSetupForm = $('adminPasswordSetupForm');
const adminActivationMessage = $('adminActivationMessage');
const adminActivationRequestPanel = $('adminActivationRequestPanel');
const adminPasswordSetupPanel = $('adminPasswordSetupPanel');
const ADMIN_ACTIVATION_EMAIL = 'rahmaibrahimnoor47@gmail.com';

function adminActivationMessageText(message, isError = false) {
  if (!adminActivationMessage) return;
  adminActivationMessage.textContent = message;
  adminActivationMessage.hidden = false;
  adminActivationMessage.style.background = isError ? '#fff0ed' : '#f1eadc';
  adminActivationMessage.style.color = isError ? '#8c2f20' : '#1f2a44';
}

async function showAdminPasswordSetup(session) {
  if (!session?.user || (session.user.email || '').toLowerCase() !== ADMIN_ACTIVATION_EMAIL) return false;
  let profile;
  try { profile = await getProfile(session.user.id); }
  catch (_) { return false; }
  if (profile.role !== 'admin' || profile.status !== 'approved' ||
      (profile.email || '').toLowerCase() !== ADMIN_ACTIVATION_EMAIL) return false;
  if (adminActivationRequestPanel) adminActivationRequestPanel.hidden = true;
  if (adminPasswordSetupPanel) adminPasswordSetupPanel.hidden = false;
  adminActivationMessageText('Email verified by Supabase. Create a new password for the approved URWA administrator account.');
  return true;
}

if (adminActivationRequestForm) {
  // A magic-link return places the authenticated session in the URL fragment.
  // supabase-js detects and stores that session before getSession resolves.
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const validAdmin = await showAdminPasswordSetup(session);
      if (!validAdmin) {
        await supabase.auth.signOut();
        adminActivationMessageText('This link is not for the approved Rahma administrator account. Please request a new link using the admin email.', true);
      }
    }
  })();

  adminActivationRequestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = adminActivationRequestForm.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const email = $('adminActivationEmail')?.value.trim().toLowerCase();
      if (email !== ADMIN_ACTIVATION_EMAIL) throw new Error('Use the administrator email shown on this page.');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${location.origin}/portal/admin/register.html`
        }
      });
      if (error) {
        if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
          throw new Error('Supabase has temporarily rate-limited emails for this project. Please stop retrying for now. The project owner may need to configure custom SMTP in Supabase before another link can be sent.');
        }
        throw error;
      }
      adminActivationMessageText('A secure sign-in link has been requested from Supabase for the existing admin account. Check the inbox and spam folder, then open the latest link on this device.');
    } catch (err) {
      adminActivationMessageText(err.message || 'Unable to request the admin setup link.', true);
    } finally {
      button.disabled = false;
    }
  });
}

if (adminPasswordSetupForm) {
  adminPasswordSetupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = adminPasswordSetupForm.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const password = $('adminNewPassword')?.value || '';
      const confirmation = $('adminConfirmPassword')?.value || '';
      if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
      if (password !== confirmation) throw new Error('The passwords do not match.');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session || !(await showAdminPasswordSetup(session))) {
        throw new Error('Your secure admin link is invalid or expired. Request a new link.');
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      adminActivationMessageText('Your administrator password has been saved in Supabase. Redirecting to the admin sign-in page.');
      await supabase.auth.signOut();
      setTimeout(() => { window.location.href = '/portal/admin/login.html'; }, 1200);
    } catch (err) {
      adminActivationMessageText(err.message || 'Your admin password could not be saved.', true);
    } finally {
      button.disabled = false;
    }
  });
}
