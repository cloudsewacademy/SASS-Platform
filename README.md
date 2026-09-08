# SaaS Platform (Blanxer-style, MERN)

A multi-tenant e-commerce SaaS: merchants sign up, get their own isolated
store database, and manage orders/inventory from a dashboard. Modeled on
Blanxer's dashboard, rebuilt from scratch on your own MERN stack, reusing
the shipping-provider and admin-panel patterns from Mayaa Beauty.

## Architecture

```
saas-platform/
├── server/       Express + TypeScript API (control plane + tenant routing)
├── dashboard/    React (Vite) merchant admin app — orders, inventory, ...
└── storefront/   React (Vite) public storefront app — not built yet
```

### Multi-tenancy: separate database per tenant

- **Master DB** (`saas_master`) holds only platform-level data: `Tenant`
  registry (slug, dbName, plan, status, owner) and `PlatformUser` (login +
  which tenant(s) they belong to, for agencies/multi-store owners).
- **Each tenant gets its own physical MongoDB database** — full data
  isolation, no risk of a query bug leaking one merchant's orders into
  another's. DB name = `TENANT_DB_PREFIX` + tenant's `dbName` field.
- Connections are opened lazily on first request and **cached in a
  connection pool** (`server/src/config/tenantDb.ts`) with idle-eviction
  and a cap, so you don't leak one open connection per tenant forever as
  you scale to hundreds of stores.
- Every authenticated request goes through `requireAuth` → `resolveTenant`
  middleware, which reads `x-tenant-slug` (dashboard) or the request's
  subdomain (future storefront), loads the `Tenant` record from the master
  DB, and attaches `req.tenantConn` — the tenant's dedicated connection —
  for that request only.
- Because tenant models (`Product`, `Order`) are compiled **per-connection**
  via factory functions (`getProductModel(conn)`, `getOrderModel(conn)`)
  rather than as global singletons, the same codebase transparently serves
  any tenant's data with zero cross-tenant leakage risk.

### First slice built: Orders + Inventory

- `POST /api/auth/register` — creates a `PlatformUser` **and** their first
  `Tenant`, provisioning a new isolated database (mirrors Blanxer's
  "create your store" onboarding).
- `POST /api/auth/login` — returns a JWT + the list of stores that user
  belongs to (supports the multi-store switcher).
- `POST /api/orders` — creates an order, **atomically validates and
  decrements stock** per line item (including variants), rejects the
  whole order if any item is oversold.
- `GET /api/orders` — filter by status/channel/date/search, paginated.
- `PATCH /api/orders/:id/status` — status transitions; auto-restocks if
  an order is cancelled after stock was already deducted.
