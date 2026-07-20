const CATEGORY_COLORS = {
  'Clothing':'#8FA6C2',
  'Accessories':'#C2A45E',
  'Personal Care':'#B98CA6',
  'Home Goods':'#6E8F6E',
  'Wellness':'#B8734A'
};

const EMOJIS = ['🌿','👕','🍃','🧴','☕','💧','🧦','🕯️','🧺','🪴','🧼','🍯','🌸','🪥','👜','🛁'];

const TAX_RATE = 0.08;
const STORAGE_KEY = 'indulge-essentials-ledger';

const defaultProducts = [
  {id:1,name:'Organic Cotton T-Shirt',category:'Clothing',price:24.99,stock:15,emoji:'👕',isNew:true,hot:true},
  {id:2,name:'Stainless Steel Water Bottle',category:'Accessories',price:19.99,stock:8,emoji:'💧',isNew:true,hot:true},
  {id:3,name:'Natural Bamboo Toothbrush',category:'Personal Care',price:4.99,stock:25,emoji:'🪥',hot:true},
  {id:4,name:'Handmade Ceramic Mug',category:'Home Goods',price:16.99,stock:12,emoji:'☕',isNew:true},
  {id:5,name:'Essential Oil Diffuser',category:'Wellness',price:29.99,stock:6,emoji:'🕯️',isNew:true,hot:true},
  {id:6,name:'Reusable Shopping Bag',category:'Accessories',price:9.99,stock:30,emoji:'🧺'},
  {id:7,name:'Himalayan Salt Lamp',category:'Home Goods',price:22.99,stock:4,emoji:'🪔',isNew:true},
  {id:8,name:'Organic Lavender Soap',category:'Personal Care',price:7.99,stock:20,emoji:'🧼'}
];

const state = {
  theme:'dark',
  search:'',
  invSearch:'',
  selectedCategory:'All',
  threshold:5,
  editingId:null,
  selectedEmoji:'🌿',
  user:null,
  clientCart:{},
  cart:{},
  products:[],
  nextId:9,
  sales:{total:0, itemsSold:0, byProduct:{}, byCategory:{}},
  transactions:[]
};

const monthly = [
  {m:'Jan', v:3500},{m:'Feb', v:4200},{m:'Mar', v:3750},
  {m:'Apr', v:5100},{m:'May', v:4800},{m:'Jun', v:5600}
];

function leafIcon(color){
  return `<svg width="34" height="34" viewBox="0 0 34 34" fill="none"><path d="M17 3C17 3 8 10 8 19a9 9 0 0 0 18 0c0-9-9-16-9-16Z" fill="${color}" opacity="0.85"/><path d="M17 14v16" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}
function moonIcon(){return `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M13.5 9.5A6 6 0 0 1 6.5 2.5 6 6 0 1 0 13.5 9.5Z" fill="currentColor"/></svg>`;}
function sunIcon(){return `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3.4" fill="currentColor"/><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1M12.7 12.7l-1.1-1.1M4.4 4.4 3.3 3.3"/></g></svg>`;}

function money(n){ return '$' + n.toFixed(2); }

// ---------- persistence ----------
function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme:state.theme,
      threshold:state.threshold,
      products:state.products,
      nextId:state.nextId,
      sales:state.sales,
      transactions:state.transactions
    }));
  }catch(e){ /* storage unavailable */ }
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    state.theme = data.theme || 'dark';
    state.threshold = data.threshold || 5;
    state.products = data.products || [];
    state.nextId = data.nextId || 9;
    state.sales = data.sales || {total:0, itemsSold:0, byProduct:{}, byCategory:{}};
    state.transactions = data.transactions || [];
    return state.products.length > 0;
  }catch(e){ return false; }
}

// ---------- auth & roles ----------
const ACCOUNTS = {
  admin:{password:'admin123', name:'Admin User', email:'admin@indulge.store', role:'admin'},
  staff:{password:'staff123', name:'Store Staff', email:'staff@indulge.store', role:'staff'}
};
const PERMISSIONS = {
  admin:['products','inventory','reports','settings'],
  staff:['products','inventory']
};
const TAB_LABELS = {
  products:'Shop Floor', inventory:'Inventory', reports:'Reports', settings:'Settings'
};
let loginRole = 'admin';

