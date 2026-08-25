# VoltUp — 3D Game Asset Marketplace

A full-stack marketplace for premium game-ready 3D assets, built on **Next.js (App Router)** with
**Route Handler APIs** and **MongoDB Atlas**.

---

## Stack

| Layer      | Technology                                                       |
| ---------- | ---------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, React 19, Server Components)             |
| Language   | TypeScript (strict)                                              |
| API        | Next.js Route Handlers under `src/app/api/**`                    |
| Database   | MongoDB Atlas via Mongoose 9                                     |
| Auth       | Admin-only — bcrypt + JWT (`jose`) in an httpOnly cookie         |
| File storage | Cloudinary — images, PDFs and 3D asset archives, signed uploads |
| Styling    | Tailwind CSS v4, shadcn/ui, Radix primitives, lucide-react       |
| Client data| TanStack Query 5                                                 |
| Validation | Zod                                                              |

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure MongoDB Atlas

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

| Variable               | What it is                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| `MONGODB_URI`          | Atlas → Database → **Connect → Drivers** → copy the `mongodb+srv://…` string. Put your database name after the host, e.g. `…mongodb.net/oneupgames`. |
| `JWT_SECRET`           | Session signing key. Generate: `openssl rand -base64 32`                   |
| `ADMIN_EMAIL`          | The admin account the seed script creates                                  |
| `ADMIN_PASSWORD`       | That account's password (8+ chars). Change it before deploying.            |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Console → Settings → API Keys                                  |
| `CLOUDINARY_API_KEY`   | Same page                                                                  |
| `CLOUDINARY_API_SECRET`| Same page. **Never** prefix any of these with `NEXT_PUBLIC_`.              |
| `NEXT_PUBLIC_SITE_URL` | Public origin, used for canonical/OG URLs                                  |

> In Atlas, add your IP under **Network Access** (or `0.0.0.0/0` while developing) or every
> connection times out.

### 3. Seed the database

```bash
npm run seed
```

Creates the 8 starter assets, 6 categories, sample customers, and the admin account.
Safe to re-run — every write is an upsert, so orders and support tickets are never touched.

### 4. Run

```bash
npm run dev     # http://localhost:3000
```

Admin portal: **http://localhost:3000/admin/login**

