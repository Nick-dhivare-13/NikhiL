# SolarSphere · KVL Electrical Jalgaon prototype

This folder contains the current full website and its local Node.js, Express, and MySQL backend. Start the backend to use login, database-backed package requests, admin settings, and tracking. Use `http://localhost:3000` for the complete site, including login, packages, admin, and tracking. If you open the HTML file directly, database features cannot connect.

**Companies, package prices, warranty terms, subsidies, interest rates, and customer records in the seed data are fictional classroom examples.** Use invented customer details only. This project is for local college demonstration, not real purchases, financing, or government subsidy claims.

## The current website

The site keeps the complete supplied KVL design and assets: the Jalgaon landing page, logo and photos, solar calculator, education/journal cards, Lusi prepared-answer helper, two video clips, EMI calculator, and the separate project tracking page. The current home page is the root `index.html`. Old duplicate pages in `public/` now redirect to their maintained counterparts in this folder.

## Features

- Public home page and solar estimator.
- Customer registration and sign-in. Name, email, and Indian mobile number are stored in MySQL; passwords are bcrypt-hashed.
- Login required for the fictional company/package catalogue and for submitting a quote request.
- Quote requests store the chosen package, monthly bill, usable roof area, pincode, and installation address.
- Customers can view their requests and track each reference/status on the separate tracking page.
- Admin access is checked on the server. Admin can view customer accounts and submitted contact/property details, edit companies, package prices and sample subsidies, change EMI defaults, and update request statuses.
- EMI calculator reads its sample interest rate and loan term from the admin settings.

## Run locally

Requirements: Node.js 18+ and MySQL 8+. MySQL service `MySQL80` is already installed and running on this computer.

1. Open this `outputs` folder in VS Code.
2. In MySQL Workbench, connect to the local MySQL server as `root`. Since the root password was shared in chat, change it first in **Server → Users and Privileges → root@localhost → Login**. Keep that new root password private; the website does not need it.
3. In Workbench, open `database/setup-local.sql` from this folder and run it with the lightning-bolt button. It creates the `solarsphere` database and a separate local account for the website.
4. Open `database/schema.sql` in Workbench and run it. This creates the tables and fictional example company/package records.
5. In the VS Code terminal for this folder, run `npm install` if needed, then `npm run create-admin`. The local `.env` already holds generated credentials; keep both `.env` and `database/setup-local.sql` private and do not send them to anyone.
6. Start the website with `npm start` and visit **http://localhost:3000**. Do not open the HTML file directly when using database features.

The first admin email is `admin@solarsphere.local`. Its generated password is in the local `.env` file on the `ADMIN_PASSWORD` line. Use it to sign in at **http://localhost:3000/admin.html**. The website connects as `solarsphere_app`, not as MySQL `root`.

If startup reports a database connection problem, confirm the MySQL service is running and that both Workbench scripts completed successfully. The `.env` file contains private local settings; never share it.
## Website paths

- `/` — full KVL home page, solar estimate calculator, sample package cards, journal, and Lusi/video controls.
- `/auth.html` — customer sign-in or account registration.
- `/offers.html` — sign-in-gated fictional company and package options.
- `/quotes.html` — submit a package request and view its saved status/reference.
- `/emi.html` — existing standalone EMI calculator with admin-managed default rate and period.
- `/tracking.html` — look up the signed-in customer's request using its reference code.
- `/admin.html` — server-protected admin dashboard.

## Where customer data is saved and viewed

After a customer registers or submits a quote request, the records are saved in the local MySQL database named `solarsphere`:

- `users` — customer name, email, mobile, password hash, and role.
- `enquiries` — quote reference, chosen company/package, price snapshot, monthly bill, roof area, address, pincode, and current status.
- `enquiry_status_history` — admin status changes and notes.

View submitted customer information at **http://localhost:3000/admin.html** after signing in with the admin account. In phpMyAdmin, select the `solarsphere` database and browse the tables above. Customer accounts and quote requests are also available separately in the `users` and `enquiries` tables. Never share the admin password or `.env` file.

## Project files

- `index.html`, `styles.css`, `script.js`, `assets/` — current website, calculator, visual design, logo, photos, and videos.
- `emi.html`, `emi.js` — existing standalone EMI page.
- `tracking.html`, `tracking.js` — separate request tracking page.
- `lusi.js`, `promo-video.js`, `site-config.js` — prepared solar answers, video dialog, and local display settings.
- `server.js` — backend API, session login, customer/admin permissions, and safe static-page routing. The older `public/` folder is not used by the current server; the active website is the root `index.html`, `styles.css`, `script.js`, pages, and `assets/`.
- `database/schema.sql` — MySQL tables and fictional example companies/packages.
- `auth.html`, `offers.html`, `quotes.html`, `admin.html`, `app.js`, `portal.css` — login, gated catalogue, saved request form, and server-backed admin pages.
- `scripts/create-admin.js` — creates the first admin using the password in `.env`.

## Sharing with your project partner

Share this project folder without `.env`. Each computer needs its own running MySQL database and private `.env`; import the schema and create a separate local admin account on each machine. For shared data across two computers, the backend would have to be hosted, which is outside the current local-only project.

This is not a real purchasing/checkout system: package buttons create quote requests only. No payment, real installer booking, official subsidy, lender, or utility service is connected.
