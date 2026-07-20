// js/views/console.js — management console (POS, inventory, reports, settings)

import { CATEGORY_COLORS, EMOJIS, TAX_RATE, PERMISSIONS, TAB_LABELS, icons, state } from '../state.js';
import { $, $$, showToast, lineChart, donutChart, money, setHTML, setText } from '../ui.js';
import { posCard, kpiStrip, emojiPicker, stockPill, brandMark } from '../components.js';
import { findProduct, uniqueCategories, addProduct, updateProduct, deleteProduct, restock, saveState, loadState } from '../store.js';
import { canAccess, logout } from '../auth.js';

export const POS = {
  render(){
    const grid = $('#productGrid');
    const q = state.search.trim().toLowerCase();
    const items = state.products.filter(p =>
      (state.selectedCategory === 'All' || p.category === state.selectedCategory) &&
      p.name.toLowerCase().includes(q));
    grid.innerHTML = items.map(posCard).join('') ||
      `<div style="color:var(--text-faint); padding:20px;">No products match your search.</div>`;
    $('#kpiStrip').innerHTML = kpiStrip();
    this.renderCatList();
  },
  renderCatList(){
    const cats = ['All', ...uniqueCategories()];
    setHTML('catList', cats.map(c => {
      const color = c === 'All' ? 'var(--text-dim)' : (CATEGORY_COLORS[c] || 'var(--accent)');
      const active = state.selectedCategory === c ? 'active' : '';
      return `<div class="cat-item ${active}" onclick="POS.selectCategory('${c.replace(/'/g,"\\'")}')">
        <span class="dot" style="background:${color}"></span>${c}</div>`;
    }).join(''));
  },
  selectCategory(c){
    state.selectedCategory = c;
    this.renderCatList(); this.render();
  },
  addToCart(id){
    const p = findProduct(id);
    if(!p || p.stock <= 0){ showToast('Out of stock'); return; }
    const inCart = state.cart[id] || 0;
    if(inCart >= p.stock){ showToast('No more stock available'); return; }
    state.cart[id] = inCart + 1;
    this.renderCart();
  },
  changeQty(id, delta){
    const p = findProduct(id);
    let q = (state.cart[id] || 0) + delta;
    if(q <= 0) delete state.cart[id];
    else if(q > p.stock){ showToast('No more stock available'); return; }
    else state.cart[id] = q;
    this.renderCart();
  },
  cartSubtotal(){
    return Object.keys(state.cart).reduce((s, id) => {
      const p = findProduct(id);
      return s + (p ? p.price * state.cart[id] : 0);
    }, 0);
  },
  renderCart(){
    const ids = Object.keys(state.cart);
    const lines = $('#cartLines');
    if(ids.length === 0){
      lines.innerHTML = `<div class="cart-empty">Your cart is empty</div>`;
    } else {
      lines.innerHTML = ids.map(id => {
        const p = findProduct(id);
        const qty = state.cart[id];
        return `<div class="cart-line">
          <div><span class="name">${p.emoji || ''} ${p.name}</span><span class="cat">${p.category}</span></div>
          <div class="qty-ctrl">
            <button onclick="POS.changeQty(${p.id},-1)">−</button>
            <span class="mono" style="min-width:16px; text-align:center;">${qty}</span>
            <button onclick="POS.changeQty(${p.id},1)">+</button>
          </div>
          <div class="mono">${money(p.price*qty)}</div>
        </div>`;
      }).join('');
    }
    const sub = this.cartSubtotal();
    const discount = parseFloat($('#discountInput')?.value) || 0;
    const discAmt = sub * (Math.min(100, Math.max(0, discount)) / 100);
    const taxed = (sub - discAmt) * TAX_RATE;
    setText('cartSubtotal', money(sub));
    setText('cartTax', money(taxed));
    setText('cartTotal', money(sub - discAmt + taxed));
  },
  checkout(){
    const ids = Object.keys(state.cart);
    if(ids.length === 0){ showToast('Your cart is empty'); return; }
    const sub = this.cartSubtotal();
    const discount = parseFloat($('#discountInput').value) || 0;
    const discAmt = sub * (Math.min(100, Math.max(0, discount)) / 100);
    const taxed = (sub - discAmt) * TAX_RATE;
    const total = sub - discAmt + taxed;
    const method = $('#payMethod').value;
    let count = 0;
    ids.forEach(id => {
      const p = findProduct(id);
      const qty = state.cart[id];
      p.stock = Math.max(0, p.stock - qty);
      count += qty;
      state.sales.byProduct[p.name] = (state.sales.byProduct[p.name] || 0) + qty;
      state.sales.byCategory[p.category] = (state.sales.byCategory[p.category] || 0) + qty;
    });
    state.sales.total += total;
    state.sales.itemsSold += count;
    state.transactions.unshift({ receipt:'IE-' + Date.now().toString().slice(-6), time:new Date().toLocaleString(), items:count, method, total });
    state.cart = {};
    $('#discountInput').value = 0;
    this.renderCart(); this.render();
    if(canAccess('reports')) renderReports();
    saveState();
    showToast(`Payment complete via ${method} — ${money(total)}`);
  }
};