- `GET/POST /api/inventory/products`, `PATCH /api/inventory/products/:id/stock`,
  `GET /api/inventory/low-stock` — product CRUD, manual stock adjustments,
  low-stock alerts (same threshold pattern Blanxer's dashboard surfaces).

Order model already has `logisticsProvider` (`pathao | ncm | aramex | dash
| upaya | fabbud | pickdrop`) and `paymentMethod` (`esewa | khalti |
fonepay | ...`) fields ready — actual courier/payment API integration is
the natural next slice, reusing the `IShippingProvider` abstraction
pattern from Mayaa Beauty (`ncmProvider.ts` / `upayaProvider.ts`).

### Platform admin (monitor registrations, no credential or store-data access)

A super-admin role for monitoring who's registered — deliberately built as
a **separate, structurally isolated system** from merchant auth, not a
`role` flag on the merchant user model:

- `PlatformAdmin` lives in its **own collection**, distinct from
  `PlatformUser`. There's no shared code path where a bug could grant a
  merchant admin powers, because they're not rows in the same table.
- **No public registration route exists for admins.** The only way to
  create one is `npx ts-node src/scripts/createAdmin.ts "Name" "email" "password"`
  run directly on the server — account creation always requires shell
  access.
- Admin tokens are signed with a **separate secret** (`ADMIN_JWT_SECRET`)
  and carry a `role: "platform_admin"` claim checked by a dedicated
  `requireAdminAuth` middleware — completely separate from the merchant
  `requireAuth` middleware, so the two token types are never
  interchangeable even if a secret were reused by mistake.
- **Passwords are never exposed**, anywhere. `PlatformUser`/`PlatformAdmin`
  queries `.select("-passwordHash")`, and both models additionally strip
  `passwordHash` in a `toJSON` transform as a second layer of defense —
  so even a route that forgets `.select()` can't leak a hash.
- **Admins can't see tenant/store data, and tenants can't see each
  other's data.** This isn't a per-field permission check — it's
  architectural: admin routes (`server/src/controllers/adminController.ts`)
  only ever query the *master* DB (`Tenant`, `PlatformUser` registry
  metadata: store name, plan, status, signup date). They never call
  `getTenantConnection()`, so there is simply no code path from an admin
  request into any tenant's actual orders/products/customers. Tenant
  isolation for merchants is enforced the same way — `resolveTenant`
  only ever attaches the *calling* user's own tenant connection.
- The only write action exposed to admins is suspending/reactivating a
  store (`PATCH /api/admin/tenants/:id/status`) — for handling ToS
  violations or non-payment — still without ever touching that tenant's
  database.

Dashboard UI: `/admin/login` → `/admin/users` shows registered users, their
store(s), plan/status, and a suspend/reactivate toggle — nothing else.

### Full feature set (all working, not just nav placeholders)

Every sidebar item is now a real page backed by a real API — not a stub:

| Area | Backend | Frontend |
|---|---|---|
| Categories / Brands | full CRUD, slug auto-generated | list + inline create form |
| Products | full CRUD, links to category/brand | list + create form with dropdowns |
| Inventory | stock adjust, low-stock endpoint | +1/-1 adjust, low-stock filter |
| Orders | atomic stock deduction, status flow | filter/search, inline status change |
| Customers | auto-upserted from every order (totalOrders/totalSpent) | list + manual add |
| Reviews | CRUD + status | approve/reject workflow |
| Leads / Issues | full CRUD | list + create form |
| Discount Coupons | full CRUD | list + create form |
| Analytics | real MongoDB aggregations (revenue, orders by status/channel, 30-day trend, top products) | live numbers, no mock data |
| Finance | transactions (received/settled) + COD reconciliation, derived from real order payment/status | tabbed view, mark-reconciled action |
| Media | real file upload (multer), served per-tenant at `/uploads/<tenant>/...` | upload/grid/delete |
| SMS | logs messages (stub gateway — see below) | send form + log table |
| Content (Pages/Blog) | full CRUD | tabbed list + create form |
| Store Users | invite/list/remove, reuses `PlatformUser` membership model | invite form (shows temp password) |
| Settings / Appearance / Plugins | single per-tenant `Settings` document, `PATCH /settings/:section` | forms + toggles, save on submit |

Most of these use a shared **`crudFactory`** (server) + **`useCrud`/`SimpleCrudPage`** (client) pair, so adding a new simple resource is ~20 lines instead of a full hand-rolled controller + page each time. Orders, Inventory, Analytics, and Finance have their own dedicated logic since they involve real business rules (stock deduction, aggregation, reconciliation) rather than plain CRUD.

**Still genuinely stubbed** (by design — these need real external accounts/credentials you'll provide):
- **SMS** — logs to `SmsLog` instead of hitting a real gateway. Swap the body of `POST /api/sms/send` for a provider like Sparrow SMS.
- **Payments** — gateway credentials/toggles are fully configurable from the dashboard (see below) and drive real checkout options, but actual eSewa/Khalti/Fonepay redirect + webhook verification isn't wired up yet; `paymentStatus` for non-COD orders is set manually / via reconciliation until that's built.
- **Store Users invites** — no email delivery; the temporary password is returned directly in the API response for the owner to share manually.
- **Media storage** — served from local disk via Express static, fine for dev; swap for S3/Cloudinary + CDN for production scale.

### Public storefront (every store gets a live website automatically)

`storefront/` is a separate public-facing app — no login required. It reads
directly from new no-auth API routes under `/api/public/stores/:slug/...`
that resolve the tenant purely from the URL slug (never a header, never a
logged-in user) and only ever return `status: "published"` products with a
safe field allowlist — draft/archived products and internal fields
(cost, supplier notes, etc.) never reach this API regardless of query
params.

- `GET /api/public/stores/:slug` — store name, appearance (logo/color), contact info
- `GET /api/public/stores/:slug/products` — published products, paginated/searchable
- `GET /api/public/stores/:slug/products/:id` — one product's public detail

The dashboard's Home page has a "Go to your website ↗" link that opens
`http://localhost:5174/<your-slug>` — the moment you publish a product
(status: published) in the dashboard, it appears there. Product detail
pages are live too. Checkout/cart isn't wired up yet (see roadmap).

### Platform landing page

`dashboard/` now has a real marketing landing page at `/` (hero, feature
grid, "Create your store" / "Log in" CTAs) instead of redirecting straight
to a login wall. `/login` and `/register` are unchanged; unknown routes
now fall back to `/` instead of `/home`.

### Admin oversight: aggregate store activity (still no data access)

Added one narrow, explicitly-documented exception to "admin never touches
a tenant's database": `GET /api/admin/tenants/:id/activity` returns
**counts only** — order count, total revenue, published product count,
last order date — using `countDocuments()`/`aggregate($sum)` exclusively.
There is no code path here that returns an actual order, product, or
customer record; the aggregation pipeline physically cannot leak one.
Surfaced in the dashboard's `/admin/users` page as an "Activity" button
per store.

### Complete site customization: header, footer, navigation, multi-page

The storefront is no longer a single fixed page — every store owner can
fully customize their site from **Appearance** in the dashboard, with three
tabs:

- **Theme** — primary color, logo URL, homepage hero (title/subtitle/image), announcement bar text, search bar toggle
- **Navigation** — build the nav menu link by link, each pointing either at a published Page (by slug) or a custom URL, in whatever order you want
- **Footer** — any number of footer columns (each with its own title and links), social links, copyright text, and a togglable "Powered by" line

**Multiple pages**: the existing Content → Pages CRUD now has a "Show in
nav" toggle per page. Any published page with it checked is available to
add to the nav menu, and renders live on the storefront at
`/<slug>/page/<page-slug>` — so a store owner can add an About, Contact,
Shipping Policy, etc. entirely from the dashboard, no code involved.

Everything above is stored in the same per-tenant `Settings` document
(`appearance`, `header`, `navigation`, `footer` sections) and read by the
storefront's `StoreLayout` component on every page load — so header/nav/
footer are consistent across the storefront, product pages, and CMS pages
automatically, without duplicating markup per page.

### Real cart, checkout, and order tracking (storefront)

The storefront now has an actual shopping flow, not just a product catalog:

- **Cart** — client-side, `localStorage`-backed per store slug (`context/CartContext.tsx`), with quantity stepper and variant support
- **Checkout** — real order creation via a new public endpoint,
  `POST /api/public/stores/:slug/checkout`, which reuses the *exact same*
  stock-validation/deduction logic as the dashboard's staff-facing order
  route (`createOrderCore` in `orderController.ts`, shared by both) — so
  a storefront checkout can never oversell stock any differently than a
  manually-entered order can. Payment method choices on checkout are
  driven by `enabledPaymentMethods`, computed server-side from the
  tenant's payment settings — never hardcoded client-side.
- **Order tracking** — `GET /api/public/stores/:slug/orders/track` looks
  up an order by **order number + phone number together** (not order
  number alone), so a guessed/incremented order number can't be used to
  pull up a stranger's order. Shown at `/<slug>/order/<order-number>`
  with a visual status timeline.

### Payment gateways — fully configured from the dashboard

Dashboard → Settings → Payments now manages real gateway configuration:
COD (with an optional max-order-amount cap), eSewa (merchant code),
Khalti (public/secret key), Fonepay (merchant code/secret key) — each
individually toggle-able. Credentials are stored in the same per-tenant
`Settings` document and are **never** returned by the public storefront
API — `GET /api/public/stores/:slug` only ever exposes a computed
`enabledPaymentMethods: string[]` list (e.g. `["cod","esewa"]`), never the
underlying merchant code or secret key. This is the one and only place
payment configuration lives — there's no separate payments panel or config
file to keep in sync.

**What this doesn't do yet** (by design — needs your live gateway
sandbox/production credentials to build safely): actual eSewa/Khalti/
Fonepay redirect + callback verification. Right now, choosing a non-COD
method at checkout tags the order with that `paymentMethod` and leaves
`paymentStatus: "pending"` for the store owner to reconcile manually
(same COD-reconciliation UI in Finance works for this too). Wiring real
gateway redirects is a contained next step once you're ready to test
against real merchant credentials.

### Section layouts: header, footer, and product grid

Under Appearance → Theme: **Header layout** (standard: logo left / nav +
search right, or centered: logo centered with nav below) and **Product
grid style** (image-forward grid, or a compact list view). Under
Appearance → Footer: **Footer layout** (multi-column link groups, or a
single simple centered row). All four are `Settings` fields
(`header.layout`, `appearance.productGridStyle`, `footer.layout`) read by
the storefront and applied via CSS classes — no separate theme system to
keep in sync.

### Real image uploads for Products, Categories, Brands

Product/Category/Brand forms in the dashboard now have an actual file
picker (`components/ImageUploadField.tsx`) that uploads straight to the
Media library and shows a thumbnail preview — no more pasting URLs by
hand. Product list rows show a thumbnail too. Uses the same `/api/media`
upload endpoint the standalone Media page uses, so everything you upload
through a product form also shows up in Media, and vice versa.

### Catalog fields brought up to par (Products, Categories, Brands)

Matched against a real reference (Blanxer's Add Product/Brand/Category
forms) and closed the gaps:

- **Products** — multi-category tagging (`categoryIds`), brand link, cost
  price + weight (internal, never shown publicly), original/strikethrough
  price, SEO metadata (meta title/description/keywords), and
  trending/best-seller badges. The product list shows a thumbnail and
  badge chips.
- **Categories** — SEO title/description, "hide on product pages" toggle.
- **Brands** — SKU prefix, country/origin, active/inactive status,
  popular/featured flags, and category tagging.

### Full homepage customization: section builder + theme presets

The biggest gap closed this round: the storefront homepage is no longer
one fixed hero+grid layout — it's built from **sections** you add, remove,
reorder, and configure from Appearance → Homepage Sections:

- **Hero banner** — pulls from Theme tab's hero title/subtitle/image
- **Featured products** — configurable title + how many products
- **Category tiles** — auto-pulled from your Categories, configurable title
- **Promo banner** — image, title, subtitle, button text + link
- **Testimonials** — add/remove name+quote pairs
- **Custom text block** — a title + freeform paragraph(s), for anything else

Sections are stored as an ordered array (`Settings.homepageSections`) and
rendered by the storefront's `Store.tsx` in that exact order — reorder
with ↑/↓, hide without deleting, or remove entirely. Stores created before
this feature default to a sensible hero + featured-products fallback so
nothing breaks.

Theme tab also now has **presets** (5 accent-color swatches), **font
family** (system/serif/mono/rounded), and **corner style**
(sharp/rounded/pill) — plus a **product grid style** toggle (image grid vs.
compact list) that applies storefront-wide.

A new **`/shop`** page on the storefront gives a full, searchable,
category-filterable product catalog — separate from the curated homepage,
since "everything I sell" and "what I want to feature" are different jobs.
Header search now goes there by default.

## Running locally

```bash
# 1. Server
cd server
cp .env.example .env   # fill in MongoDB URIs + JWT secret
npm install
npm run dev             # http://localhost:5000

# 2. Dashboard
cd ../dashboard
cp .env.example .env
npm install
npm run dev              # http://localhost:5173

# 3. Storefront (public store pages)
cd ../storefront
cp .env.example .env
npm install
npm run dev              # http://localhost:5174

# 4. Create a platform admin (server-side only, no public route)
cd ../server
npx ts-node src/scripts/createAdmin.ts "Your Name" "you@company.com" "a-strong-password"
# then log in at http://localhost:5173/admin/login
```

You need a local (or Atlas) MongoDB reachable at both `MASTER_MONGODB_URI`
and `TENANT_MONGODB_BASE_URI`. Registering a store on `/register` in the
dashboard will provision a brand-new tenant database automatically —
nothing to create by hand.

## Suggested next slices (in order)

0. **~~Storefront app~~ — done.** See "Public storefront" above.
1. **Logistics integration** — port the `IShippingProvider` interface
   pattern (NCM/Upaya) into `server/src/services/shipping/`, add
   Pathao/Aramex/Dash providers behind the same interface.
3. **Payments** — eSewa/Khalti/Fonepay webhook handlers updating
   `paymentStatus`.
4. **Store appearance/builder** — admin UI for theme + storefront content,
   similar to Blanxer's "Appearance Panel".
5. **Analytics dashboard** — revenue/orders/AOV by channel, mirroring the
   Blanxer mobile app's Analytics tab; can reuse the aggregation patterns
   once order volume exists to query.
6. **Billing/plan enforcement** — gate features by `tenant.plan`.
7. **SEO/AEO/GEO layer** — port the `<SEO />` component + FAQ/Organization
   JSON-LD pattern once storefront pages exist (see prior post on this).

### Visual design matched to Mayaa Beauty

The storefront's visual language (`storefront/src/App.css`, `index.html`
font loading) is now built to match Mayaa Beauty's actual design system,
extracted from their source: **Playfair Display** for headings + **Plus
Jakarta Sans** for body text, a near-black/white/warm-beige luxury
palette, sharp (0-radius) corners throughout, and uppercase
letter-spaced labels on nav links, buttons, and section headers — the
same visual grammar as Mayaa's header, footer, product cards, and
checkout flow.

