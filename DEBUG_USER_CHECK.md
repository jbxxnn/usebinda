# Debug: Check User Record

## Step 1: Verify Database Tables Exist

Go to your Supabase Dashboard:
1. Open https://app.supabase.com
2. Select your project
3. Go to **Table Editor** (left sidebar)
4. You should see these tables:
   - `users`
   - `services`
   - `bookings`
   - `payments`
   - `messages`

**If tables don't exist:** Run the migration from `supabase/migrations/001_core_schema.sql` in the SQL Editor.

---

## Step 2: Check Your User Record

In Supabase Dashboard:
1. Go to **Table Editor**
2. Click on the `users` table
3. Look for your account (by email)

**What to check:**
- Does a row exist with your email?
- What is the `username` column value? (should be "jbxxnn")
- What is the `role` column value? (should be "provider")

---

## Step 3: If User Record Doesn't Exist

The trigger should auto-create it. Let's verify the trigger exists:

1. Go to **SQL Editor**
2. Run this query:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check your user record
SELECT id, email, name, username, role, created_at 
FROM public.users 
WHERE email = 'your_email@example.com';  -- Replace with your email
```

---

## Step 4: If Username is NULL/Empty

This means the username wasn't saved. Let's manually set it:

In **SQL Editor**, run:

```sql
-- Replace 'your_email@example.com' and 'jbxxnn' with your actual values
UPDATE public.users 
SET username = 'jbxxnn', role = 'provider'
WHERE email = 'your_email@example.com';

-- Verify it worked
SELECT id, email, name, username, role 
FROM public.users 
WHERE email = 'your_email@example.com';
```

---

## Step 5: Test Again

After setting the username:
1. Visit http://localhost:3000/jbxxnn in a private window
2. You should see your services (or "No services available")
3. No login required!

---

## Common Issues

### Issue: User record doesn't exist at all

**Solution:** The auth trigger might not have fired. Manually create the user:

```sql
-- Get your auth user ID
SELECT id, email FROM auth.users WHERE email = 'your_email@example.com';

-- Create user record (replace the UUID with your actual auth.users id)
INSERT INTO public.users (id, name, email, username, role)
VALUES (
  'your-uuid-from-above',  -- Replace this
  'Your Name',              -- Replace this
  'your_email@example.com', -- Replace this
  'jbxxnn',                 -- Your username
  'provider'                -- Role
);
```

### Issue: "Username already taken" when trying to save

Someone else might have that username. Try a different one like `jbxxnn2`.

---

## Next Steps

Once you confirm the username is in the database, the page should work!

Let me know what you find in the `users` table and I can help further.

