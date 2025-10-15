# Binda MVP - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (already set up)
- Stripe account (for payments - can skip initially)
- Twilio account (for SMS - can skip initially)

---

## Step 1: Database Setup

### Run the Migration

1. Open your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project → **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/migrations/001_core_schema.sql`
5. Paste and click **Run**
6. Verify tables were created in **Table Editor**

You should see these tables:
- `users`
- `services`
- `bookings`
- `payments`
- `messages`

---

## Step 2: Environment Variables

1. Copy `.env.local.example` (or use `ENV_SETUP.md` template)
2. Fill in your Supabase keys (already have these)
3. For now, leave Stripe/Twilio empty - app will work without them

Minimum required:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Step 3: Install & Run

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

---

## Step 4: Test the Provider Flow

### A. Create Provider Account

1. Go to http://localhost:3000/auth/sign-up
2. Enter email and password
3. Check email for confirmation link
4. Click confirm link

### B. Set Up Profile

1. After login, you'll be at `/dashboard`
2. Click **Settings** in sidebar
3. Set your username (e.g., "john-cleaner")
   - This becomes your booking link
4. Add your name and phone number
5. Save changes

### C. Create a Service

1. Go to **Services** in sidebar
2. Click **Add Service**
3. Fill in details:
   - Title: "2-Hour House Cleaning"
   - Description: "Deep clean of 2-bedroom home"
   - Price: 120 (in dollars)
   - Duration: 120 (in minutes)
   - Buffer: 30 (travel time in minutes)
   - Service Areas: "10001, 10002" (optional ZIP codes)
4. Click **Create Service**

---

## Step 5: Test the Customer Booking Flow

### A. Visit Public Booking Page

1. Open a new private/incognito window (or logout)
2. Go to: http://localhost:3000/[your-username]
   - Example: http://localhost:3000/john-cleaner
3. You should see your service listed

### B. Book a Service

1. Click **Book Now** on a service
2. Fill out customer information:
   - Name, email, phone
   - Service address
   - ZIP code (must match service areas if specified)
   - Optional notes
3. Click **Continue to Date & Time**
4. Select a date from the grid
5. Select an available time slot
6. Click time slot to confirm
7. Review booking details
8. Click **Proceed to Payment**

**Note:** Payment page is not yet implemented. You'll see an error. This is expected!

---

## Step 6: View Bookings

1. Go back to provider dashboard
2. Click **Bookings** in sidebar
3. You should see the booking you just created
4. Status will be "pending" until payment is completed
5. You can:
   - Mark as complete
   - Cancel booking
   - View customer details

---

## 🎯 What's Working

✅ **Provider Features:**
- Account creation and login
- Username setup
- Service management (create, edit, delete)
- Booking view and status management
- Dashboard statistics

✅ **Customer Features:**
- Browse provider's services
- Multi-step booking form
- Date and time selection
- Real-time availability checking
- ZIP code validation

✅ **System Features:**
- Database with RLS policies
- Time slot generation
- Conflict detection
- Responsive mobile design

---

## ❌ What's Not Yet Implemented

⏳ **Payment Processing:**
- Stripe integration pending
- Bookings can be created but won't be confirmed without payment

⏳ **SMS Notifications:**
- Twilio integration pending
- No automated messages yet

⏳ **Email Notifications:**
- Resend integration pending
- No email confirmations yet

⏳ **Receipts:**
- PDF generation pending

⏳ **Analytics:**
- Dashboard metrics are basic
- No advanced analytics yet

---

## 🐛 Troubleshooting

### Database Error
**Problem:** Can't create services or bookings
**Solution:** Make sure you ran the migration SQL in Supabase

### Username Already Taken
**Problem:** Error when setting username
**Solution:** Usernames must be unique. Try a different one.

### Can't See Services on Public Page
**Problem:** Services don't show on /[username]
**Solution:** 
- Make sure service is marked "Active"
- Check that username is set correctly in settings

### Time Slots Not Loading
**Problem:** Date picker works but no times show
**Solution:**
- Check browser console for errors
- Make sure /api/availability route is working
- Try a different date (past dates won't have slots)

---

## 📝 Next Development Steps

1. **Payment Integration (Phase 4)**
   - Add Stripe Elements to payment page
   - Create payment intent
   - Handle webhooks
   - Update booking status on payment

2. **SMS Automation (Phase 5)**
   - Set up Twilio
   - Create confirmation messages
   - Add reminder scheduling
   - Create cron job

3. **Final Polish (Phase 6)**
   - Add receipt generation
   - Improve analytics
   - Add error handling
   - Mobile testing

---

## 🤝 Need Help?

- Check `IMPLEMENTATION_PROGRESS.md` for detailed status
- Review API routes in `app/api/` for endpoint details
- Check browser console for frontend errors
- Check terminal for backend errors

---

## 📚 Project Structure

```
binda/
├── app/
│   ├── [username]/          # Public booking pages
│   ├── api/                 # API routes
│   ├── auth/                # Authentication pages
│   └── dashboard/           # Provider dashboard
├── components/
│   ├── booking/             # Customer booking components
│   ├── bookings/            # Provider booking management
│   ├── services/            # Service management
│   ├── settings/            # Settings components
│   └── ui/                  # Base UI components
├── lib/
│   ├── database.ts          # Database queries
│   ├── scheduling.ts        # Time slot logic
│   ├── stripe.ts            # Payment helpers
│   ├── twilio.ts            # SMS helpers
│   ├── resend.ts            # Email helpers
│   ├── types.ts             # TypeScript types
│   └── validation.ts        # Form validation
└── supabase/
    └── migrations/          # Database migrations
```

---

Ready to continue development? Start with Phase 4 (Payment Integration)!