**What's a faithful visual match vs. what's simplified:** fonts, colors,
spacing, corner treatment, typography scale, and overall layout structure
(header/footer/product grid/checkout) closely mirror the reference.
**Not reproduced**: Mayaa's header is a 600+ line component with a live
search-suggestions dropdown, mega-menu, and account dropdown built on
Tailwind + shadcn/ui — our storefront's plain-CSS architecture gives
functionally equivalent search/nav/cart instead of pixel-identical
interactive behavior. The accent color stays store-owner-configurable
(via Appearance → Theme) rather than hardcoded to Mayaa's monochrome
palette, since this is a multi-tenant platform, not a single store.

### Landing page redesign + dashboard's own theme/layout system

**Landing page** (`dashboard/src/pages/Landing.tsx`) rebuilt with a dark
gradient hero, eyebrow badge, stats bar, and a fuller 8-item feature grid
plus a closing CTA section — a real SaaS-marketing page instead of the
plain hero+grid from before. Note: I could not actually inspect
socialsewa.com's design (it's a client-rendered SPA with no fetchable
screenshot), so this is a polished landing page in the same genre rather
than a literal copy of a site I couldn't see.

**Dashboard admin UI theme** (`context/DashboardThemeContext.tsx`) — new
and separate from the storefront's Appearance settings on purpose: this
controls how the *merchant's own admin panel* looks, not what customers
see on the public store. Persisted in `localStorage` per-browser, not in
the tenant's `Settings` document, since it's a personal preference (e.g.
"I like dark mode at night") rather than a store-wide setting.

