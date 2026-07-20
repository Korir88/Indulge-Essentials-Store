// js/views/storefront.js — public storefront + client cart

import { CATEGORY_COLORS, icons, state } from '../state.js';
import { $, showToast } from '../ui.js';
import { storeCard, brandMark } from '../components.js';
import { findProduct, uniqueCategories } from '../store.js';
import { openLogin } from '../auth.js';

export const Store = {
  mount(root){
    root.insertAdjacentHTML('beforeend', `
      <div id="publicView" class="public-view">
        <header class="top public-header">
          <div class="brand" onclick="window.scrollTo({top:0,behavior:'smooth'})">
            ${brandMark()} <span>Indulge Essentials</span>
          </div>
          <div class="head-right">
            <button class="icon-btn" id="themeBtnPublic" onclick="App.toggleTheme()" aria-label="Toggle theme"></button>
            <button class="btn btn-primary btn-sm" onclick="Auth.openLogin()">
              ${icons.user()} Staff Login
            </button>
          </div>
        </header>
        <main class="content store-main">
          <div class="search-bar inline wide">
            ${icons.search()}
            <input id="publicSearch" type="text" placeholder="Search the whole store..." oninput="Store.onSearch()" />
          </div>
          <section class="store-section" id="hotCategoriesSection">
            <div class="section-head"><h2 class="section-title">Hot Categories</h2><span class="section-sub">Shop by what's trending</span></div>
            <div class="cat-cards" id="hotCategories"></div>
          </section>
          <section class="store-section" id="whatsNewSection">
            <div class="section-head"><h2 class="section-title">What's New</h2><span class="section-sub">Fresh arrivals in the store</span></div>
            <div class="product-row" id="whatsNewGrid"></div>
          </section>
          <section class="store-section" id="allProductsSection">
            <div class="section-head"><h2 class="section-title">Browse Everything</h2><span class="section-sub">Organized by category</span></div>
            <div id="categorySections"></div>
          </section>
          <section class="store-section" id="mayAlsoLikeSection">
            <div class="section-head"><h2 class="section-title">You May Also Like</h2><span class="section-sub">Picked for you</span></div>
            <div class="product-row" id="mayAlsoLikeGrid"></div>
          </section>
        </main>
        <div class="cart-drawer hidden" id="cartDrawer">
          <div class="cart-drawer-head">
            <h3 style="margin:0;">Your Cart</h3>
            <button class="icon-btn" onclick="Store.toggleCart()" aria-label="Close">&times;</button>
          </div>
          <div class="cart-drawer-body" id="clientCartLines"></div>
          <div class="cart-drawer-foot">
            <div class="cart-subline"><span>Subtotal</span><span id="clientCartSubtotal" class="mono">$0.00</span></div>
            <div class="cart-subline"><span>Tax (8%)</span><span id="clientCartTax" class="mono">$0.00</span></div>
            <div class="cart-total"><span>Total</span><span id="clientCartTotal" class="mono">$0.00</span></div>
            <button class="btn btn-primary" style="width:100%;" onclick="Store.checkout()">Checkout</button>
          </div>
        </div>
        <div class="cart-scrim hidden" id="cartScrim" onclick="Store.toggleCart()"></div>
        <button class="cart-fab" id="cartFab" onclick="Store.toggleCart()">
          ${icons.cart()}
          <span class="cart-fab-count" id="cartFabCount">0</span>
        </button>
        <footer class="store-foot">
          <div class="brand">${brandMark()} <span>Indulge Essentials</span></div>
          <p>&copy; 2026 Indulge Essentials. Staff? <a href="#" onclick="Auth.openLogin()">Sign in to the console</a>.</p>
        </footer>
      </div>`);
    this.render();
  },

  render(){
    const q = state.search.trim().toLowerCase();
    const searching = q.length > 0;
    const cats = uniqueCategories();

    // Hot categories
    const hotCats = cats.filter(c => state.products.some(p => p.category === c && p.hot)).slice(0,4);
    $('#hotCategories').innerHTML = (hotCats.length ? hotCats : cats).map(c => {
      const color = CATEGORY_COLORS[c] || 'var(--accent)';
      const count = state.products.filter(p => p.category === c).length;
      const sample = state.products.find(p => p.category === c);
      return `<div class="cat-card" style="--cc:${color}" onclick="Store.filterByCategory('${c.replace(/'/g,"\\'")}')">
        <div class="cat-card-emoji">${sample && sample.emoji ? sample.emoji : '🌿'}</div>
        <div class="cat-card-name">${c}</div>
        <div class="cat-card-count">${count} items</div>
      </div>`;
    }).join('');
    $('#hotCategoriesSection').style.display = searching ? 'none' : '';

    // What's New
    const news = state.products.filter(p => p.isNew && (!searching || p.name.toLowerCase().includes(q)));
    $('#whatsNewGrid').innerHTML = news.length ? news.map(storeCard).join('') : `<div class="empty-note">No new arrivals match your search.</div>`;
    $('#whatsNewSection').style.display = (searching || news.length) ? '' : 'none';

    // All products grouped by category
    const allWrap = $('#categorySections');
    if(searching){
      const matches = state.products.filter(p => p.name.toLowerCase().includes(q));
      allWrap.innerHTML = matches.length ? matches.map(storeCard).join('')
        : `<div class="empty-note">No products found for "${q}".</div>`;
    } else {
      allWrap.innerHTML = cats.map(c => {
        const color = CATEGORY_COLORS[c] || 'var(--accent)';
        const items = state.products.filter(p => p.category === c);
        return `<div class="cat-group">
          <div class="cat-group-head"><span class="cat-group-dot" style="background:${color}"></span>${c}</div>
          <div class="product-row">${items.map(storeCard).join('')}</div>
        </div>`;
      }).join('');
    }

    // You may also like
    const pool = state.products.filter(p => !p.isNew);
    const picks = (pool.length ? pool : state.products).slice().sort(() => Math.random() - 0.5).slice(0,4);
    $('#mayAlsoLikeGrid').innerHTML = picks.map(storeCard).join('');
    $('#mayAlsoLikeSection').style.display = searching ? 'none' : '';
  },

  onSearch(){
    state.search = $('#publicSearch').value;
    this.render();
  },
  filterByCategory(c){
    $('#publicSearch').value = '';
    state.search = '';
    const groups = document.querySelectorAll('.cat-group');
    let target = null;
    groups.forEach(g => {
      if(g.querySelector('.cat-group-head').textContent.trim() === c){ target = g; }
    });
    if(target){
      target.scrollIntoView({ behavior:'smooth', block:'center' });
      target.classList.add('flash');
      setTimeout(() => target.classList.remove('flash'), 900);
    }
    this.render();
  },

  // ----- client cart -----
  clientAdd(id){
    const p = findProduct(id);
    if(!p || p.stock <= 0){ showToast('Out of stock'); return; }
    const inCart = state.clientCart[id] || 0;
    if(inCart >= p.stock){ showToast('No more stock available'); return; }
    state.clientCart[id] = inCart + 1;
    this.render(); this.renderCart(); showToast(`Added ${p.name}`);
  },
  clientChangeQty(id, delta){
    const p = findProduct(id);
    let q = (state.clientCart[id] || 0) + delta;
    if(q <= 0) delete state.clientCart[id];
    else if(q > p.stock){ showToast('No more stock available'); return; }
    else state.clientCart[id] = q;
    this.render(); this.renderCart();
  },
  clientRemove(id){
    delete state.clientCart[id];
    this.render(); this.renderCart();
  },
  toggleCart(){
    const open = $('#cartDrawer').classList.toggle('hidden') === false;
    $('#cartScrim').classList.toggle('hidden', !open);
    if(document.body) document.body.style.overflow = open ? 'hidden' : '';
  },
  clientSubtotal(){
    return Object.keys(state.clientCart).reduce((s, id) => {
      const p = findProduct(id);
      return s + (p ? p.price * state.clientCart[id] : 0);
    }, 0);
  },
  renderCart(){
    const ids = Object.keys(state.clientCart);
    const lines = $('#clientCartLines');
    const count = ids.reduce((s, id) => s + state.clientCart[id], 0);
    $('#cartFabCount').textContent = count;
    $('#cartFab').classList.toggle('has-items', count > 0);
    if(ids.length === 0){
      lines.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Add something you love.</div>`;
    } else {
      lines.innerHTML = ids.map(id => {
        const p = findProduct(id);
        const qty = state.clientCart[id];
        return `<div class="cart-line">
          <div class="cart-prod"><span class="cart-emoji">${p.emoji || '🌿'}</span>
            <div><span class="name">${p.name}</span><span class="cat">${p.category}</span></div></div>
          <div class="qty-ctrl">
            <button onclick="Store.clientChangeQty(${p.id},-1)">−</button>
            <span class="mono">${qty}</span>
            <button onclick="Store.clientChangeQty(${p.id},1)">+</button>
          </div>
          <div class="cart-line-right">
            <div class="mono">$${(p.price*qty).toFixed(2)}</div>
            <button class="link-btn" onclick="Store.clientRemove(${p.id})">Remove</button>
          </div>
        </div>`;
      }).join('');
    }
    const sub = this.clientSubtotal();
    const tax = sub * 0.08;
    $('#clientCartSubtotal').textContent = '$' + sub.toFixed(2);
    $('#clientCartTax').textContent = '$' + tax.toFixed(2);
    $('#clientCartTotal').textContent = '$' + (sub + tax).toFixed(2);
  },
  checkout(){
    const ids = Object.keys(state.clientCart);
    if(ids.length === 0){ showToast('Your cart is empty'); return; }
    const total = this.clientSubtotal() * 1.08;
    showToast(`Order placed — $${total.toFixed(2)}. Thank you!`);
    state.clientCart = {};
    this.render(); this.renderCart(); this.toggleCart();
  }
};
