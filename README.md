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

> These are demo credentials stored client-side for this prototype. The `ACCOUNTS` object lives in `js/store.js`; replace it with a real backend before any production use.

## Features

- **Public storefront** — Hot Categories, What's New, products grouped by category, "You May Also Like", live search, stock pills, and a client cart with checkout.
- **Shop Floor (POS)** — add-to-cart, discount %, 8% tax, payment method (Cash/Card/Mobile), numbered receipts.
- **Inventory** — restock, add/edit/delete products with emoji icons, low-stock alerts, stock bars.
- **Reports** — session sales KPIs, top product/category, monthly sales line chart, inventory-value donut, sales history with **CSV export**.
- **Settings** — profile, theme (light/dark), low-stock threshold, backup controls.
- **Persistence** — all data is saved to `localStorage`, so it survives reloads.
- **Responsive & themed** — works on desktop and mobile, with a polished dark/light design.

## Architecture

The UI is generated dynamically from ES modules — there is no static HTML markup to maintain.

```
index.html            # shell: loads css/styles.css + js/main.js (type="module")
css/styles.css        # all styling, theming via CSS variables, responsive rules
js/
  main.js             # bootstrap, global wiring (App/Auth/Store/POS/Inventory/Console), theme
  state.js            # state object, constants, default data, shared SVG icons
  store.js            # persistence (localStorage), accounts, product/inventory operations
  ui.js               # DOM + formatting helpers, toast, SVG charts (line/donut)
  components.js       # reusable presentational builders (cards, KPI strip, emoji picker)
  auth.js             # login/sign-up modal, roles & permissions, enter-console flow
  views/
    storefront.js     # public store + client cart (Store)
    console.js        # POS (POS), inventory (Inventory), reports, settings (Console)
```

## Run locally

No build step. ES modules require an `http://` origin, so serve the folder rather than opening the file directly:

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

Pure HTML, CSS and vanilla JavaScript (ES modules). No dependencies, no framework, no build step.
