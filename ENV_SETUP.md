# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
# Get these from your Supabase project settings: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
# Get these from Stripe dashboard: https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Twilio Configuration
# Get these from Twilio console: https://console.twilio.com/
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Configuration (Resend)
# Get API key from: https://resend.com/api-keys
RESEND_API_KEY=re_your_resend_api_key

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: Analytics (PostHog)
# NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
# NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Optional: Error Tracking (Sentry)
# SENTRY_DSN=your_sentry_dsn
```

## Setup Instructions

### 1. Supabase (Already Configured)
Your Supabase project is already set up. Find your keys in the [Supabase Dashboard](https://app.supabase.com).

### 2. Stripe Account Setup
1. Go to [Stripe](https://stripe.com) and create an account
2. Use **Test Mode** for development
3. Get your API keys from the [API Keys page](https://dashboard.stripe.com/test/apikeys)
4. For webhooks, you'll need to install Stripe CLI or use the dashboard

### 3. Twilio Account Setup
1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Get a phone number (trial account works for testing)
3. For production SMS, apply for [10DLC registration](https://www.twilio.com/docs/sms/a2p-10dlc) (takes 2-4 weeks)
4. During development, use the sandbox mode with verified phone numbers

### 4. Resend Email Setup
1. Sign up at [Resend](https://resend.com)
2. Create an API key
3. Verify your domain (or use their test domain for development)

## Testing Without Real Accounts

During development, you can:
- Skip Stripe integration temporarily (we'll add mock mode)
- Skip Twilio and use console logging for SMS
- Use Resend's test mode for emails

The app will degrade gracefully if these services aren't configured.


