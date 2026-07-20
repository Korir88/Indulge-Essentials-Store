// js/main.js — application bootstrap & global wiring

import { state, monthly, TAX_RATE, icons } from './state.js';
import { showToast, $ } from './ui.js';
import { saveState, loadState, loadAccounts, seedIfEmpty } from './store.js';
import { initAuth, renderAuthModal, openLogin, setSignupRole, showAuth, login, signup, closeLogin, logout, canAccess } from './auth.js';
import { Store } from './views/storefront.js';
import { Console, POS, Inventory } from './views/console.js';

const App = {
  toggleTheme(){
    this.setTheme(state.theme === 'dark' ? 'light' : 'dark');
  },
  setTheme(t){
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    const icon = t === 'dark' ? icons.sun() : icons.moon();
    const tb = $('#themeBtn'); if(tb) tb.innerHTML = icon;
    const tbp = $('#themeBtnPublic'); if(tbp) tbp.innerHTML = icon;
    $('#dayBtn')?.classList.toggle('active', t === 'light');
    $('#nightBtn')?.classList.toggle('active', t === 'dark');
    saveState();
  },
  toast: showToast
};

function boot(){
  const app = document.getElementById('app');
  loadAccounts();
  if(!loadState()){ seedIfEmpty(); }
  // expose globals for inline handlers
  window.App = App;
  window.Auth = { openLogin, closeLogin, showAuth, setSignupRole, login, signup, logout };
  window.Store = Store;
  window.POS = POS;
  window.Inventory = Inventory;
  window.Console = Console;
  window.state = state;
  window.__monthly__ = monthly;
  window.__TAX__ = TAX_RATE;

  initAuth(() => Console.enter());
  renderAuthModal(app);
  Store.mount(app);

  // initial theme + public rendering
  App.setTheme(state.theme);
  Store.render();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
