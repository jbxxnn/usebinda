# 🇺🇸 Binda — The Solo Home-Service Operator’s OS

**Tagline:** “Get booked, get paid, get rebooked — all from your phone.”

Binda is a lightweight SaaS for **independent home-service professionals** in the United States — cleaners, handymen, mobile detailers, and repair pros — who are tired of juggling calls, texts, and cash payments.

We help them:
- Accept online bookings
- Collect deposits and payments automatically
- Reduce no-shows with automated reminders
- Rebook repeat customers in one tap

Built for the solo operator, not the enterprise.

---

## 🚀 Overview

### Problem
In the U.S., over **6 million home-service professionals** run on text messages, Google Calendar, and luck. They lose time, forget appointments, and eat costs from no-shows.

Existing tools fail them:
- **Calendly**: too generic (for meetings, not jobs)
- **Housecall Pro / Jobber**: too complex and expensive
- **Square Appointments**: salon-focused, not mobile trades
- **Thumbtack / Angi**: marketplaces that *own the customer*

### Solution
Binda gives pros their own booking link, automates payments and reminders, and runs entirely from a phone.

> “It’s like Calendly met Stripe and Twilio, had a kid, and raised it to fix your scheduling chaos.”

---

## 🧩 Core MVP (Day-1 Scope)

| Feature | Description | Status |
|----------|--------------|--------|
| **Public Booking Page** | `binda.app/username` with service list, durations, travel buffer, ZIP filtering | ✅ MVP |
| **Smart Scheduling Engine** | Prevent double bookings, block travel time, handle time zones | ✅ MVP |
| **Deposits & Payments** | Stripe integration (cards, Apple Pay, Google Pay) | ✅ MVP |
| **SMS Workflow** | Confirmations, reminders, “On my way” messages (TCPA-compliant) | ✅ MVP |
| **Receipts & Invoices** | Auto-generated PDF receipts with tax & tips | ✅ MVP |
| **Rebook Loop** | Post-job SMS with “Book again in 2/4 weeks” | ✅ MVP |
| **Analytics** | Basic dashboard: jobs/week, revenue, no-show rate | ✅ MVP |
| **10-min Setup Flow** | Provider to first booking under 10 minutes | ✅ KPI |

---

## 🧱 Tech Stack

| Layer | Technology | Reason |
|-------|-------------|--------|
| **Frontend** | Next.js 15 + React + TailwindCSS | Modern, scalable, mobile-friendly |
| **Backend / DB** | Supabase (Postgres + Auth + Storage) | Fast setup, managed Postgres, RLS |
| **Payments** | Stripe (U.S. only) | Reliable, Apple Pay & card-on-file support |
| **Messaging** | Twilio SMS (10DLC registered) + Resend (email fallback) | TCPA-safe communication |
| **Hosting** | Vercel | Zero-config deployment |
| **PDF & Files** | React-PDF + Supabase Storage | Receipts, invoices |
| **Analytics** | PostHog | Activation + retention funnels |
| **Monitoring** | Sentry | Error tracking |
| **CI/CD** | GitHub Actions | Test + deploy automation |

---

## 🧮 Core Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | text | Provider’s full name |
| email | text | Login |
| phone | text | SMS number (A2P verified) |
| role | enum('provider','customer') | Role type |
| created_at | timestamp | Auto |
| stripe_customer_id | text | Stripe reference |

### `services`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Provider |
| title | text | e.g., “2-Hour Cleaning” |
| price | numeric | e.g., 100.00 |
| duration | integer | Minutes |
| buffer_minutes | integer | Travel buffer |
| active | boolean | Default true |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| service_id | UUID | FK |
| customer_id | UUID | FK |
| date_time | timestamp | Appointment start |
| address | text | Job location |
| notes | text | Optional |
| status | enum('pending','confirmed','completed','cancelled') | Job status |
| payment_status | enum('unpaid','deposit','paid','refunded') | |
| policy_id | UUID | Linked policy |

### `payments`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| booking_id | UUID | FK |
| amount | numeric | In USD |
| status | enum('pending','succeeded','failed') | Stripe status |
| transaction_id | text | Stripe PaymentIntent ID |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| booking_id | UUID | FK |
| type | enum('confirmation','reminder','rebook','review') | Message type |
| channel | enum('sms','email') | |
| sent_at | timestamp | Auto |

---

## 🧠 Key Design Principles

1. **Mobile-first everything** — usable entirely from a phone.  
2. **Ten-minute value** — provider publishes link + first booking fast.  
3. **No jargon** — “Job,” not “event.” “Customer,” not “lead.”  
4. **SMS-native UX** — America doesn’t use WhatsApp for business.  
5. **Lean tech** — avoid microservices, stick to boring stack.  
6. **Trust by transparency** — clear pricing, no lock-in, data export any time.  

---

## 🧾 Pricing

| Tier | Price | Designed For | Key Features |
|------|--------|---------------|---------------|
| **Free** | $0 | New solos | 10 bookings/mo, Binda branding, deposits |
| **Starter** | $19/mo | Active operators | Unlimited bookings, no-show automation, rebook SMS |
| **Pro** | $39/mo | Growth stage | Card-on-file, add-ons, reports, branding, review booster |

**Payments:** Standard Stripe fees (2.9% + 30¢).  
Optional $0.50 per-booking fee on Free tier.

---

## ⚙️ Product Roadmap (90 Days)

