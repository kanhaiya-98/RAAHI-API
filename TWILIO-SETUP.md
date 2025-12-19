# Twilio SMS Setup Guide

## Issue: Trial Account Limitations

Twilio **trial accounts** can only send SMS to **verified phone numbers**.

Error you might see:
```
The number +91XXXXXXXXXX is unverified. Trial accounts cannot send messages to unverified numbers
```

## Solutions

### Option 1: Development Mode (Recommended for Testing)

**No SMS needed!** OTPs are logged to console instead.

In your `.env` file:
```env
NODE_ENV=development
DISABLE_SMS=true
```

Then restart server:
```powershell
npm run dev
```

**OTPs will appear in the terminal** where `npm run dev` is running:
```
[INFO]: 📱 SMS (DEV MODE) - Message: Your RAAHI verification code is: 123456
```

### Option 2: Verify Phone Numbers

1. Go to [Twilio Console](https://www.twilio.com/console/phone-numbers/verified)
2. Click **Verify a Number**
3. Enter phone number (e.g., +919326650454)
4. Receive verification code
5. Enter code to verify

You can verify up to **10 numbers** on trial account.

### Option 3: Upgrade to Paid Account

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Click **Upgrade**
3. Add payment method
4. Can now send to ANY number

**Cost:** ~$0.0075 per SMS in India

## Quick Fix for Testing

Add to `.env`:
```env
DISABLE_SMS=true
```

Restart server and all OTPs will log to console! ✅

## Production Deployment

For production, ensure:
```env
NODE_ENV=production
DISABLE_SMS=false
```

And either:
- Use paid Twilio account, OR
- Pre-verify all user phone numbers
