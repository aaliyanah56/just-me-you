/* URWA Firebase authentication module for project urwa-f3263.
 * This module is prepared in parallel with the existing Supabase dashboards.
 * Do not switch page script tags to this file until dashboard-data.js and
 * department-tracker.js have also been migrated to Firebase.
 */
import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const $ = (id) => document.getElementById(id);

function showMessage(form, message, isError = true) {
  if (!form) return;
  let node = form.querySelector('[data-auth-message]');
  if (!node) {
    node = document.createElement('p');
    node.dataset.authMessage = 'true';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.style.cssText = 'margin:14px 0;padding:12px;border-radius:8px;font-size:.9rem;line-height:1.5';
    form.appendChild(node);
  }
  node.textContent = message;
  node.style.background = isError ? '#fff0ed' : '#e3f0ea';
  node.style.color = isError ? '#8c2f20' : '#0e4a40';
}

function portalFor(role) {
  if (role === 'student') return '/portal/student/student-dashboard.html';
  if (role === 'teacher' || role === 'abla') return '/portal/abla/teacher-dashboard.html';
  if (role === 'admin') return '/portal/admin/admin-dashboard.html';
  return '/';
}

async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('Your URWA profile is not ready. Please contact administration.');
  return snap.data();
}

async function signIn(form, expectedRole) {
  const email = $('email')?.value.trim();
  const password = $('password')?.value || '';
  if (!email || !password) throw new Error('Enter your email address and password.');
  const credential = await signInWithEmailAndPassword(auth, email, password);
  try {
    const profile = await getProfile(credential.user.uid);
    const role = profile.role === 'abla' ? 'teacher' : profile.role;
    if (role !== expectedRole) throw new Error('This account is not authorised for this portal. Please use the correct login page.');
    if (profile.status !== 'approved') throw new Error('Your account is awaiting URWA approval or has been suspended. Please contact administration.');
    window.location.href = portalFor(role);
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}

const studentLogin = $('studentLoginForm');
if (studentLogin) studentLogin.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = studentLogin.querySelector('[type="submit]');
  if (button) button.disabled = true;
  try { await signIn(studentLogin, 'student'); }
  catch (error) { showMessage(studentLogin, error.message || 'Unable to sign in.'); }
  finally { if (button) button.disabled = false; }
});

const staffForm = document.querySelector('[data-staff-login]');
if (staffForm) staffForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = staffForm.querySelector('[type="submit]');
  if (button) button.disabled = true;
  try { await signIn(staffForm, staffForm.dataset.staffLogin === 'abla' ? 'teacher' : staffForm.dataset.staffLogin); }
  catch (error) { showMessage(staffForm, error.message || 'Unable to sign in.'); }
  finally { if (button) button.disabled = false; }
});

const adminForm = $('adminLoginForm');
if (adminForm) adminForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = adminForm.querySelector('[type="submit]');
  if (button) button.disabled = true;
  try { await signIn(adminForm, 'admin'); }
  catch (error) { showMessage(adminForm, error.message || 'Unable to sign in.'); }
  finally { if (button) button.disabled = false; }
});