---

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Development server                   |
| `npm run build`  | Production build                     |
| `npm start`      | Serve the production build           |
| `npm run seed`   | Seed MongoDB with catalogue + admin  |
| `npm run lint`   | ESLint                               |
| `npm run format` | Prettier                             |

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx              Root layout — fonts, providers, Navbar/Footer
│   ├── page.tsx                Home (server component, reads MongoDB)
│   ├── models/                 Catalogue listing + [slug] detail
│   ├── categories/             Category tiles
│   ├── cart/  checkout/        Cart, checkout, success
│   ├── contact/  complaint/    Forms that POST to the API
│   ├── admin/
│   │   ├── login/              The only login page in the app
│   │   └── (dashboard)/        Protected portal — dashboard, products, orders, customers
│   └── api/                    ← all Route Handlers
├── components/
│   ├── site/                   Storefront components
│   ├── admin/                  Admin portal components
│   └── ui/                     shadcn/ui primitives
├── lib/                        mongodb, auth, types, validation, cart, format
├── models/                     Mongoose schemas
├── server/                     Server-only queries, serializers, seed
└── middleware.ts               Admin route guard (Edge)
```

---

## API reference

All responses are `{ ok: true, data }` or `{ ok: false, error }`.

### Public

| Method | Route                     | Description                                              |
| ------ | ------------------------- | -------------------------------------------------------- |
| GET    | `/api/products`           | Catalogue. Query: `category`, `search`, `maxPrice`, `minRating`, `format`, `sort`, `limit` |
| GET    | `/api/products/[slug]`    | One asset                                                |
| GET    | `/api/categories`         | All categories                                           |
| POST   | `/api/orders`             | Place an order (prices re-read from the DB server-side)  |
| GET    | `/api/orders/[orderId]`   | Look up an order by its `VU-XXXXXX` id                   |
| POST   | `/api/contact`            | Store a contact message                                  |
| POST   | `/api/complaints`         | Store a support ticket (optional Cloudinary attachment)  |
| POST   | `/api/upload/sign`        | Authorise one direct upload — public kinds only          |

### Admin (requires the session cookie)

| Method | Route                     | Description                    |
| ------ | ------------------------- | ------------------------------ |
| POST   | `/api/admin/login`        | Sign in, sets the cookie       |
| POST   | `/api/admin/logout`       | Clear the cookie               |
| GET    | `/api/admin/me`           | Current admin                  |
| GET    | `/api/admin/stats`        | Dashboard totals               |
| POST   | `/api/products`           | Create an asset                |
| PATCH  | `/api/products/[slug]`    | Update an asset                |
| DELETE | `/api/products/[slug]`    | Delete an asset                |
| GET    | `/api/orders`             | All orders                     |
| PATCH  | `/api/orders/[orderId]`   | Change order status            |
| GET    | `/api/customers`          | Customer rollups               |
| GET    | `/api/contact`            | Contact inbox                  |
| GET    | `/api/complaints`         | Complaint queue                |
| POST   | `/api/seed`               | Re-apply the starter catalogue |
| GET    | `/api/upload`             | Media library listing          |
| POST   | `/api/upload`             | Upload via this server         |
| POST   | `/api/upload/sign`        | Authorise a direct upload      |
| POST   | `/api/upload/delete`      | Delete a file from Cloudinary  |

---

## Security notes

- **Prices are never trusted from the browser.** `POST /api/orders` re-reads every line item from
  MongoDB and recomputes subtotal, discount and total server-side.
- **Admin sessions** are HS256 JWTs in an httpOnly, SameSite=Lax cookie, 8-hour expiry.
  `secure` is enabled automatically in production.
- **Two gates:** `middleware.ts` blocks `/admin/*` at the edge; every admin route handler
  independently calls `requireAdmin()`, so the API is never open on its own.
- **Passwords** are bcrypt-hashed (cost 12) and the hash is `select: false` — it is never returned
  by a normal query.
- Login responses are identical for unknown emails and wrong passwords.
- `.env.local` is git-ignored. Rotate `JWT_SECRET` and `ADMIN_PASSWORD` before going to production.

### File uploads

- **The Cloudinary API secret never leaves the server.** `src/lib/cloudinary.ts` is marked
  `server-only`, so importing it from a client component fails the build. No Cloudinary value is
  prefixed `NEXT_PUBLIC_`.
- **Signed direct uploads.** The browser asks `/api/upload/sign` for a one-shot signature, then
  posts the file straight to Cloudinary. Large asset archives therefore never hit our server and are
  not capped by the platform's request body limit.
- **The signature pins the destination.** `folder` and `public_id` are signed, so a modified request
  is rejected by Cloudinary (verified: swapping the folder returns 401).
- **Fixed folder allow-list.** Callers choose an upload *kind*, never a raw path. Filenames are
  sanitised, so `../../escape.png` becomes `escape-mt6r4xw9`.
- **Server-side re-validation.** Extension and size limits are enforced in `/api/upload/sign` and
  `/api/upload`, not just in the browser.
- **Deletion is admin-only** and refuses any `public_id` outside the `voltup/` namespace.

| Upload kind | Folder | Max | Formats | Who |
| --- | --- | --- | --- | --- |
| `product-image` | `voltup/products` | 10 MB | jpg, jpeg, png, webp, avif | admin |
| `product-doc` | `voltup/docs` | 25 MB | pdf, txt, md | admin |
| `product-asset` | `voltup/assets` | 2 GB | zip, rar, 7z, fbx, blend, obj, glb, gltf | admin |
| `complaint-attachment` | `voltup/complaints` | 10 MB | jpg, jpeg, png, webp, pdf, txt, log, zip | public |

Add a new kind in `src/lib/upload-policy.ts` — both the browser hints and the server checks read
from that one table.

---

## Not yet wired up

These are deliberately left as integration points:

- **Payment provider.** Checkout collects card fields but never transmits them; orders are recorded
  with status `Paid`. Drop in Stripe/PayPal at `POST /api/orders`.
- **File delivery.** The success page counts down and then shows a download button that explains
  the link is issued server-side. Connect S3/R2 signed URLs there.
- **Storefront accounts.** By design, the only login in the app is `/admin/login`.

---

## Deployment

Works on any Node host; Vercel needs no extra config.

1. Set `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL` as
   environment variables.
2. Allow the platform's egress IPs in Atlas **Network Access**.
3. `npm run build && npm start`.
4. Run `npm run seed` once against the production database.
