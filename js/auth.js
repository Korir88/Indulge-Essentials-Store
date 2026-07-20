// js/auth.js — authentication modal (login + signup) and role enforcement

import { PERMISSIONS, TAB_LABELS, icons, state } from './state.js';
import { $, showToast } from './ui.js';
import { getAccount, accountExists, createAccount } from './store.js';

let signupRole = 'staff';
let onAuthed = () => {};

export function initAuth(callback){
  onAuthed = callback;
}

export function openLogin(){
  showAuth('login');
  $('#loginPage').classList.remove('hidden');
}
export function closeLogin(){
  $('#loginPage').classList.add('hidden');
}
export function showAuth(which){
  const login = which === 'login';
  $('#loginForm').classList.toggle('hidden', !login);
  $('#signupForm').classList.toggle('hidden', login);
  $('#tabLogin').classList.toggle('active', login);
  $('#tabSignup').classList.toggle('active', !login);
  $('#loginHint').textContent = '';
  $('#loginHint').classList.remove('err');
  $('#signupHint').textContent = '';
  $('#signupHint').classList.remove('err');
  (login ? $('#loginUser') : $('#suName')).focus();
}
function setSignupRole(r){
  signupRole = r;
  $('#suRoleStaff').classList.toggle('active', r === 'staff');
  $('#suRoleAdmin').classList.toggle('active', r === 'admin');
}

export function login(){
  const user = $('#loginUser').value.trim().toLowerCase();
  const pass = $('#loginPass').value;
  const hint = $('#loginHint');
  const acct = getAccount(user);
  if(!acct || acct.password !== pass){
    hint.textContent = 'Invalid username or password.';
    hint.classList.add('err');
    return;
  }
  state.user = { username: user, ...acct };
  hint.textContent = ''; hint.classList.remove('err');
  $('#loginPass').value = '';
  closeLogin();
  onAuthed();
}

export function signup(){
  const name = $('#suName').value.trim();
  const user = $('#suUser').value.trim().toLowerCase();
  const email = $('#suEmail').value.trim();
  const pass = $('#suPass').value;
  const hint = $('#signupHint');
  if(!name || !user || !email || !pass){
    hint.textContent = 'Please fill in every field.'; hint.classList.add('err'); return;
  }
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    hint.textContent = 'Enter a valid email address.'; hint.classList.add('err'); return;
  }
  if(accountExists(user)){
    hint.textContent = 'That username is already taken.'; hint.classList.add('err'); return;
  }
  createAccount(user, { password: pass, name, email, role: signupRole });
  hint.classList.remove('err');
  showToast(`Account created — welcome, ${name.split(' ')[0]}!`);
  state.user = { username: user, name, email, role: signupRole };
  ['suName','suUser','suEmail','suPass'].forEach(id => { const n = document.getElementById(id); if(n) n.value = ''; });
  closeLogin();
  onAuthed();
}

export function logout(){
  state.user = null;
  document.querySelectorAll('.role-badge').forEach(b => b.remove());
  showToast('Signed out');
}

export function canAccess(page){
  if(!state.user) return false;
  return PERMISSIONS[state.user.role].includes(page);
}

// Render the auth modal into a container
export function renderAuthModal(root){
  root.insertAdjacentHTML('beforeend', `
    <div id="loginPage" class="login-overlay hidden">
      <div class="auth-card">
        <button class="login-close" onclick="Auth.closeLogin()" aria-label="Close">&times;</button>
        <aside class="auth-aside">
          <div class="auth-aside-inner">
            <div class="auth-brand">${brandSvg()} <span>Indulge Essentials</span></div>
            <h2 class="auth-aside-title">The staff console for a calmer, greener store.</h2>
            <p class="auth-aside-sub">Manage inventory, run the shop floor and read your reports — all in one place.</p>
            <ul class="auth-aside-list">
              <li><span class="dot"></span> Point-of-sale &amp; cart</li>
              <li><span class="dot"></span> Inventory &amp; low-stock alerts</li>
              <li><span class="dot"></span> Sales reports &amp; CSV export</li>
            </ul>
          </div>
          <div class="auth-aside-foot">Clients can browse products without an account.</div>
        </aside>
        <div class="auth-form">
          <div class="auth-tabs">
            <button id="tabLogin" class="active" onclick="Auth.showAuth('login')">Sign In</button>
            <button id="tabSignup" onclick="Auth.showAuth('signup')">Sign Up</button>
          </div>
          <form id="loginForm" class="auth-pane" onsubmit="return false;">
            <div class="field">
              <label for="loginUser">Username</label>
              <input id="loginUser" type="text" placeholder="e.g. admin" autocomplete="username" />
            </div>
            <div class="field">
              <label for="loginPass">Password</label>
              <input id="loginPass" type="password" placeholder="Enter your password" autocomplete="current-password" onkeydown="if(event.key==='Enter') Auth.login();" />
            </div>
            <div class="login-hint" id="loginHint"></div>
            <button class="btn btn-primary auth-submit" onclick="Auth.login()">Sign In</button>
            <p class="auth-switch">New here? <a href="#" onclick="Auth.showAuth('signup'); return false;">Create an account</a></p>
          </form>
          <form id="signupForm" class="auth-pane hidden" onsubmit="return false;">
            <div class="row gap-3">
              <div class="field" style="flex:1;">
                <label for="suName">Full name</label>
                <input id="suName" type="text" placeholder="Jane Doe" autocomplete="name" />
              </div>
              <div class="field" style="flex:1;">
                <label for="suUser">Username</label>
                <input id="suUser" type="text" placeholder="jane" autocomplete="username" />
              </div>
            </div>
            <div class="field">
              <label for="suEmail">Email</label>
              <input id="suEmail" type="email" placeholder="jane@indulge.store" autocomplete="email" />
            </div>
            <div class="field">
              <label for="suPass">Password</label>
              <input id="suPass" type="password" placeholder="Create a password" autocomplete="new-password" />
            </div>
            <div class="field">
              <label>Register as</label>
              <div class="role-toggle">
                <button type="button" id="suRoleStaff" class="active" onclick="Auth.setSignupRole('staff')">Staff</button>
                <button type="button" id="suRoleAdmin" onclick="Auth.setSignupRole('admin')">Admin</button>
              </div>
            </div>
            <div class="login-hint" id="signupHint"></div>
            <button class="btn btn-primary auth-submit" onclick="Auth.signup()">Create Account</button>
            <p class="auth-switch">Already have an account? <a href="#" onclick="Auth.showAuth('login'); return false;">Sign in</a></p>
          </form>
        </div>
      </div>
    </div>`);
}
function brandSvg(){
  return `<svg viewBox="0 0 48 48" fill="none"><path d="M24 4C24 4 12 14 12 26a12 12 0 0 0 24 0C36 14 24 4 24 4Z" fill="var(--accent)" /><path d="M24 20v22" stroke="var(--accent-ink)" stroke-width="2" stroke-linecap="round" /></svg>`;
}
export { setSignupRole, TAB_LABELS };