const registrationForm = $('studentRegistrationForm');
if (registrationForm) registrationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = $('password')?.value || '';
  const confirmation = $('confirmPassword')?.value || '';
  if (password.length < 8) return showMessage(registrationForm, 'Use a password with at least 8 characters.');
  if (password !== confirmation) return showMessage(registrationForm, 'Your passwords do not match.');
  const button = registrationForm.querySelector('[type="submit]');
  if (button) button.disabled = true;
  let createdUser = null;
  try {
    const fullName = $('fullName')?.value.trim() || '';
    const email = $('email')?.value.trim().toLowerCase() || '';
    const phone = $('phone')?.value.trim() || '';
    if (!fullName || !email) throw new Error('Enter your full name and email address.');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    createdUser = credential.user;
    await setDoc(doc(db, 'users', createdUser.uid), {
      fullName,
      email,
      phone,
      level: $('level')?.value || '',
      programme: $('programme')?.value || '',
      preferredSession: $('session')?.value || '',
      role: 'student',
      status: 'approved',
      createdAt: serverTimestamp()
    });
    let verificationNote = '';
    try {
      await sendEmailVerification(createdUser);
      verificationNote = ' A verification email has been sent; please check your inbox and spam folder.';
    } catch (_) {
      verificationNote = ' Email verification could not be sent right now; you can request it again after signing in.';
    }
    showMessage(registrationForm, 'Your student account has been created and is approved. You can now use the student login.' + verificationNote, false);
    registrationForm.reset();
    await signOut(auth);
  } catch (error) {
    // If profile creation fails, do not silently leave a half-created signed-in session.
    if (createdUser) {
      try { await signOut(auth); } catch (_) {}
      showMessage(registrationForm, 'Your authentication account was created, but the URWA profile could not be saved. Please contact administration before trying to register again. Details: ' + (error.message || 'Unknown error'), true);
    } else {
      showMessage(registrationForm, error.message || 'Registration could not be completed.');
    }
  } finally {
    if (button) button.disabled = false;
  }
});

document.querySelectorAll('[data-toggle-password]').forEach((button) => button.addEventListener('click', () => {
  const input = $(button.dataset.togglePassword);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  button.textContent = input.type === 'password' ? 'Show' : 'Hide';
}));

// Student password reset email.
const forgotForm = $('studentForgotPasswordForm');
if (forgotForm) forgotForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = forgotForm.querySelector('[type="submit]');
  if (button) button.disabled = true;
  try {
    const email = $('email')?.value.trim();
    if (!email) throw new Error('Enter the email address linked to your URWA account.');
    await sendPasswordResetEmail(auth, email, {
      url: `${location.origin}/portal/student/student-reset-password.html`,
      handleCodeInApp: false
    });
    showMessage(forgotForm, 'If an account exists for that email, Firebase has sent password-reset instructions. Please check your inbox and spam folder.', false);
  } catch (error) {
    showMessage(forgotForm, error.message || 'Unable to send the password reset email.');
  } finally {
    if (button) button.disabled = false;
  }
});

// Password reset action from the Firebase email link.
const resetForm = $('studentResetPasswordForm');
if (resetForm) {
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');
  if (mode === 'resetPassword' && oobCode) {
    verifyPasswordResetCode(auth, oobCode).catch(() => showMessage(resetForm, 'This password-reset link is invalid or has expired. Request a new one.'));
  } else {
    showMessage(resetForm, 'Open the password-reset link sent to your email to choose a new password.');
  }
  resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = resetForm.querySelector('[type="submit]');
    if (button) button.disabled = true;
    try {
      const password = $('newPassword')?.value || '';
      const confirmation = $('confirmNewPassword')?.value || '';
      if (!oobCode || mode !== 'resetPassword') throw new Error('Request a new password-reset email and open its link.');
      if (password.length < 8) throw new Error('Your new password must be at least 8 characters long.');
      if (password !== confirmation) throw new Error('Your passwords do not match.');
      await confirmPasswordReset(auth, oobCode, password);
      showMessage(resetForm, 'Your password has been updated. You can now sign in to URWA.', false);
      setTimeout(() => { window.location.href = '/portal/student/student-login.html'; }, 1200);
    } catch (error) {
      showMessage(resetForm, error.message || 'Your password could not be updated.');
    } finally {
      if (button) button.disabled = false;
    }
  });
}

// Expose a small reusable session helper for the upcoming Firebase dashboard migration.
export async function requireFirebaseProfile(expectedRole) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Please sign in again.');
  const profile = await getProfile(currentUser.uid);
  const actualRole = profile.role === 'abla' ? 'teacher' : profile.role;
  if (expectedRole && actualRole !== expectedRole) throw new Error('You are not authorised to view this dashboard.');
  if (profile.status !== 'approved') throw new Error('Your account is awaiting approval or has been suspended.');
  return { user: currentUser, profile };
}

export { getProfile };