### **Phase 1 — Ship the Spine (0–30 days)**
- Build booking engine (services, slots, customers, payments)
- Implement Twilio + Stripe integration
- Deploy on Vercel + Supabase
- Internal smoke test flow: signup → publish → book → pay → receipt

### **Phase 2 — Monetize & Retain (31–60 days)**
- Add deposits, no-show automation, and review booster
- Launch first paid tier ($19/mo)
- Track metrics: activation (publish link), first booking, payment success

### **Phase 3 — GTM & Case Studies (61–90 days)**
- Target **Cleaners + Handymen** first
- Launch pilots in **Phoenix, Dallas, Tampa**
- Collect testimonials and 10 early case studies
- Optimize conversion funnel: trial → paid

---

## 📈 KPIs

| Metric | Target |
|--------|--------|
| Activation (publish link + 1 booking <48h) | ≥ 40% |
| No-show reduction | -30% vs baseline |
| WAU/MAU | ≥ 45% |
| Free → Paid conversion | 8–12% |
| CSAT | ≥ 4.6 / 5 |
| NPS | ≥ 40 |
| Churn (month 6) | ≤ 5% |

---

## 🔒 Compliance & Legal

- **SMS Compliance:** TCPA/CTIA 10DLC registered; opt-in/out logic required.  
- **Payments:** PCI-DSS handled via Stripe.  
- **Data Privacy:** No sale of customer data; encrypted at rest.  
- **Accessibility:** WCAG 2.1 AA responsive interface.  
- **Tax:** Automated sales tax collection (Stripe Tax optional).  

---

## 🧭 Go-To-Market Strategy

### Channels
1. **YouTube & TikTok creators** (cleaning business, handyman coaches) — affiliate 20% revenue share.  
2. **Facebook Groups** — “House Cleaning Tips,” “Handyman Pros USA” seeding posts with ROI examples.  
3. **Google Ads** — long-tail: “handyman booking app,” “reduce no-shows cleaning.”  
4. **SEO & content** — “Best booking apps for small cleaning business.”  
5. **Tool rental stores / supply shops** — flyers + QR sign-up.

### Messaging Example
> “Two missed jobs a month? That’s $300 gone.  
> Binda fixes that for $19.”

### Retention Levers
- Feature-gated upsells (review booster, card-on-file)  
- Pause plan (keep data free)  
- SMS fee credits for milestones (e.g., 20 reviews)  
- Quarterly “Playbooks” email — how top pros use Binda

---

## 🧠 Risk & Mitigation

| Risk | Mitigation |
|------|-------------|
| SMS spam complaints | Strict opt-in, quiet hours, STOP keyword, registered 10DLC |
| Chargebacks | Preauth deposits, clear cancellation policy, Stripe evidence packet |
| Feature bloat | Ship guardrails, enforce “10-min setup” rule |
| Seasonality churn | Pause subscription feature |
| Integration creep | Maintain 1-core-integration-per-function (Stripe, Twilio, Supabase) |

---

## 🏗️ Architecture

```mermaid
graph TD
A[Customer Booking Page] --> B[Booking API]
B --> C[(Supabase DB)]
B --> D[Stripe Checkout]
D --> C
B --> E[Twilio SMS Service]
E --> C
F[Provider Dashboard] --> C
F --> B

🧰 Developer Setup
Prerequisites

Node.js 18+

npm / yarn

Supabase project

Stripe + Twilio test keys

Install & Run

git clone https://github.com/yourusername/binda.git
cd binda
npm install
cp .env.example .env.local
# Fill with Supabase, Stripe, Twilio keys
npm run dev

Environment Variables

| Key                           | Description            |
| ----------------------------- | ---------------------- |
| NEXT_PUBLIC_SUPABASE_URL      | Supabase project URL   |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key      |
| STRIPE_SECRET_KEY             | Stripe key             |
| TWILIO_ACCOUNT_SID            | Twilio account SID     |
| TWILIO_AUTH_TOKEN             | Twilio auth token      |
| TWILIO_PHONE                  | Verified A2P number    |
| RESEND_API_KEY                | Email fallback         |
| POSTHOG_API_KEY               | Analytics key          |
| BASE_URL                      | App URL (for webhooks) |


🧩 Folder Structure

/binda
 ├── /app
 │   ├── (public) booking pages
 │   ├── dashboard/
 │   └── api/ (server actions)
 ├── /components
 ├── /lib
 │   ├── supabase.ts
 │   ├── stripe.ts
 │   ├── twilio.ts
 │   └── utils.ts
 ├── /styles
 ├── /tests
 ├── README.md
 ├── .env.example
 ├── next.config.js
 └── package.json


🤝 Team Workflow

PM/Founder — sets KPIs, handles user interviews

Fullstack Dev — ships MVP, iterates weekly

Designer — mobile-first UI + branding

Growth Lead — content, partners, feedback loops

Customer Success — onboarding, NPS, feature feedback

Weekly sprint cadence, biweekly release.

💬 Tagline Library (for marketing)

“Stop chasing clients. Let them chase your calendar.”

“Your schedule, your payments, your customers — not Thumbtack’s.”

“The OS for cleaners and handymen who hate admin work.”

“Binda turns texts into bookings — automatically.”

🪪 License

MIT License — Free for personal and commercial use.
Attribution appreciated.

Binda — built for the 6 million Americans who do the real work, not the desk work.


---

Would you like me to also generate the **`.env.example`** and a **`/docs/architecture.md`** to match this README (for your GitHub repo)? That would complete your MVP developer setup.
#   u s e b i n d a  
 