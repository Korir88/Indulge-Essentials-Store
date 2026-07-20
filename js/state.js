// js/state.js — application state, constants and shared icons

export const CATEGORY_COLORS = {
  'Clothing': '#8FA6C2',
  'Accessories': '#C2A45E',
  'Personal Care': '#B98CA6',
  'Home Goods': '#6E8F6E',
  'Wellness': '#B8734A'
};

export const EMOJIS = ['🌿','👕','🍃','🧴','☕','💧','🧦','🕯️','🧺','🪴','🧼','🍯','🌸','🪥','👜','🛁'];

export const TAX_RATE = 0.08;
export const STORAGE_KEY = 'indulge-essentials-ledger';
export const ACCOUNTS_KEY = 'indulge-essentials-accounts';

export const PERMISSIONS = {
  admin: ['products', 'inventory', 'reports', 'settings'],
  staff: ['products', 'inventory']
};

export const TAB_LABELS = {
  products: 'Shop Floor',
  inventory: 'Inventory',
  reports: 'Reports',
  settings: 'Settings'
};

export const defaultProducts = [
  { id:1, name:'Organic Cotton T-Shirt', category:'Clothing', price:24.99, stock:15, emoji:'👕', isNew:true, hot:true },
  { id:2, name:'Stainless Steel Water Bottle', category:'Accessories', price:19.99, stock:8, emoji:'💧', isNew:true, hot:true },
  { id:3, name:'Natural Bamboo Toothbrush', category:'Personal Care', price:4.99, stock:25, emoji:'🪥', hot:true },
  { id:4, name:'Handmade Ceramic Mug', category:'Home Goods', price:16.99, stock:12, emoji:'☕', isNew:true },
  { id:5, name:'Essential Oil Diffuser', category:'Wellness', price:29.99, stock:6, emoji:'🕯️', isNew:true, hot:true },
  { id:6, name:'Reusable Shopping Bag', category:'Accessories', price:9.99, stock:30, emoji:'🧺' },
  { id:7, name:'Himalayan Salt Lamp', category:'Home Goods', price:22.99, stock:4, emoji:'🪔', isNew:true },
  { id:8, name:'Organic Lavender Soap', category:'Personal Care', price:7.99, stock:20, emoji:'🧼' }
];

export const monthly = [
  { m:'Jan', v:3500 }, { m:'Feb', v:4200 }, { m:'Mar', v:3750 },
  { m:'Apr', v:5100 }, { m:'May', v:4800 }, { m:'Jun', v:5600 }
];

export const state = {
  theme: 'dark',
  search: '',
  invSearch: '',
  selectedCategory: 'All',
  threshold: 5,
  editingId: null,
  selectedEmoji: '🌿',
  user: null,
  clientCart: {},
  cart: {},
  products: [],
  nextId: 9,
  sales: { total:0, itemsSold:0, byProduct:{}, byCategory:{} },
  transactions: []
};

// ----- shared icons -----
export const icons = {
  leaf: (color) => `<svg width="34" height="34" viewBox="0 0 34 34" fill="none"><path d="M17 3C17 3 8 10 8 19a9 9 0 0 0 18 0c0-9-9-16-9-16Z" fill="${color}" opacity="0.85"/><path d="M17 14v16" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  moon: () => `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M13.5 9.5A6 6 0 0 1 6.5 2.5 6 6 0 1 0 13.5 9.5Z" fill="currentColor"/></svg>`,
  sun: () => `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3.4" fill="currentColor"/><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1M12.7 12.7l-1.1-1.1M4.4 4.4 3.3 3.3"/></g></svg>`,
  cart: () => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16l-1.5 10a2 2 0 0 1-2 1.8H7.5A2 2 0 0 1 5.5 16L4 6Z" stroke="currentColor" stroke-width="1.6"/><path d="M8 6a4 4 0 0 1 8 0" stroke="currentColor" stroke-width="1.6"/></svg>`,
  search: () => `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  user: () => `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" stroke-width="1.3"/><path d="M2 13a5 5 0 0 1 10 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  edit: () => `<svg width="15" height="15" viewBox="0 0 15 15"><path d="M10 2l3 3-8 8H2v-3l8-8Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/></svg>`,
  trash: () => `<svg width="15" height="15" viewBox="0 0 15 15"><path d="M2.5 4h10M6 4V2.5h3V4M4 4l.7 8.5a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  alert: () => `<svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 2 1 16h16L9 2Z" stroke="var(--ochre)" stroke-width="1.4" stroke-linejoin="round" fill="none"/><path d="M9 7v4" stroke="var(--ochre)" stroke-width="1.4" stroke-linecap="round"/><circle cx="9" cy="13.4" r="0.9" fill="var(--ochre)"/></svg>`,
  box: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7h18l-1.5 12a2 2 0 0 1-2 1.8H6.5A2 2 0 0 1 4.5 19L3 7Z" stroke="currentColor" stroke-width="1.6"/><path d="M8 7a4 4 0 0 1 8 0" stroke="currentColor" stroke-width="1.6"/></svg>`,
  star: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.8 6.2.6-4.6 4.3 1.3 6.3L12 16.8l-5.5 3.2 1.3-6.3-4.6-4.3 6.2-.6L12 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  coin: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.6"/></svg>`,
  pie: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/></svg>`,
  tag: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9h6a3 3 0 0 1 3 3v6l-9 9-9-9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`
};
