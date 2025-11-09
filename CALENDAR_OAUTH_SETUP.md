# Calendar OAuth Setup Guide

This guide will walk you through setting up OAuth credentials for Google Calendar and Microsoft Outlook integration in Binda.

## 📋 Prerequisites

- A Google account (for Google Calendar)
- A Microsoft account (for Outlook Calendar)
- Access to Google Cloud Console
- Access to Microsoft Azure Portal

## 🔵 Google Calendar OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `Binda Calendar Integration`
4. Click "Create"

### Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required fields:
   - **App name**: `Binda`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click "Save and Continue"
5. Skip "Scopes" for now, click "Save and Continue"
6. Add your email as a test user, click "Save and Continue"
7. Review and submit (for testing, you can skip verification)

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: `Binda Web Client`
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/calendar/auth/google/callback` (for development)
     - `https://yourdomain.com/api/calendar/auth/google/callback` (for production)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### Step 5: Configure OAuth Scopes

1. Go back to "OAuth consent screen"
2. Click "Edit App"
3. Go to "Scopes" tab
4. Click "Add or Remove Scopes"
5. Add these scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`
   - `https://www.googleapis.com/auth/calendar.events` (for creating events)
6. Click "Update" → "Save and Continue"

## 🔷 Microsoft Outlook OAuth Setup

### Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Configure:
   - **Name**: `Binda Calendar Integration`
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: 
     - Type: Web
     - URI: `http://localhost:3000/api/calendar/auth/outlook/callback` (for development)
5. Click "Register"

### Step 2: Configure Application Settings

1. In your app registration, go to "Overview"
2. Copy the **Application (client) ID** and **Directory (tenant) ID**
3. Go to "Certificates & secrets" → "New client secret"
4. Add description: `Binda Calendar Secret`
5. Choose expiration (recommend 24 months)
6. Click "Add" and copy the **Value** (this is your client secret)

### Step 3: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Choose "Microsoft Graph"
4. Select "Delegated permissions"
5. Add these permissions:
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `User.Read` (should be there by default)
6. Click "Add permissions"
7. Click "Grant admin consent" (if you have admin rights)

### Step 4: Configure Authentication

1. Go to "Authentication"
2. Under "Redirect URIs", add:
   - `http://localhost:3000/api/calendar/auth/outlook/callback` (development)
   - `https://yourdomain.com/api/calendar/auth/outlook/callback` (production)
3. Under "Advanced settings":
   - Enable "Allow public client flows": **No**
   - Enable "Live SDK support": **Yes**
4. Click "Save"

## 🔧 Environment Variables Setup

Add these to your `.env.local` file:

```bash
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/auth/google/callback

# Microsoft Outlook OAuth
OUTLOOK_CLIENT_ID=your_outlook_client_id_here
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret_here
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/calendar/auth/outlook/callback
```

## 📝 Important Notes

### Google Calendar
- **Quota Limits**: Google Calendar API has rate limits (1,000,000 requests per day)
- **Scopes**: The scopes we're using are read-only for calendar data and read-write for events
- **Testing**: You can test with up to 100 users without verification

### Microsoft Outlook
- **Permissions**: The permissions we're requesting are standard calendar permissions
- **Tenant ID**: For personal Microsoft accounts, use `common` as tenant ID
- **Rate Limits**: Microsoft Graph has generous rate limits (10,000 requests per 10 minutes)

### Security Considerations
- **Never commit secrets**: Keep your `.env.local` file out of version control
- **Use HTTPS in production**: OAuth requires HTTPS for production redirects
- **Rotate secrets regularly**: Update your client secrets periodically
- **Monitor usage**: Keep an eye on API usage in both consoles

## 🚀 Testing the Integration

1. Start your development server: `npm run dev`
2. Go to `/dashboard/availability` in your app
3. Look for the "Connect Calendar" section
4. Click "Google Calendar" or "Outlook Calendar"
5. Complete the OAuth flow
6. Verify that your calendar appears in the connected calendars list

## 🔍 Troubleshooting

### Common Google Calendar Issues
- **"Access blocked"**: Make sure your app is in testing mode and your email is added as a test user
- **"Invalid redirect URI"**: Double-check the redirect URI in both your code and Google Console
- **"Insufficient permissions"**: Ensure all required scopes are added and approved

### Common Outlook Issues
- **"AADSTS" errors**: Usually related to redirect URI mismatch or app registration issues
- **"Insufficient privileges"**: Make sure admin consent is granted for the required permissions
- **"Invalid client"**: Verify your client ID and secret are correct

### General Issues
- **CORS errors**: Make sure your redirect URIs are properly configured
- **Token refresh failures**: Check that refresh tokens are being stored and used correctly
- **API rate limits**: Implement proper error handling and retry logic

## 📞 Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your OAuth apps are properly configured
4. Test with a fresh OAuth flow to rule out token issues

## 🔄 Production Deployment

When deploying to production:
1. Update redirect URIs in both Google and Microsoft consoles
2. Use your production domain in environment variables
3. Consider implementing proper error monitoring
4. Set up automated secret rotation if needed
5. Monitor API usage and costs

---

**Note**: This setup is for development/testing. For production use with many users, you may need to go through app verification processes for both Google and Microsoft.