- **Dark / light mode** — toggle in the sidebar footer, applies instantly via a `data-dashboard-mode` attribute and CSS variable overrides across tables, forms, cards, panels.
- **5 accent colors** (violet/blue/emerald/rose/amber) — swap the dashboard's whole accent palette (`--purple`/`--purple-dark`/`--purple-light`) with one click.
- **Sidebar density** (comfortable / compact) — tighter nav spacing for people who'd rather see more menu items without scrolling.

### Product images now render correctly on the storefront (bug fix)

Root cause: uploaded images (products, brands, categories, hero/banner)
are stored as paths relative to the API server (e.g.
`/uploads/tenant_x/file.png`). The storefront runs on a different
origin/port, so rendering that path directly in an `<img>` or CSS
`background-image` resolved against the storefront's own server and
404'd. Fixed with a single `mediaUrl()` helper
(`storefront/src/api/client.ts`) applied everywhere an uploaded image is
rendered — product cards, product detail, cart, hero, banners, category
tiles, and the store logo. Absolute URLs (an externally-hosted image
someone pastes in) pass through unchanged.

### Creating a platform admin

`npm run create-admin -- "Your Name" "you@email.com" "password123"` from
inside `server/` (the `--` is required so npm passes the arguments
through). There's still no public registration route for admins — this
CLI script is the only way to create one, on purpose (see the Platform
Admin section above).

