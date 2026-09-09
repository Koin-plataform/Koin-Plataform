# KOIN — production email setup

The application is already wired for Resend customer email delivery.

Before going live with a custom domain:

1. Buy the domain you will use for KOIN.
2. Add the domain to Resend and complete the DNS verification records shown by Resend.
3. In Render, set:
   - `RESEND_API_KEY` = your current Resend API key
   - `MAIL_FROM` = `KOIN <support@your-domain>` (use an address on the verified domain)
   - `PUBLIC_URL` = `https://your-domain`
4. Deploy/restart the service.
5. Open `/api/health` and confirm `emailConfigured: true`.
6. In Admin, use **Test customer email** before accepting real orders.

For testing, Resend's `onboarding@resend.dev` sender is restricted by Resend to the account's own test recipient. A verified custom domain removes that test restriction.

Never commit `.env` or a Resend API key to GitHub.
