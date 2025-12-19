# 🚀 RAAHI API - Setup Guide for Contributors

Welcome to RAAHI API! This guide will help you get started quickly.

## 📋 Prerequisites

- Node.js v18+ installed
- Supabase account (free tier works!)
- Google Gemini API key
- Twilio account (optional for SMS)

## ⚡ Quick Setup (5 minutes)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd raahi-api
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Update `.env` with your credentials:
```env
# Required
GEMINI_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_KEY=your_key_here
JWT_SECRET=your-random-32-character-secret

# For SMS (optional)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Setup Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project (or use existing)
3. Navigate to SQL Editor
4. Copy content from `database/migration.sql`
5. Paste and Run
6. Verify 7 tables created ✅

### 4. Start Server

```bash
npm run dev
```

Server runs on http://localhost:5000

### 5. Test Everything

```powershell
.\test-complete.ps1
```

This runs 15+ tests covering all features!

## 🔑 Getting API Keys

### Gemini API (Free)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API Key
3. Copy to `.env`

### Twilio (Free Trial)
1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Get Account SID, Auth Token, Phone Number
3. Add to `.env`

### Supabase (Free)
1. Create project at [Supabase](https://supabase.com)
2. Get URL from Settings → API
3. Get Service Role Key from Settings → API
4. Add to `.env`

## 📚 Documentation

- **API Docs**: See `API_DOCS.md`
- **Quick Start**: See `QUICK-START.md`
- **Full README**: See `README.md`

## 🧪 Testing

### Quick Test
```powershell
.\test-api.ps1
```

### Complete Test Suite
```powershell
.\test-complete.ps1
```

### Manual Test
```bash
# Health check
curl http://localhost:5000/health

# Test AI
curl -X POST http://localhost:5000/api/test/ai-classification \
  -H "Content-Type: application/json" \
  -d '{"task_description": "AC not working", "location": "Mumbai"}'
```

## 🎯 Key Features

- ✅ AI Task Classification (Gemini)
- ✅ AI Price Estimation
- ✅ AI Bid Analysis
- ✅ Phone OTP Authentication
- ✅ Real SMS Notifications (Twilio)
- ✅ Complete Marketplace APIs
- ✅ Geolocation Search
- ✅ Review System

## 📝 Project Structure

```
raahi-api/
├── src/
│   ├── config/       # Database & AI setup
│   ├── controllers/  # API logic
│   ├── middleware/   # Auth, errors
│   ├── routes/       # API endpoints
│   ├── services/     # AI, SMS services
│   └── utils/        # Helpers
├── database/         # SQL migrations
└── logs/            # Server logs
```

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test with `.\test-complete.ps1`
4. Submit PR

## ⚠️ Common Issues

**Issue**: `gemini-pro not found`
**Fix**: Already using `gemini-2.5-flash-lite` ✅

**Issue**: SMS not sending
**Fix**: Check Twilio credentials in `.env`

**Issue**: Database errors
**Fix**: Run `database/migration.sql` in Supabase

## 🆘 Need Help?

1. Check `API_DOCS.md`
2. Run health check: `curl http://localhost:5000/health`
3. Check logs: `logs/combined.log`

## 🎉 Ready!

Your RAAHI API is ready to use! Start building amazing features! 🚀