### Data placement, confirmed correct

Store owners/staff (`PlatformUser`) live in `saas_master` with
`memberships` linking them to their tenant(s) — that's the platform-level
registry admins can see via `/admin/users`. Customers (people who buy
from a store) live entirely inside that store's own tenant database
(`getCustomerModel`, same per-connection pattern as `Product`/`Order`) —
they physically cannot end up in `saas_master`, and one store's customers
are invisible to another store or to the platform admin.

### Customer accounts: login required before checkout

Storefront checkout now requires a real customer account, scoped
per-tenant — the same isolation model as everything else here:

- `POST /api/public/stores/:slug/auth/register` / `.../auth/login` — a
  customer's password lives on their `Customer` document **inside that
  tenant's own database**, not in `saas_master`. An account created on
  Store A does not exist on Store B, even with the same phone number.
- Customer JWTs use their **own secret** (`CUSTOMER_JWT_SECRET`, separate
  from staff/admin secrets) and embed the `tenantSlug` they were issued
  for — `requireCustomerAuth` rejects a token if the slug in the URL
  doesn't match the slug in the token, so a login for one store can never
  be replayed against another.
- Checkout derives the order's name/phone/email from the **authenticated
  account**, not the request body — a logged-in customer can't place an
  order under someone else's identity even by editing the request.