function setRole(r){
  loginRole = r;
  document.getElementById('roleAdmin').classList.toggle('active', r==='admin');
  document.getElementById('roleStaff').classList.toggle('active', r==='staff');
  document.getElementById('loginHint').textContent = '';
  document.getElementById('loginHint').classList.remove('err');
}
function openLogin(){
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('loginUser').focus();
}
function closeLogin(){
  document.getElementById('loginPage').classList.add('hidden');
}
function login(){
  const user = document.getElementById('loginUser').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const hint = document.getElementById('loginHint');
  const acct = ACCOUNTS[user];
  if(!acct || acct.password !== pass){
    hint.textContent = 'Invalid username or password.';
    hint.classList.add('err');
    return;
  }
  state.user = {username:user, ...acct};
  hint.textContent = ''; hint.classList.remove('err');
  document.getElementById('loginPass').value = '';
  closeLogin();
  enterConsole();
}
function enterConsole(){
  const role = state.user.role;
  document.getElementById('publicView').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  // user chip
  document.getElementById('userAvatar').textContent = state.user.name[0].toUpperCase();
  document.getElementById('userLabel').textContent = state.user.name;
  document.getElementById('profileAvatar').textContent = state.user.name[0].toUpperCase();
  document.getElementById('profileName').textContent = state.user.name;
  document.getElementById('profileEmail').textContent = state.user.email;
  // label role
  const label = document.getElementById('userLabel');
  label.insertAdjacentHTML('beforebegin', `<span class="role-badge ${role}">${role}</span>`);
  // settings access
  const allowed = PERMISSIONS[role];
  document.getElementById('accountSettingsBtn').style.display = allowed.includes('settings') ? '' : 'none';
  renderTabs(role);
  // default landing page
  const landing = role==='staff' ? 'inventory' : 'products';
  const firstAllowed = allowed.find(p=>TAB_LABELS[p]) || 'products';
  switchTab(allowed.includes(landing) ? landing : firstAllowed);
  renderAll();
}
function renderTabs(role){
  const allowed = PERMISSIONS[role];
  const nav = document.getElementById('tabsNav');
  nav.innerHTML = allowed.map(p=>`<button class="tab-btn" data-page="${p}" onclick="switchTab('${p}')">${TAB_LABELS[p]}</button>`).join('');
}
function logout(){
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('publicView').classList.remove('hidden');
  document.getElementById('userMenu').classList.add('hidden');
  state.user = null;
  const badge = document.querySelector('.role-badge');
  if(badge) badge.remove();
  showToast('Signed out');
}
function toggleUserMenu(){ document.getElementById('userMenu').classList.toggle('hidden'); }
function scrollTop(){ window.scrollTo({top:0, behavior:'smooth'}); }

document.addEventListener('DOMContentLoaded', ()=>{
  if(!loadState()){
    state.products = JSON.parse(JSON.stringify(defaultProducts));
    state.nextId = 9;
    saveState();
  }
  renderEmojiPicker();
  setTheme(state.theme);
  document.getElementById('thresholdField').value = state.threshold;
  renderPublicStorefront();
  renderClientCart();
  // wire public theme button to mirror console theme
  document.getElementById('themeBtnPublic').innerHTML = state.theme==='dark' ? sunIcon() : moonIcon();
  // close login on overlay click
  document.getElementById('loginPage').addEventListener('click', (e)=>{
    if(e.target.id==='loginPage') closeLogin();
  });
  document.getElementById('loginPass').addEventListener('keydown', (e)=>{ if(e.key==='Enter') login(); });
});

// ---------- theme ----------
function setTheme(t){
  state.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  const icon = t==='dark' ? sunIcon() : moonIcon();
  document.getElementById('themeBtn').innerHTML = icon;
  const pub = document.getElementById('themeBtnPublic');
  if(pub) pub.innerHTML = icon;
  document.getElementById('dayBtn').classList.toggle('active', t==='light');
  document.getElementById('nightBtn').classList.toggle('active', t==='dark');
  saveState();
}
function toggleTheme(){ setTheme(state.theme==='dark' ? 'light' : 'dark'); }

// ---------- tabs ----------
function switchTab(page){
  // enforce role permissions
  if(state.user){
    const allowed = PERMISSIONS[state.user.role];
    if(!allowed.includes(page)){
      showToast('You do not have access to this section');
      const fallback = allowed.find(p=>TAB_LABELS[p]) || 'products';
      page = fallback;
    }
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
  if(page==='reports') renderReports();
  if(page==='inventory') renderInventoryPage();
  if(page==='products') renderProducts();
}

// ---------- toast ----------
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}

