コイン — customer USDT order platform

RUN
1. Install Node.js 22+.
2. Run: npm install
3. Create .env from .env.example (a local .env is included in this development package with the selected admin login).
4. Add a REAL Resend API key and a verified MAIL_FROM address.
5. Set PUBLIC_URL to the real HTTPS KOIN address in production.
6. In Render production, attach a persistent disk and set DATA_DIR to its mount path (for example /var/data).
7. Keep payment proofs out of the public static directory; KOIN serves them only through the admin route.
8. Run: npm start
9. Customer site: http://localhost:3000
10. Admin: http://localhost:3000/admin.html

CUSTOMER EMAILS
Orders, customers, offers, settings, onboarding data and community data are stored under DATA_DIR. Payment proofs are stored under DATA_DIR/uploads/proofs. For Render production, DATA_DIR must point to a persistent disk mount (for example /var/data); the free ephemeral filesystem is not persistent. The customer receives notifications for order creation, payment report, payment confirmation and completion. Every message includes the order details and a direct tracking link. Email attempts are recorded on the order. The customer never needs to keep the website open during the 20-minute processing window.

REAL EMAIL DELIVERY
KOIN uses Resend over HTTPS. A real RESEND_API_KEY and a verified MAIL_FROM domain/address are mandatory for real external delivery. A placeholder key is rejected. The admin panel includes a real delivery test and a resend action.

ADMIN
Username: jay
Password: NN**pp2024
The admin panel is protected by a signed HttpOnly SameSite session cookie and login rate limiting. Change the password before sharing the production server with anyone else.

SECURITY
- Uploaded proofs are NOT publicly served; only authenticated admin routes can open them.
- Admin API routes require an authenticated session.
- Production should use HTTPS, a strong session secret, rate limiting/WAF and regular backups.

ORDER FLOW
PENDING_PAYMENT -> PAYMENT_REPORTED -> PAID -> COMPLETED
Only the operator can confirm payment and complete the transfer with a TXID.

RESPONSIVE
The customer pages and operator panel adapt to desktop, tablet and mobile screens.

KOIN V20 additions
- Optional customer account with sign up/sign in.
- Saved payment-method metadata (never raw card number or CVV).
- Account order history by email.
- Learn page covering crypto arbitrage types and a net-profit calculator.
- Updated customer-facing wording to describe KOIN service fee separately from blockchain/network costs.
- Account balance/custody is NOT enabled in this version.

Production note: connect a compliant payment processor for real card tokenization/charging. Do not collect raw card data in KOIN.
