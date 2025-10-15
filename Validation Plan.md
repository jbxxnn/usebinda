📗 Binda 30-Day Validation Plan – Technical & Operational Documentation
Purpose

Run a 30-day controlled validation sprint to prove user adoption, willingness to pay, and measurable ROI (fewer no-shows, faster payments).

1. High-Level Flow
Week	Goal	Deliverable
1	Ship minimal live MVP	Functional booking + payment
2	Recruit 20–30 providers	Sign-ups & active links
3	Capture real bookings	Screenshots, Stripe transactions
4	Measure retention & ROI	Case studies, decision report
2. MVP Specification (for validation)

Required endpoints & logic only

/api/book → creates booking + sends SMS confirmation

/api/pay → Stripe PaymentIntent (deposit optional)

/api/complete → marks job done + issues receipt

/api/rebook → sends follow-up SMS in 7/14 days

/api/analytics → return bookings & payments per user

No admin panel, no multi-user logic.

3. Data to Capture
Table	Key Fields	Metric
users	id, signup_date	Signups/day
bookings	date_time, status	Activation funnel
payments	amount, status	Revenue per user
messages	type, sent_at	Reminder success rate
4. Success Metrics (Go/No-Go)
Metric	Threshold	Source
Landing-page signups	≥ 100	Plausible/GA
Published booking links	≥ 25	Supabase users table
First paid booking	≥ 10	Stripe transactions
Retained 2 weeks	≥ 70 %	Active bookings count
Pay intent (“Would pay $19?”)	≥ 50 % “Yes”	Survey table
No-show reduction	≥ 30 %	Self-reported feedback
5. Tooling & Automation

Tracking: PostHog event pipeline (signup, publish_link, first_booking, first_payment).

CRM: simple Notion/Sheet with contact, feedback, activity.

Analytics dashboard: Supabase SQL → Chart.js embedded.

Feedback form: Typeform / Supabase “feedback” table.

6. Recruitment Workflow

Launch landing page with ROI calculator.

Post/DM in Facebook groups, Reddit, and YouTube creator collabs.

Offer: “Free for first month in exchange for feedback.”

Auto-onboard via /signup?cohort=alpha1.

7. Feedback Collection

feedback table: user_id, pain_point, liked, confused, would_pay (boolean).

Weekly summary script sends Slack digest to founders.

8. Reporting Deliverables

At day 30, generate:

Validation report: metrics + charts + quotes.

ROI case study: 2 stories with numbers (e.g., “Cleaner A saved $250/mo”).

Investor data pack: CAC vs LTV projection sheet.

Go/No-Go memo: recommendation with reasons.

9. Automation & AI-Coder Directives

When implementing in Vibe Coding:

Build environment scripts for Supabase + Vercel.

Generate endpoints & tests automatically from schema above.

Add event logging hooks to every API action.

Prioritize functional deployment over aesthetics.

Output validation metrics daily to /reports/summary.json.

10. End Criteria

If ≥ 20 active providers and ≥ 10 paid bookings, proceed to Post-Validation Build (v1.0); else iterate or pivot.