- New storefront pages: `/​<slug>​/login`, `/​<slug>​/register`,
  `/​<slug>​/account` (profile + order history, via a new
  `GET .../auth/my-orders`). Checkout redirects to login (and back again
  afterward) if you're not signed in.

### Unified login, staff hidden from admin, admin-editable landing page, custom domains

Four more real changes, in response to direct feedback:

**1. One login page for everyone.** `POST /api/auth/login` now checks
`PlatformAdmin` first, then `PlatformUser`, and returns which one matched
(`role: "admin" | "merchant"`). The dashboard's `/login` page is the only
login page now — it routes admins to `/admin/users` and merchants to
`/home` based on that response. `/admin/login` redirects to `/login` for
anyone with it bookmarked. Under the hood, admin and merchant sessions
are still completely separate token types verified by separate
middleware (`requireAdminAuth` vs `requireAuth`) — unifying the *form*
didn't unify the *privilege boundary*.

**2. Admin panel no longer shows staff.** `/admin/users` now filters to
accounts with an `owner` membership only — staff a store owner invites
(Store Users → Invite user) are that owner's business, not something the
platform admin needs to see as a top-level entry. They're still fully
covered by that store's aggregate Activity numbers.

**3. Admin can edit the landing page.** New `PlatformSettings` model (a
single document in the master DB, not tenant-scoped) holds the landing
page's hero eyebrow/title/subtitle/CTA text. Editable at
`/admin/landing-page`, read publicly (no auth) by the Landing page itself
via `GET /api/platform-settings`.

