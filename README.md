# Jirani — verified errand runners for Kenyans abroad

A working front-end prototype plus a pitch website.

## Open it
1. Open the `jirani` folder in VS Code.
2. Install the **Live Server** extension, right-click `index.html`, choose **Open with Live Server**.
   (Double-clicking `index.html` also works.)

## Files
| File | What it is |
|---|---|
| `index.html` | Pitch website (problem, how it works, trust, business model) |
| `app.html` | The marketplace app |
| `css/base.css` | Colours, fonts, buttons, forms. Change colours at the top (`:root`) |
| `css/landing.css` | Website styling |
| `css/app.css` | App styling |
| `js/data.js` | **Edit here first:** counties, services, exchange rates, demo runners (add yourself!) |
| `js/app.js` | App logic. Search for `BACKEND:` to see what to replace with a server |
| `js/landing.js` | Fills the website dropdown and service tiles |

## Try the whole flow
1. `app.html` → **Sign up** → browse runners, switch currency, open Laban Bett.
2. **Request an errand** and leave a review.
3. Sign up with a second account → **Become a runner** → fill the verification form
   (KRA PIN format `A123456789Z`) → Dashboard → **Approve (demo only)**.

## What is fake in this prototype
- Data is saved in the browser (localStorage), so each device sees only its own data.
- Uploaded ID photos are previewed but NOT stored or sent anywhere.
- "Approve (demo only)" stands in for a real human/ID check.
- Passwords are hashed in the browser for demo purposes only.
- Exchange rates in `data.js` are rough numbers.

## Turning it into the real product
1. **Backend + database**: Node/Express + PostgreSQL, or Firebase / Supabase (fastest).
2. **Auth**: Supabase Auth, Firebase Auth or Auth0, not hand-made login.
3. **Documents**: private storage bucket with signed URLs, accessible only to admins.
4. **Verification**: admin panel to approve runners; later integrate official ID checks.
5. **Payments**: Safaricom Daraja API (M-Pesa STK Push) with escrow; card payments via Flutterwave or Stripe for diaspora.
6. **Legal**: register with the Office of the Data Protection Commissioner (ODPC), write Terms and a Privacy Policy, and consult a Kenyan lawyer on holding customer funds.