export const Inventory = {
  selectEmoji(e){ state.selectedEmoji = e; setHTML('emojiPicker', emojiPicker()); },
  render(){
    setHTML('restockSelect', state.products.map(p => `<option value="${p.id}">${p.name}</option>`).join(''));
    setHTML('catOptions', uniqueCategories().map(c => `<option value="${c}">`).join(''));
    this.renderAlerts(); this.renderTable();
  },
  renderAlerts(){
    const low = state.products.filter(p => p.stock <= state.threshold);
    const zone = $('#alertZone');
    if(low.length === 0){ zone.innerHTML = ''; return; }
    zone.innerHTML = low.map(p => `
      <div class="alert-banner">
        <div class="msg">${icons.alert()}
          <span><strong>${p.name}</strong> is low on stock (${p.stock} left)</span></div>
        <button class="btn btn-ochre btn-sm" onclick="Inventory.quickFocusRestock(${p.id})">Restock</button>
      </div>`).join('');
  },
  quickFocusRestock(id){
    $('#restockSelect').value = id;
    $('#restockQty').focus();
    $('#restockQty').scrollIntoView({ behavior:'smooth', block:'center' });
  },
  renderTable(){
    const q = state.invSearch.trim().toLowerCase();
    const items = state.products.filter(p => p.name.toLowerCase().includes(q));
    const maxStock = Math.max(30, ...state.products.map(p => p.stock));
    setHTML('invBody', items.map(p => {
      const color = CATEGORY_COLORS[p.category] || 'var(--accent)';
      const st = p.stock <= state.threshold ? { label:'Low Stock', color:'var(--berry)' } : { label:'In Stock', color:'var(--accent)' };
      const pct = Math.min(100, Math.round((p.stock / maxStock) * 100));
      return `<tr>
        <td class="prod-name">${p.name}</td>
        <td><span class="tag" style="background:color-mix(in srgb, ${color} 20%, transparent); color:${color}"><span class="dot" style="background:${color}"></span>${p.category}</span></td>
        <td class="mono">${money(p.price)}</td>
        <td><div class="stock-cell"><span class="mono">${p.stock} units</span>
          <div class="stock-bar-track"><div class="stock-bar-fill" style="width:${pct}%; background:${st.color}"></div></div></div></td>
        <td><span class="status-pill" style="color:${st.color}">${st.label}</span></td>
        <td class="row-actions">
          <button class="icon-btn" title="Edit" onclick="Inventory.editProduct(${p.id})">${icons.edit()}</button>
          <button class="icon-btn" title="Delete" onclick="Inventory.deleteProduct(${p.id})">${icons.trash()}</button>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="6" style="color:var(--text-faint); text-align:center; padding:20px;">No matching products.</td></tr>`);
  },
  restock(){
    const id = parseInt($('#restockSelect').value);
    const qty = parseInt($('#restockQty').value) || 0;
    const p = findProduct(id);
    if(!p || qty <= 0){ showToast('Enter a valid quantity'); return; }
    restock(id, qty);
    showToast(`Restocked ${p.name} (+${qty})`);
    this.render(); POS.render();
  },
  addOrUpdate(){
    const name = $('#pName').value.trim();
    const category = $('#pCategory').value.trim();
    const price = parseFloat($('#pPrice').value);
    const stock = parseInt($('#pStock').value);
    const emoji = state.selectedEmoji;
    if(!name || !category || isNaN(price) || isNaN(stock)){ showToast('Fill in all product fields'); return; }
    if(state.editingId){
      updateProduct(state.editingId, { name, category, price, stock, emoji });
      showToast('Product updated'); this.cancelEdit();
    } else {
      addProduct({ name, category, price, stock, emoji });
      showToast('Product added'); this.clearForm();
    }
    this.render(); POS.render();
  },
  clearForm(){
    ['pName','pCategory','pPrice','pStock'].forEach(id => { const n = document.getElementById(id); if(n) n.value = ''; });
    state.selectedEmoji = EMOJIS[0]; setHTML('emojiPicker', emojiPicker());
  },
  editProduct(id){
    const p = findProduct(id);
    state.editingId = id;
    $('#pName').value = p.name; $('#pCategory').value = p.category;
    $('#pPrice').value = p.price; $('#pStock').value = p.stock;
    state.selectedEmoji = p.emoji || EMOJIS[0];
    setHTML('emojiPicker', emojiPicker());
    setText('addFormTitle', 'Edit Product');
    $('#addProductBtn').textContent = 'Update Product';
    $('#cancelEditBtn').classList.remove('hidden');
    $('#pName').scrollIntoView({ behavior:'smooth', block:'center' });
  },
  cancelEdit(){
    state.editingId = null;
    setText('addFormTitle', 'Add New Product');
    $('#addProductBtn').textContent = 'Add Product';
    $('#cancelEditBtn').classList.add('hidden');
    this.clearForm();
  },
  deleteProduct(id){
    const p = findProduct(id);
    if(!confirm(`Remove "${p.name}" from inventory?`)) return;
    deleteProduct(id);
    showToast('Product removed');
    this.render(); POS.render();
  }
};

// ---- Reports ----
function renderReports(){
  setText('statTotal', money(state.sales.total));
  setText('statItems', state.sales.itemsSold);
  const topP = Object.entries(state.sales.byProduct).sort((a,b)=>b[1]-a[1])[0];
  const topC = Object.entries(state.sales.byCategory).sort((a,b)=>b[1]-a[1])[0];
  setText('statTopProduct', topP ? topP[0] : '—');
  setText('statTopCategory', topC ? topC[0] : '—');
  setHTML('lineChart', lineChart(window.__monthly__ || []));
  const { svg, legend } = donutChart(state.products);
  setHTML('donutChart', svg);
  setHTML('donutLegend', legend);
  renderSalesHistory();
}
function renderSalesHistory(){
  const body = $('#salesBody');
  if(!state.transactions.length){
    body.innerHTML = `<tr><td colspan="5" style="color:var(--text-faint); text-align:center; padding:20px;">No sales recorded yet.</td></tr>`;
    return;
  }
  body.innerHTML = state.transactions.slice(0,30).map(t => `
    <tr>
      <td class="mono" style="font-weight:600;">${t.receipt}</td>
      <td style="color:var(--text-dim); font-size:12.5px;">${t.time}</td>
      <td>${t.items} item${t.items!==1?'s':''}</td>
      <td><span class="tag" style="background:color-mix(in srgb, var(--ochre) 18%, transparent); color:var(--ochre)">${t.method}</span></td>
      <td class="mono" style="font-weight:600;">${money(t.total)}</td>
    </tr>`).join('');
}
function exportSalesCSV(){
  if(!state.transactions.length){ showToast('No sales to export'); return; }
  const header = 'Receipt,Time,Items,Payment,Total\n';
  const rows = state.transactions.map(t => `${t.receipt},"${t.time}",${t.items},${t.method},${t.total.toFixed(2)}`).join('\n');
  const blob = new Blob([header + rows], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'indulge-sales-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('Sales exported to CSV');
}

// ---- Settings ----
function savePreferences(){
  const t = parseInt($('#thresholdField').value) || 5;
  state.threshold = t;
  showToast('Preferences saved');
  saveState(); Inventory.render();
}

// ---- Console orchestration ----
export const Console = {
  mount(root){
    const allowed = PERMISSIONS[state.user.role];
    const tabs = allowed.map(p =>
      `<button class="sidebar-tab ${p === 'products' ? 'active' : ''}" data-page="${p}" onclick="Console.switchTab('${p}')">
        <span class="tab-dot" style="background:${p === 'products' ? 'var(--accent)' : 'var(--text-faint)'}"></span>${TAB_LABELS[p]}</button>`).join('');
    root.insertAdjacentHTML('beforeend', `
      <div id="appShell" class="app-shell hidden">
        <div class="app-layout">
          <aside class="sidebar" id="sidebar">
            <div class="sidebar-brand">${brandMark()} <span>Indulge Essentials</span></div>
            <nav class="sidebar-nav" id="sidebarNav">${tabs}</nav>
            <div class="sidebar-foot">
              <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-dim);">
                <span class="user-avatar" id="sidebarAvatar" style="width:28px; height:28px; font-size:12px;">A</span>
                <div>
                  <div style="font-weight:600; color:var(--text);" id="sidebarName">${state.user.name}</div>
                  <span class="role-badge ${state.user.role}" id="sidebarBadge">${state.user.role}</span>
                </div>
              </div>
            </div>
          </aside>
          <div class="main-wrap">
            <header class="top">
              <div class="brand">${brandMark()} <span>Indulge Essentials</span></div>
              <div class="head-right">
                <button class="icon-btn sidebar-toggle" id="sidebarToggle" aria-label="Menu" onclick="Console.toggleSidebar()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                </button>
                <button class="icon-btn" id="themeBtn" onclick="App.toggleTheme()" aria-label="Toggle theme"></button>
                <div class="user-chip" onclick="Console.toggleUserMenu()">
                  <span class="user-avatar" id="userAvatar">A</span>
                  <span id="userLabel">${state.user.name}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>
                </div>
                <div class="user-menu hidden" id="userMenu">
                  <button id="accountSettingsBtn" onclick="Console.switchTab('settings'); Console.toggleUserMenu();">Account settings</button>
                  <button onclick="Console.logout()">Log out</button>
                </div>
              </div>
            </header>
            <main class="content">
              ${this.productsPage()} ${this.inventoryPage()} ${this.reportsPage()} ${this.settingsPage()}
            </main>
          </div>
        </div>
      </div>`);
    // settings access
    $('#accountSettingsBtn').style.display = allowed.includes('settings') ? '' : 'none';
    // close menu on outside click
    document.addEventListener('click', (e) => {
      const menu = $('#userMenu'); const chip = $('.user-chip');
      if(menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !chip.contains(e.target)) menu.classList.add('hidden');
    });
    // close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      const sidebar = $('#sidebar'); const toggle = $('#sidebarToggle');
      if(sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggle.contains(e.target)) sidebar.classList.remove('open');
    });
  },
  toggleSidebar(){ $('#sidebar')?.classList.toggle('open'); },
  productsPage(){
    return `<section id="page-products" class="page">
      <h2 class="page-title">Shop Floor</h2>
      <div class="kpi-strip" id="kpiStrip"></div>
      <div class="pos-grid">
        <div class="search-bar">
          ${icons.search()}
          <input id="productSearch" type="text" placeholder="Search products..." oninput="state.search=this.value; POS.render();" />
        </div>
        <div><div class="label-cap" style="margin-bottom:10px;">Categories</div><div class="cat-list" id="catList"></div></div>
        <div id="productGrid" class="product-grid"></div>
        <div>
          <div class="receipt">
            <h3 style="margin-top:0;">Your Cart</h3>
            <div id="cartLines"></div>
            <div class="cart-subline"><span>Subtotal</span><span id="cartSubtotal" class="mono">$0.00</span></div>
            <div class="cart-line-discount">
              <div class="field" style="margin:0;"><label for="discountInput" style="font-size:10px;">Discount %</label>
                <input id="discountInput" type="number" min="0" max="100" value="0" oninput="POS.renderCart()" /></div>
              <div class="field" style="margin:0;"><label for="payMethod" style="font-size:10px;">Payment</label>
                <select id="payMethod" style="font-family:'Inter',sans-serif;"><option>Cash</option><option>Card</option><option>Mobile</option></select></div>
            </div>
            <div class="cart-subline"><span>Tax (8%)</span><span id="cartTax" class="mono">$0.00</span></div>
            <div class="cart-total"><span>Total</span><span id="cartTotal" class="mono">$0.00</span></div>
            <button class="btn btn-primary" style="width:100%;" onclick="POS.checkout()">Proceed to Payment</button>
          </div>
          <div class="receipt-torn"></div>
        </div>
      </div>
    </section>`;
  },
  inventoryPage(){
    return `<section id="page-inventory" class="page hidden">
      <h2 class="page-title">Inventory Management</h2>
      <div id="alertZone"></div>
      <div class="inv-grid">
        <div class="panel">
          <h3>Restock Products</h3>
          <div class="field"><label for="restockSelect">Select product</label><select id="restockSelect"></select></div>
          <div class="field"><label for="restockQty">Quantity to add</label><input id="restockQty" type="number" min="1" value="10" /></div>
          <button class="btn btn-primary" onclick="Inventory.restock()">Restock Product</button>
        </div>
        <div class="panel">
          <h3 id="addFormTitle">Add New Product</h3>
          <div class="field"><label for="pName">Product name</label><input id="pName" type="text" style="font-family:'Inter',sans-serif;" placeholder="Enter product name" /></div>
          <div class="field"><label>Icon</label><div class="emoji-picker" id="emojiPicker"></div></div>
          <div class="row gap-3">
            <div class="field" style="flex:1;"><label for="pCategory">Category</label><input id="pCategory" list="catOptions" style="font-family:'Inter',sans-serif;" placeholder="Enter category" /><datalist id="catOptions"></datalist></div>
            <div class="field" style="flex:1;"><label for="pPrice">Price ($)</label><input id="pPrice" type="number" min="0" step="0.01" placeholder="0.00" /></div>
          </div>
          <div class="field"><label for="pStock">Initial stock</label><input id="pStock" type="number" min="0" placeholder="10" /></div>
          <div class="row gap-2">
            <button class="btn btn-primary" id="addProductBtn" onclick="Inventory.addOrUpdate()">Add Product</button>
            <button class="btn btn-ghost hidden" id="cancelEditBtn" onclick="Inventory.cancelEdit()">Cancel</button>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="row between" style="margin-bottom:14px;">
          <h3 style="margin:0;">Current Inventory</h3>
          <input id="invSearch" type="text" style="font-family:'Inter',sans-serif; max-width:220px; padding:8px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-alt); color:var(--text);" placeholder="Search inventory..." oninput="state.invSearch=this.value; Inventory.renderTable();" />
        </div>
        <table class="data-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock level</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="invBody"></tbody>
        </table>
      </div>
    </section>`;
  },
  reportsPage(){
    return `<section id="page-reports" class="page hidden">
      <h2 class="page-title">Reports</h2>
      <div class="stat-grid">
        <div class="stat-card">${icons.tag()}<div class="stat-value mono" id="statTotal">$0.00</div><div class="stat-label">Total sales (session)</div></div>
        <div class="stat-card">${icons.box()}<div class="stat-value mono" id="statItems">0</div><div class="stat-label">Items sold</div></div>
        <div class="stat-card">${icons.star()}<div class="stat-value font-display" id="statTopProduct" style="font-size:1.1rem;">—</div><div class="stat-label">Top product</div></div>
        <div class="stat-card">${icons.pie()}<div class="stat-value font-display" id="statTopCategory" style="font-size:1.1rem;">—</div><div class="stat-label">Top category</div></div>
      </div>
      <div class="chart-grid">
        <div class="panel"><h3>Monthly Sales — Historical ($)</h3><div id="lineChart"></div></div>
        <div class="panel"><h3>Inventory Value by Category</h3>
          <div class="row" style="align-items:center; gap:18px;"><div id="donutChart"></div><div id="donutLegend" style="flex:1;"></div></div>
        </div>
      </div>
      <div class="panel" style="margin-top:20px;">
        <div class="row between" style="margin-bottom:14px;">
          <h3 style="margin:0;">Sales History</h3>
          <button class="btn btn-ghost btn-sm" onclick="Console.exportSalesCSV()">Export CSV</button>
        </div>
        <table class="data-table">
          <thead><tr><th>Receipt</th><th>Time</th><th>Items</th><th>Payment</th><th>Total</th></tr></thead>
          <tbody id="salesBody"></tbody>
        </table>
      </div>
    </section>`;
  },
  settingsPage(){
    return `<section id="page-settings" class="page hidden">
      <h2 class="page-title">System Settings</h2>
      <div class="settings-grid">
        <div class="panel">
          <h3>User Profile</h3>
          <div class="profile-top">
            <div class="profile-avatar" id="profileAvatar">A</div>
            <div><div style="font-weight:700;" id="profileName">${state.user.name}</div>
              <div style="font-size:12.5px; color:var(--text-dim);" id="profileEmail">${state.user.email}</div></div>
          </div>
          <div class="field"><label for="fullName">Full name</label><input id="fullName" style="font-family:'Inter',sans-serif;" value="${state.user.name}" /></div>
          <div class="field"><label for="emailField">Email</label><input id="emailField" style="font-family:'Inter',sans-serif;" value="${state.user.email}" /></div>
          <div class="field"><label for="passField">Password</label><input id="passField" type="password" placeholder="Enter new password" /></div>
          <button class="btn btn-primary" onclick="App.toast('Profile updated')">Update Profile</button>
        </div>
        <div class="panel">
          <h3>Appearance</h3>
          <div class="label-cap" style="margin-bottom:8px;">Theme</div>
          <div class="day-night">
            <button id="dayBtn" onclick="App.setTheme('light')">Day</button>
            <button id="nightBtn" class="active" onclick="App.setTheme('dark')">Night</button>
          </div>
          <div class="checkbox-row"><input type="checkbox" id="notifCheck" checked /><label for="notifCheck">Enable low-stock notifications</label></div>
          <div class="field"><label for="thresholdField">Low stock threshold</label><input id="thresholdField" type="number" min="1" value="${state.threshold}" /></div>
          <button class="btn btn-primary" onclick="Console.savePreferences()">Save Preferences</button>
        </div>
        <div class="panel">
          <h3>Database Management</h3>
          <div class="field"><label for="backupFreq">Backup frequency</label>
            <select id="backupFreq" style="font-family:'Inter',sans-serif;"><option>Daily</option><option>Weekly</option><option>Monthly</option></select></div>
          <div class="db-actions">
            <button class="btn btn-ghost" onclick="App.toast('Backup created')">Backup Now</button>
            <button class="btn btn-ghost" onclick="App.toast('Restored from last backup')">Restore</button>
            <button class="btn btn-danger" onclick="Console.clearAllData()">Clear All Data</button>
          </div>
        </div>
      </div>
    </section>`;
  },
  enter(){
    if(!document.getElementById('appShell')) this.mount(document.getElementById('app'));
    $('#publicView')?.classList.add('hidden');
    $('#appShell').classList.remove('hidden');
    $('#userAvatar').textContent = state.user.name[0].toUpperCase();
    $('#sidebarAvatar').textContent = state.user.name[0].toUpperCase();
    const label = $('#userLabel');
    const badge = document.createElement('span');
    badge.className = `role-badge ${state.user.role}`;
    badge.textContent = state.user.role;
    label.insertAdjacentElement('beforebegin', badge);
    const sidebarBadge = $('#sidebarBadge');
    if(sidebarBadge){ sidebarBadge.textContent = state.user.role; sidebarBadge.className = `role-badge ${state.user.role}`; }
    const landing = state.user.role === 'staff' ? 'inventory' : 'products';
    const allowed = PERMISSIONS[state.user.role];
    this.switchTab(allowed.includes(landing) ? landing : allowed[0]);
    this.renderAll();
  },
  switchTab(page){
    if(!canAccess(page)){
      showToast('You do not have access to this section');
      page = PERMISSIONS[state.user.role][0];
    }
    $$('.page').forEach(p => p.classList.add('hidden'));
    $('#page-' + page).classList.remove('hidden');
    $$('.sidebar-tab').forEach(b => {
      const isActive = b.dataset.page === page;
      b.classList.toggle('active', isActive);
      const dot = b.querySelector('.tab-dot');
      if(dot) dot.style.background = isActive ? 'var(--accent)' : 'var(--text-faint)';
    });
    if(page === 'reports') renderReports();
    if(page === 'inventory') Inventory.render();
    if(page === 'products') POS.render();
    // close mobile sidebar
    $('#sidebar')?.classList.remove('open');
  },
  toggleUserMenu(){ $('#userMenu').classList.toggle('hidden'); },
  logout(){
    logout();
    $('#appShell').classList.add('hidden');
    $('#publicView').classList.remove('hidden');
  },
  savePreferences,
  exportSalesCSV,
  clearAllData(){
    if(!confirm('This will permanently remove all products from inventory. Continue?')) return;
    state.products = []; state.cart = {}; state.transactions = [];
    state.sales = { total:0, itemsSold:0, byProduct:{}, byCategory:{} };
    saveState(); Inventory.render(); POS.render(); renderReports();
    showToast('All data cleared');
  },
  renderAll(){
    POS.render(); POS.renderCart(); Inventory.render();
  }
};