**4. Custom domains and clean subdomains.** This was the biggest piece:
- `Tenant.customDomain` (unique) — set from Dashboard → Settings → Domain.
- `GET /api/public/resolve` resolves a tenant purely from the request's
  Host header: exact `customDomain` match, or `<slug>.PLATFORM_DOMAIN`
  subdomain match (checked only if `PLATFORM_DOMAIN` is configured).
- The storefront's routes now use an **optional** `:slug?` segment
  (`/:slug?/product/:id`, etc.) so the *same* route tree serves both:
  - **path-mode** (local dev, or a shared demo link) — `/anish/product/12`, slug read straight from the URL
  - **domain-mode** (production, on the store's own domain/subdomain) — `/product/12` with no slug in the URL at all; `ResolvedSlugContext` calls `/public/resolve` once on boot and every page reads the slug via `useStoreSlug()` instead of raw `useParams`
  - Internal links are built via `useStoreBasePath()` (`/anish` in path-mode, `""` in domain-mode) so URLs stay clean in whichever mode you're in
  - If neither a URL slug nor domain resolution finds anything (visiting the bare platform storefront domain with no path), it falls back to a "store not found" page rather than crashing

**What this doesn't do**: actual DNS automation or SSL provisioning for
a custom domain — that's infrastructure-specific (depends on where you
host the storefront app: a reverse proxy, Vercel/Netlify domain configs,
Cloudflare, etc.). The Settings → Domain tab tells the store owner they
need to point DNS at the platform but can't tell them the exact
target value, since that depends entirely on your deployment.

### Shop page reachability, custom forms, footer icons, and a CSS/contrast pass

**Shop page was unreachable** — confirmed bug: nothing in the default nav
pointed at `/shop`, so a new store had no way to browse the full catalog
past whatever's featured on the homepage. Fixed: "Shop" is now always in
the nav by default (skipped only if the owner adds their own link to
`/shop` explicitly).

**Custom forms (Contact, Enquiry, etc.)** — real feature, not a stub.
Dashboard → Forms lets an owner build a form from scratch or from a
Contact/Enquiry template, with any mix of text/email/phone/textarea/select
fields, each independently required or optional. Submissions are stored
per-tenant (`CustomForm` + `FormSubmission` models) and viewable per-form
in the dashboard. Optionally, each submission can also create a `Lead`
automatically, so form fills show up alongside other leads without
checking two places. Rendered on the storefront at `/form/<form-slug>` —
add it to the nav (Appearance → Navigation) like any other link.

**Footer social icons** — social links now render as real icons
(Facebook/Instagram/X/YouTube/LinkedIn/TikTok, generic globe for anything
else) instead of the platform name as plain text. Built as small inline
SVGs (`components/SocialIcons.tsx`) rather than depending on
`lucide-react`'s brand icons, which recent versions dropped entirely.

**Fixed a real text-contrast bug**: the dashboard's Landing and
Login/Register pages are supposed to look the same for everyone —
they're public pages, not part of the personal dashboard theme. But they
were pulling colors from the *same* CSS variables the dark-mode toggle
changes. Toggle dark mode once, then visit `/`, `/login`, or `/register`,
and several text elements would render in a near-white color on their
hardcoded white backgrounds — functionally invisible. Fixed by giving
these pages their own fixed light-theme colors, decoupled from the
personal dashboard-theme variables entirely.

**General CSS polish** across both apps: consistent focus-visible outlines
and focus rings on all inputs (accessibility), smooth transitions on
interactive elements, subtle card shadows for depth, a more cohesive
dark-mode look for active nav items (translucent accent tint instead of a
flat pale-purple box that looked out of place against a dark sidebar),
and a small lift/shadow on storefront product cards on hover.
"# SASS-Platform" 
