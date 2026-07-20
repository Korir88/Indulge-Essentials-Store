# Indulge Essentials — Store Ledger

A clean, single-page store management web app for **Indulge Essentials**: a public product storefront plus a staff console for point-of-sale, inventory and reporting.

## Live access model

| Audience | Access | Login required |
|----------|--------|----------------|
| **Clients / public** | Browse the product catalog (categories, search, stock status) | No |
| **Staff** | Inventory management only (restock, add/edit/delete products) | Yes (Staff) |
| **Admin** | Full console: Shop Floor (POS), Inventory, Reports, Settings | Yes (Admin) |

Staff cannot open Reports or Settings — those tabs are hidden and any direct navigation is blocked.

## Demo accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Staff | `staff` | `staff123` |

> These are demo credentials stored client-side for this prototype. Replace `ACCOUNTS` in `script.js` with a real backend before any production use.

## Features

- **Public storefront** — hero, category filter, live search, stock pills.
- **Shop Floor (POS)** — add-to-cart, discount %, 8% tax, payment method (Cash/Card/Mobile), numbered receipts.
- **Inventory** — restock, add/edit/delete products with emoji icons, low-stock alerts, stock bars.
- **Reports** — session sales KPIs, top product/category, monthly sales line chart, inventory-value donut, sales history with **CSV export**.
- **Settings** — profile, theme (light/dark), low-stock threshold, backup controls.
- **Persistence** — all data is saved to `localStorage`, so it survives reloads.
- **Responsive & themed** — works on desktop and mobile, with a polished dark/light design.

## Run locally

No build step. Just open `index.html` in a browser, or serve the folder:

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, set the source to the `main` branch (root).
3. The included `.nojekyll` ensures GitHub doesn't process the site with Jekyll.

## Tech

Pure HTML, CSS and vanilla JavaScript. No dependencies, no framework.
