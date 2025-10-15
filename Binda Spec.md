📘 Binda – Full Product Specification & Technical Documentation
1. Overview

Binda is a mobile-first SaaS for independent U.S. home-service professionals (cleaners, handymen, detailers).
It helps them get booked, get paid, and get rebooked using simple scheduling, payments, and SMS automation.
Think Calendly + Stripe + Twilio — optimized for jobs, not meetings.

2. Core Goals

Reduce no-shows by 30 % through deposits and reminders.

Get new providers from signup → first booking → payment within 10 minutes.

Deliver a lightweight, boring-tech stack MVP in under 8 weeks.

3. Product Features
MVP Scope
Module	Description
Public Booking Page	/username page listing services, durations, prices, ZIP filtering.
Scheduling Engine	Prevent overlapping jobs, add travel buffers, manage service areas.
Payment System	Stripe Checkout for deposits & full payments (cards, Apple/Google Pay).
SMS Automation	Confirmations, 24 h & 2 h reminders, “On my way” texts.
Receipts / Invoices	Auto-generated PDFs (tax + tips).
Dashboard	Job list, completion toggle, earnings summary.
Re-book Loop	Post-job SMS → “Book again in 2/4 weeks”.
Analytics	Simple KPIs: jobs per week, revenue, no-shows.
Future (v2)

Recurring bookings, QuickBooks sync, review widgets, route optimization.

4. Architecture
Stack

Frontend: Next.js 15 / React / TailwindCSS

Backend & DB: Supabase (Postgres + Auth + Storage)

Payments: Stripe U.S.

Messaging: Twilio 10DLC SMS (+ Resend email fallback)

Hosting: Vercel

Analytics: PostHog

Monitoring: Sentry

Data Model (simplified)
users(id, name, email, phone, role, stripe_customer_id)
services(id, user_id, title, price, duration, buffer_minutes)
bookings(id, service_id, customer_id, date_time, address, notes,
         status[pending|confirmed|completed|cancelled],
         payment_status[unpaid|deposit|paid])
payments(id, booking_id, amount, status, transaction_id)
messages(id, booking_id, type, channel, sent_at)

API Endpoints
Endpoint	Method	Purpose
/api/auth/signup	POST	Register user
/api/services	GET/POST	CRUD services
/api/bookings	GET/POST	Manage bookings
/api/payments/initialize	POST	Create Stripe PaymentIntent
/api/payments/verify	POST	Confirm payment
/api/notifications/send	POST	Dispatch SMS/email
5. Business Logic

Provider creates service list.

Customer books → system checks slot availability + buffer.

Stripe Checkout (deposit/full) → booking status = confirmed.

Twilio sends confirmation + reminders.

After job: provider marks complete → system issues receipt + rebook SMS.

6. KPIs

Activation (publish + first booking ≤ 48 h) ≥ 40 %

No-show reduction ≥ 30 %

WAU/MAU ≥ 45 %

Free → Paid conversion 8–12 %

Churn ≤ 5 %/mo

7. Compliance

TCPA/CTIA-registered 10DLC; opt-in/out, quiet hours.

PCI via Stripe; PII encrypted at rest.

WCAG 2.1 AA UI accessibility.

8. Deployment

Supabase project → env vars on Vercel.

Webhooks: payment_intent.succeeded, booking.created.

Logging → Supabase table + Sentry.

9. Folder Layout
/app
 ├── booking/[username]
 ├── dashboard/
 └── api/
 /lib (stripe.ts, supabase.ts, twilio.ts)
 /components
 /tests
 README.md

10. Success Definition

≥ 1 000 paying providers @ $19 ARR = $228 K annualized.

10-minute onboarding.

4.6 ★ average satisfaction.