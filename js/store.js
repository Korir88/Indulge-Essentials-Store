// js/store.js — persistence, accounts and data operations

import { STORAGE_KEY, ACCOUNTS_KEY, defaultProducts, state } from './state.js';

const ACCOUNTS = {
  admin: { password:'admin123', name:'Admin User', email:'admin@indulge.store', role:'admin' },
  staff: { password:'staff123', name:'Store Staff', email:'staff@indulge.store', role:'staff' }
};

// ---------- persistence ----------
export function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: state.theme,
      threshold: state.threshold,
      products: state.products,
      nextId: state.nextId,
      sales: state.sales,
      transactions: state.transactions
    }));
  }catch(e){ /* storage unavailable */ }
}
export function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    state.theme = data.theme || 'dark';
    state.threshold = data.threshold || 5;
    state.products = data.products || [];
    state.nextId = data.nextId || 9;
    state.sales = data.sales || { total:0, itemsSold:0, byProduct:{}, byCategory:{} };
    state.transactions = data.transactions || [];
    return state.products.length > 0;
  }catch(e){ return false; }
}

// ---------- accounts ----------
export function saveAccounts(){
  try{ localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(ACCOUNTS)); }catch(e){}
}
export function loadAccounts(){
  try{
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if(raw){ Object.assign(ACCOUNTS, JSON.parse(raw)); }
  }catch(e){}
}
export function getAccount(username){ return ACCOUNTS[username]; }
export function accountExists(username){ return !!ACCOUNTS[username]; }
export function createAccount(username, data){
  ACCOUNTS[username] = data;
  saveAccounts();
}

// ---------- product helpers ----------
export const uniqueCategories = () =>
  [...new Set(state.products.map(p => p.category))];

export const findProduct = (id) => state.products.find(p => Number(p.id) === Number(id));

export function addProduct({ name, category, price, stock, emoji }){
  const p = { id: state.nextId++, name, category, price, stock, emoji };
  state.products.push(p);
  saveState();
  return p;
}
export function updateProduct(id, data){
  const p = findProduct(id);
  if(p) Object.assign(p, data);
  saveState();
  return p;
}
export function deleteProduct(id){
  state.products = state.products.filter(p => p.id !== id);
  delete state.cart[id];
  saveState();
}
export function restock(id, qty){
  const p = findProduct(id);
  if(p) p.stock += qty;
  saveState();
}
export function seedIfEmpty(){
  if(state.products.length === 0){
    state.products = JSON.parse(JSON.stringify(defaultProducts));
    state.nextId = 9;
    saveState();
  }
}