// ---------- categories / products ----------
function uniqueCategories(){
  return [...new Set(state.products.map(p=>p.category))];
}
function renderCatList(){
  const cats = ['All', ...uniqueCategories()];
  const list = document.getElementById('catList');
  list.innerHTML = cats.map(c=>{
    const color = c==='All' ? 'var(--text-dim)' : (CATEGORY_COLORS[c]||'var(--accent)');
    const active = state.selectedCategory===c ? 'active' : '';
    return `<div class="cat-item ${active}" onclick="selectCategory('${c.replace(/'/g,"\\'")}')">
      <span class="dot" style="background:${color}"></span>${c}
    </div>`;
  }).join('');
}
function selectCategory(c){
  state.selectedCategory=c;
  renderCatList();
  renderProducts();
  renderPublicStorefront();
}

function renderEmojiPicker(){
  const wrap = document.getElementById('emojiPicker');
  if(!wrap) return;
  wrap.innerHTML = EMOJIS.map(e=>`<button type="button" class="${e===state.selectedEmoji?'active':''}" onclick="selectEmoji('${e}')">${e}</button>`).join('');
}
function selectEmoji(e){
  state.selectedEmoji = e;
  renderEmojiPicker();
}

function renderKpiStrip(){
  const totalStock = state.products.reduce((s,p)=>s+p.stock,0);
  const lowCount = state.products.filter(p=>p.stock<=state.threshold).length;
  const invValue = state.products.reduce((s,p)=>s+p.price*p.stock,0);
  const data = [
    {ic:leafIcon('var(--accent)'), v:state.products.length, l:'Products'},
    {ic:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7h18l-1.5 12a2 2 0 0 1-2 1.8H6.5A2 2 0 0 1 4.5 19L3 7Z" stroke="currentColor" stroke-width="1.6"/><path d="M8 7a4 4 0 0 1 8 0" stroke="currentColor" stroke-width="1.6"/></svg>`, v:totalStock, l:'Units in stock'},
    {ic:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.8 6.2.6-4.6 4.3 1.3 6.3L12 16.8l-5.5 3.2 1.3-6.3-4.6-4.3 6.2-.6L12 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`, v:lowCount, l:'Low stock'},
    {ic:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.6"/></svg>`, v:money(invValue), l:'Inventory value'}
  ];
  document.getElementById('kpiStrip').innerHTML = data.map(d=>`
    <div class="kpi">
      <div class="kpi-ic">${d.ic}</div>
      <div><div class="kpi-v">${d.v}</div><div class="kpi-l">${d.l}</div></div>
    </div>`).join('');
}

function renderProducts(){
  renderCatList();
  const grid = document.getElementById('productGrid');
  const q = state.search.trim().toLowerCase();
  const items = state.products.filter(p=>
    (state.selectedCategory==='All' || p.category===state.selectedCategory) &&
    p.name.toLowerCase().includes(q)
  );
  grid.innerHTML = items.map(p=>{
    const color = CATEGORY_COLORS[p.category] || '#8FBE8A';
    const out = p.stock<=0;
    return `<div class="product-card">
      <div class="product-band" style="background:${color}">${p.category}</div>
      <div class="product-art">${p.emoji ? `<span class="emoji">${p.emoji}</span>` : leafIcon(color)}</div>
      <div class="product-body">
        <h4>${p.name}</h4>
        <div class="product-price mono">${money(p.price)}</div>
      </div>
      <button class="btn btn-primary" onclick="addToCart(${p.id})" ${out?'disabled style="opacity:.5; cursor:not-allowed;"':''}>${out?'Out of Stock':'Add to Cart'}</button>
    </div>`;
  }).join('') || `<div style="color:var(--text-faint); padding:20px;">No products match your search.</div>`;
  renderKpiStrip();
}

// ---------- public storefront (no login) ----------
function stockPill(p){
  if(p.stock<=0) return `<span class="stock-pill out">Out of stock</span>`;
  if(p.stock<=state.threshold) return `<span class="stock-pill low">${p.stock} left</span>`;
  return `<span class="stock-pill in">In stock</span>`;
}
function publicCard(p){
  const color = CATEGORY_COLORS[p.category] || '#8FBE8A';
  const out = p.stock<=0;
  const qty = state.clientCart[p.id]||0;
  const badge = p.isNew ? `<span class="card-flag new">New</span>` : (p.hot ? `<span class="card-flag hot">Hot</span>` : '');
  return `<div class="product-card">
    ${badge}
    <div class="product-band" style="background:${color}">${p.category}</div>
    <div class="product-art">${p.emoji ? `<span class="emoji">${p.emoji}</span>` : leafIcon(color)}</div>
    <div class="product-body">
      <h4>${p.name}</h4>
      <div class="price-row">
        <div class="product-price mono">${money(p.price)}</div>
        ${stockPill(p)}
      </div>
      <div class="prod-actions">
        ${qty>0 ? `<div class="qty-ctrl">
            <button onclick="clientChangeQty(${p.id},-1)">−</button>
            <span class="mono">${qty}</span>
            <button onclick="clientChangeQty(${p.id},1)">+</button>
          </div>` : `<button class="btn btn-primary add-btn" onclick="clientAdd(${p.id})" ${out?'disabled style="opacity:.5;cursor:not-allowed;"':''}>${out?'Out of Stock':'Add to Cart'}</button>`}
      </div>
    </div>
  </div>`;
}
function renderPublicStorefront(){
  const q = state.search.trim().toLowerCase();
  const searching = q.length>0;

  // Hot categories
  const cats = uniqueCategories();
  const hotWrap = document.getElementById('hotCategories');
  const hotCats = cats.filter(c=>state.products.some(p=>p.category===c && p.hot)).slice(0,4);
  hotWrap.innerHTML = (hotCats.length?hotCats:cats).map(c=>{
    const color = CATEGORY_COLORS[c]||'var(--accent)';
    const count = state.products.filter(p=>p.category===c).length;
    const sample = state.products.find(p=>p.category===c);
    return `<div class="cat-card" style="--cc:${color}" onclick="filterByCategory('${c.replace(/'/g,"\\'")}')">
      <div class="cat-card-emoji">${sample && sample.emoji ? sample.emoji : '🌿'}</div>
      <div class="cat-card-name">${c}</div>
      <div class="cat-card-count">${count} items</div>
    </div>`;
  }).join('');

  // What's New
  const news = state.products.filter(p=>p.isNew && (!searching || p.name.toLowerCase().includes(q)));
  document.getElementById('whatsNewGrid').innerHTML = news.length ? news.map(publicCard).join('')
    : `<div class="empty-note">No new arrivals match your search.</div>`;
  document.getElementById('whatsNewSection').style.display = (searching || news.length) ? '' : 'none';

  // All products grouped by category
  const allWrap = document.getElementById('categorySections');
  if(searching){
    const matches = state.products.filter(p=>p.name.toLowerCase().includes(q));
    allWrap.innerHTML = matches.length ? matches.map(publicCard).join('')
      : `<div class="empty-note">No products found for "${q}".</div>`;
  } else {
    allWrap.innerHTML = cats.map(c=>{
      const items = state.products.filter(p=>p.category===c);
      const color = CATEGORY_COLORS[c]||'var(--accent)';
      return `<div class="cat-group">
        <div class="cat-group-head"><span class="cat-group-dot" style="background:${color}"></span>${c}</div>
        <div class="product-row">${items.map(publicCard).join('')}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('allProductsSection').style.display = (news.length===state.products.length && !searching) ? '' : '';

  // You may also like (random-ish pick excluding new)
  const pool = state.products.filter(p=>!p.isNew);
  const picks = (pool.length?pool:state.products).slice().sort(()=>Math.random()-0.5).slice(0,4);
  document.getElementById('mayAlsoLikeGrid').innerHTML = picks.map(publicCard).join('');
  document.getElementById('mayAlsoLikeSection').style.display = searching ? 'none' : '';

  // Hot categories + all products hidden during search focus handled above
  document.getElementById('hotCategoriesSection').style.display = searching ? 'none' : '';
}
function filterByCategory(c){
  document.getElementById('publicSearch').value = '';
  state.search = '';
  const sec = document.getElementById('allProductsSection');
  sec.scrollIntoView({behavior:'smooth', block:'start'});
  // briefly highlight the group
  const groups = document.querySelectorAll('.cat-group');
  groups.forEach(g=>{
    if(g.querySelector('.cat-group-head').textContent.trim()===c){
      g.style.scrollMarginTop = '80px';
      g.scrollIntoView({behavior:'smooth', block:'center'});
      g.classList.add('flash'); setTimeout(()=>g.classList.remove('flash'),900);
    }
  });
}
function onPublicSearch(){
  renderPublicStorefront();
}

// ---------- cart ----------
function addToCart(id){
  const p = state.products.find(x=>x.id===id);
  if(!p || p.stock<=0){ showToast('Out of stock'); return; }
  const inCart = state.cart[id]||0;
  if(inCart >= p.stock){ showToast('No more stock available'); return; }
  state.cart[id] = inCart + 1;
  renderCart();
}
function changeQty(id, delta){
  const p = state.products.find(x=>x.id===id);
  let q = (state.cart[id]||0) + delta;
  if(q<=0){ delete state.cart[id]; }
  else if(q>p.stock){ showToast('No more stock available'); return; }
  else { state.cart[id]=q; }
  renderCart();
}
function cartSubtotal(){
  const ids = Object.keys(state.cart);
  return ids.reduce((sum,id)=>{
    const p = state.products.find(x=>x.id==id);
    return sum + p.price*state.cart[id];
  },0);
}
function renderCart(){
  const lines = document.getElementById('cartLines');
  const ids = Object.keys(state.cart);
  if(ids.length===0){
    lines.innerHTML = `<div class="cart-empty">Your cart is empty</div>`;
  } else {
    lines.innerHTML = ids.map(id=>{
      const p = state.products.find(x=>x.id==id);
      const qty = state.cart[id];
      return `<div class="cart-line">
        <div><span class="name">${p.emoji||''} ${p.name}</span><span class="cat">${p.category}</span></div>
        <div class="qty-ctrl">
          <button onclick="changeQty(${p.id},-1)">−</button>
          <span class="mono" style="min-width:16px; text-align:center;">${qty}</span>
          <button onclick="changeQty(${p.id},1)">+</button>
        </div>
        <div class="mono">${money(p.price*qty)}</div>
      </div>`;
    }).join('');
  }
  const sub = cartSubtotal();
  const discount = parseFloat(document.getElementById('discountInput')?.value) || 0;
  const discAmt = sub * (Math.min(100,Math.max(0,discount))/100);
  const taxed = (sub - discAmt) * TAX_RATE;
  const total = sub - discAmt + taxed;
  document.getElementById('cartSubtotal').textContent = money(sub);
  document.getElementById('cartTax').textContent = money(taxed);
  document.getElementById('cartTotal').textContent = money(total);
}
function checkout(){
  const ids = Object.keys(state.cart);
  if(ids.length===0){ showToast('Your cart is empty'); return; }
  const sub = cartSubtotal();
  const discount = parseFloat(document.getElementById('discountInput').value) || 0;
  const discAmt = sub * (Math.min(100,Math.max(0,discount))/100);
  const taxed = (sub - discAmt) * TAX_RATE;
  const total = sub - discAmt + taxed;
  const method = document.getElementById('payMethod').value;
  let count = 0;
  const items = ids.map(id=>{
    const p = state.products.find(x=>x.id==id);
    const qty = state.cart[id];
    p.stock = Math.max(0, p.stock - qty);
    count += qty;
    state.sales.byProduct[p.name] = (state.sales.byProduct[p.name]||0) + qty;
    state.sales.byCategory[p.category] = (state.sales.byCategory[p.category]||0) + qty;
    return {name:p.name, qty, price:p.price};
  });
  state.sales.total += total;
  state.sales.itemsSold += count;
  const receipt = 'IE-' + Date.now().toString().slice(-6);
  state.transactions.unshift({
    receipt, time:new Date().toLocaleString(), items:count, method, total
  });
  state.cart = {};
  document.getElementById('discountInput').value = 0;
  renderCart();
  renderProducts();
  renderReports();
  saveState();
  showToast(`Payment complete via ${method} — ${money(total)}`);
}

// ---------- client storefront cart ----------
function clientAdd(id){
  const p = state.products.find(x=>x.id===id);
  if(!p || p.stock<=0){ showToast('Out of stock'); return; }
  const inCart = state.clientCart[id]||0;
  if(inCart >= p.stock){ showToast('No more stock available'); return; }
  state.clientCart[id] = inCart + 1;
  renderPublicStorefront();
  renderClientCart();
  showToast(`Added ${p.name}`);
}
function clientChangeQty(id, delta){
  const p = state.products.find(x=>x.id===id);
  let q = (state.clientCart[id]||0) + delta;
  if(q<=0){ delete state.clientCart[id]; }
  else if(q>p.stock){ showToast('No more stock available'); return; }
  else { state.clientCart[id]=q; }
  renderPublicStorefront();
  renderClientCart();
}
function clientRemove(id){
  delete state.clientCart[id];
  renderPublicStorefront();
  renderClientCart();
}
function toggleCart(){
  const open = document.getElementById('cartDrawer').classList.toggle('hidden') === false;
  document.getElementById('cartScrim').classList.toggle('hidden', !open);
  if(document.body) document.body.style.overflow = open ? 'hidden' : '';
}
function clientSubtotal(){
  return Object.keys(state.clientCart).reduce((s,id)=>{
    const p = state.products.find(x=>x.id==id);
    return s + p.price*state.clientCart[id];
  },0);
}
function renderClientCart(){
  const ids = Object.keys(state.clientCart);
  const lines = document.getElementById('clientCartLines');
  const count = ids.reduce((s,id)=>s+state.clientCart[id],0);
  document.getElementById('cartFabCount').textContent = count;
  document.getElementById('cartFab').classList.toggle('has-items', count>0);
  if(ids.length===0){
    lines.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Add something you love.</div>`;
  } else {
    lines.innerHTML = ids.map(id=>{
      const p = state.products.find(x=>x.id==id);
      const qty = state.clientCart[id];
      return `<div class="cart-line">
        <div class="cart-prod">
          <span class="cart-emoji">${p.emoji||'🌿'}</span>
          <div><span class="name">${p.name}</span><span class="cat">${p.category}</span></div>
        </div>
        <div class="qty-ctrl">
          <button onclick="clientChangeQty(${p.id},-1)">−</button>
          <span class="mono">${qty}</span>
          <button onclick="clientChangeQty(${p.id},1)">+</button>
        </div>
        <div class="cart-line-right">
          <div class="mono">${money(p.price*qty)}</div>
          <button class="link-btn" onclick="clientRemove(${p.id})">Remove</button>
        </div>
      </div>`;
    }).join('');
  }
  const sub = clientSubtotal();
  const tax = sub*TAX_RATE;
  document.getElementById('clientCartSubtotal').textContent = money(sub);
  document.getElementById('clientCartTax').textContent = money(tax);
  document.getElementById('clientCartTotal').textContent = money(sub+tax);
}
function clientCheckout(){
  const ids = Object.keys(state.clientCart);
  if(ids.length===0){ showToast('Your cart is empty'); return; }
  const total = clientSubtotal()*(1+TAX_RATE);
  showToast(`Order placed — ${money(total)}. Thank you!`);
  state.clientCart = {};
  renderPublicStorefront();
  renderClientCart();
  toggleCart();
}

// ---------- inventory page ----------
function statusOf(stock){
  if(stock<=state.threshold) return {label:'Low Stock', color:'var(--berry)'};
  return {label:'In Stock', color:'var(--accent)'};
}
function renderInventoryPage(){
  // populate restock select
  const sel = document.getElementById('restockSelect');
  sel.innerHTML = state.products.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  // category datalist
  const dl = document.getElementById('catOptions');
  dl.innerHTML = uniqueCategories().map(c=>`<option value="${c}">`).join('');
  renderAlerts();
  renderInventoryTable();
}
function renderAlerts(){
  const low = state.products.filter(p=>p.stock<=state.threshold);
  const zone = document.getElementById('alertZone');
  if(low.length===0){ zone.innerHTML=''; return; }
  zone.innerHTML = low.map(p=>`
    <div class="alert-banner">
      <div class="msg">
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 2 1 16h16L9 2Z" stroke="var(--ochre)" stroke-width="1.4" stroke-linejoin="round" fill="none"/><path d="M9 7v4" stroke="var(--ochre)" stroke-width="1.4" stroke-linecap="round"/><circle cx="9" cy="13.4" r="0.9" fill="var(--ochre)"/></svg>
        <span><strong>${p.name}</strong> is low on stock (${p.stock} left)</span>
      </div>
      <button class="btn btn-ochre btn-sm" onclick="quickFocusRestock(${p.id})">Restock</button>
    </div>
  `).join('');
}
function quickFocusRestock(id){
  document.getElementById('restockSelect').value = id;
  document.getElementById('restockQty').focus();
  document.getElementById('restockQty').scrollIntoView({behavior:'smooth', block:'center'});
}
function renderInventoryTable(){
  const body = document.getElementById('invBody');
  const q = state.invSearch.trim().toLowerCase();
  const items = state.products.filter(p=>p.name.toLowerCase().includes(q));
  const maxStock = Math.max(30, ...state.products.map(p=>p.stock));
  body.innerHTML = items.map(p=>{
    const color = CATEGORY_COLORS[p.category]||'var(--accent)';
    const st = statusOf(p.stock);
    const pct = Math.min(100, Math.round((p.stock/maxStock)*100));
    return `<tr>
      <td class="prod-name">${p.name}</td>
      <td><span class="tag" style="background:color-mix(in srgb, ${color} 20%, transparent); color:${color}"><span class="dot" style="background:${color}"></span>${p.category}</span></td>
      <td class="mono">${money(p.price)}</td>
      <td>
        <div class="stock-cell">
          <span class="mono">${p.stock} units</span>
          <div class="stock-bar-track"><div class="stock-bar-fill" style="width:${pct}%; background:${st.color}"></div></div>
        </div>
      </td>
      <td><span class="status-pill" style="color:${st.color}">${st.label}</span></td>
      <td class="row-actions">
        <button class="icon-btn" title="Edit" onclick="editProduct(${p.id})">
          <svg width="15" height="15" viewBox="0 0 15 15"><path d="M10 2l3 3-8 8H2v-3l8-8Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-btn" title="Delete" onclick="deleteProduct(${p.id})">
          <svg width="15" height="15" viewBox="0 0 15 15"><path d="M2.5 4h10M6 4V2.5h3V4M4 4l.7 8.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" style="color:var(--text-faint); text-align:center; padding:20px;">No matching products.</td></tr>`;
}

function restockProduct(){
  const id = parseInt(document.getElementById('restockSelect').value);
  const qty = parseInt(document.getElementById('restockQty').value) || 0;
  const p = state.products.find(x=>x.id===id);
  if(!p || qty<=0){ showToast('Enter a valid quantity'); return; }
  p.stock += qty;
  showToast(`Restocked ${p.name} (+${qty})`);
  saveState();
  renderInventoryPage(); renderProducts();
}

function addOrUpdateProduct(){
  const name = document.getElementById('pName').value.trim();
  const category = document.getElementById('pCategory').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  const stock = parseInt(document.getElementById('pStock').value);
  const emoji = state.selectedEmoji;
  if(!name || !category || isNaN(price) || isNaN(stock)){ showToast('Fill in all product fields'); return; }
  if(state.editingId){
    const p = state.products.find(x=>x.id===state.editingId);
    Object.assign(p, {name, category, price, stock, emoji});
    showToast('Product updated');
    cancelEdit();
  } else {
    state.products.push({id: state.nextId++, name, category, price, stock, emoji});
    showToast('Product added');
    clearProductForm();
  }
  saveState();
  renderInventoryPage(); renderProducts();
}
function clearProductForm(){
  ['pName','pCategory','pPrice','pStock'].forEach(id=>document.getElementById(id).value='');
  state.selectedEmoji = EMOJIS[0];
  renderEmojiPicker();
}
function editProduct(id){
  const p = state.products.find(x=>x.id===id);
  state.editingId = id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pStock').value = p.stock;
  state.selectedEmoji = p.emoji || EMOJIS[0];
  renderEmojiPicker();
  document.getElementById('addFormTitle').textContent = 'Edit Product';
  document.getElementById('addProductBtn').textContent = 'Update Product';
  document.getElementById('cancelEditBtn').classList.remove('hidden');
  document.getElementById('pName').scrollIntoView({behavior:'smooth', block:'center'});
}
function cancelEdit(){
  state.editingId = null;
  document.getElementById('addFormTitle').textContent = 'Add New Product';
  document.getElementById('addProductBtn').textContent = 'Add Product';
  document.getElementById('cancelEditBtn').classList.add('hidden');
  clearProductForm();
}
function deleteProduct(id){
  const p = state.products.find(x=>x.id===id);
  if(!confirm(`Remove "${p.name}" from inventory?`)) return;
  state.products = state.products.filter(x=>x.id!==id);
  delete state.cart[id];
  saveState();
  showToast('Product removed');
  renderInventoryPage(); renderProducts();
}

// ---------- reports ----------
function renderReports(){
  document.getElementById('statTotal').textContent = money(state.sales.total);
  document.getElementById('statItems').textContent = state.sales.itemsSold;
  const topProductEntry = Object.entries(state.sales.byProduct).sort((a,b)=>b[1]-a[1])[0];
  const topCatEntry = Object.entries(state.sales.byCategory).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('statTopProduct').textContent = topProductEntry ? topProductEntry[0] : '—';
  document.getElementById('statTopCategory').textContent = topCatEntry ? topCatEntry[0] : '—';
  renderLineChart();
  renderDonutChart();
  renderSalesHistory();
}
function renderSalesHistory(){
  const body = document.getElementById('salesBody');
  if(!state.transactions.length){
    body.innerHTML = `<tr><td colspan="5" style="color:var(--text-faint); text-align:center; padding:20px;">No sales recorded yet.</td></tr>`;
    return;
  }
  body.innerHTML = state.transactions.slice(0,30).map(t=>`
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
  const rows = state.transactions.map(t=>`${t.receipt},"${t.time}",${t.items},${t.method},${t.total.toFixed(2)}`).join('\n');
  const blob = new Blob([header+rows], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'indulge-sales-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Sales exported to CSV');
}
function renderLineChart(){
  const w=560, h=220, padL=44, padB=26, padT=14, padR=14;
  const maxV = Math.max(...monthly.map(m=>m.v)) * 1.1;
  const stepX = (w-padL-padR)/(monthly.length-1);
  const pts = monthly.map((m,i)=>{
    const x = padL + i*stepX;
    const y = padT + (h-padT-padB)*(1 - m.v/maxV);
    return [x,y];
  });
  const linePath = pts.map((p,i)=> (i===0?'M':'L')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const areaPath = linePath + ` L${pts[pts.length-1][0].toFixed(1)} ${h-padB} L${pts[0][0].toFixed(1)} ${h-padB} Z`;
  const gridLines = [0,0.25,0.5,0.75,1].map(f=>{
    const y = padT + (h-padT-padB)*f;
    const val = Math.round(maxV*(1-f));
    return `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" stroke="var(--border)" stroke-width="1"/>
            <text x="${padL-8}" y="${y+4}" font-size="10" fill="var(--text-faint)" text-anchor="end" font-family="IBM Plex Mono, monospace">${val}</text>`;
  }).join('');
  const labels = monthly.map((m,i)=>`<text x="${pts[i][0]}" y="${h-8}" font-size="11" fill="var(--text-dim)" text-anchor="middle" font-family="Inter, sans-serif">${m.m}</text>`).join('');
  const dots = pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="var(--surface)" stroke="var(--accent)" stroke-width="2"/>`).join('');
  document.getElementById('lineChart').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto;">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#areaGrad)"/>
      <path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${labels}
    </svg>`;
}
function renderDonutChart(){
  const values = {};
  state.products.forEach(p=>{ values[p.category] = (values[p.category]||0) + p.price*p.stock; });
  const total = Object.values(values).reduce((a,b)=>a+b,0) || 1;
  const r = 62, cx=80, cy=80, circ = 2*Math.PI*r;
  let offset = 0;
  const entries = Object.entries(values);
  const circles = entries.map(([cat,val])=>{
    const frac = val/total;
    const len = frac*circ;
    const dash = `${len.toFixed(2)} ${(circ-len).toFixed(2)}`;
    const rot = (offset/circ)*360;
    offset += len;
    const color = CATEGORY_COLORS[cat] || '#8FBE8A';
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="24" stroke-dasharray="${dash}" transform="rotate(${rot-90} ${cx} ${cy})"/>`;
  }).join('');
  document.getElementById('donutChart').innerHTML = `
    <svg width="160" height="160" viewBox="0 0 160 160">
      ${circles}
      <circle cx="${cx}" cy="${cy}" r="${r-14}" fill="var(--surface)"/>
    </svg>`;
  document.getElementById('donutLegend').innerHTML = entries.map(([cat,val])=>{
    const pct = Math.round((val/total)*100);
    const color = CATEGORY_COLORS[cat]||'#8FBE8A';
    return `<div class="legend-item"><span class="dot" style="background:${color}"></span>${cat}<span class="legend-pct">${pct}%</span></div>`;
  }).join('');
}

// ---------- settings ----------
function savePreferences(){
  const t = parseInt(document.getElementById('thresholdField').value) || 5;
  state.threshold = t;
  showToast('Preferences saved');
  saveState();
  renderInventoryPage();
}
function clearAllData(){
  if(!confirm('This will permanently remove all products from inventory. Continue?')) return;
  state.products = [];
  state.cart = {};
  state.transactions = [];
  state.sales = {total:0, itemsSold:0, byProduct:{}, byCategory:{}};
  saveState();
  renderInventoryPage(); renderProducts(); renderReports();
  showToast('All data cleared');
}

function renderAll(){
  setTheme(state.theme);
  renderProducts();
  renderCart();
  renderInventoryPage();
}

document.addEventListener('click', (e)=>{
  const menu = document.getElementById('userMenu');
  const chip = document.querySelector('.user-chip');
  if(!menu.classList.contains('hidden') && !menu.contains(e.target) && !chip.contains(e.target)){
    menu.classList.add('hidden');
  }
});