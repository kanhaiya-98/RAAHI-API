# 🚀 RAAHI API - AI-Powered Service Marketplace

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Complete backend API for an AI-powered home services marketplace with intelligent task classification, dynamic pricing, and automated bid analysis.

---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Smart Task Classification** - Automatically categorizes service requests (AC Repair, Plumbing, Electrical, etc.)
- **Dynamic Price Estimation** - AI generates accurate price ranges based on complexity, location, and market rates
- **Intelligent Bid Analysis** - Recommends best bids considering value, speed, and provider ratings
- **Multi-Language Support** - Works with Hindi, English, and Hinglish inputs

### 🔐 Authentication & Security
- **Phone OTP Verification** - Secure authentication via Twilio SMS
- **JWT Tokens** - Stateless session management
- **Role-Based Access Control** - Separate permissions for customers and providers
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Security Headers** - Helmet.js for comprehensive HTTP security

### 📱 Complete Marketplace Features
- **Task Management** - Post, browse, update, and track service requests
- **Smart Bidding** - Providers submit competitive bids with AI validation
- **Booking System** - Complete lifecycle from scheduled → in progress → completed
- **Review & Ratings** - 5-star rating system with automatic provider score updates
- **Real-time SMS** - Notifications for all key events (bids, bookings, updates)

### 🌍 Location Features
- **Geolocation Search** - Find tasks/providers within 5km radius
- **Distance Calculation** - Accurate Haversine formula implementation
- **City-Based Pricing** - Automatic price adjustments for Mumbai, Delhi, Bangalore, etc.

---

## 🏗️ Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (gemini-2.5-flash-lite)
- **SMS**: Twilio
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Logging**: Winston + Morgan

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Supabase account (free tier)
- Google Gemini API key (free)
- Twilio account (optional for SMS)

### 1. Clone & Install

```bash
git clone https://github.com/kanhaiya-98/raahi-api.git
cd raahi-api
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Server
PORT=5000
NODE_ENV=development

# Google Gemini AI (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Database (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# JWT Secret (Required - Generate a random 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Twilio SMS (Optional - For real SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# URLs
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### 3. Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open SQL Editor
3. Copy content from `database/migration.sql`
4. Paste and Run
5. Verify 7 tables created ✅

### 4. Start Server

```bash
npm run dev
```

Server runs on **http://localhost:5000**

### 5. Test Everything

```powershell
# Windows PowerShell
.\test-complete.ps1

# Or quick test
.\test-api.ps1
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [API_DOCS.md](API_DOCS.md) | Complete API reference (42 endpoints) |
| [SETUP-GUIDE.md](SETUP-GUIDE.md) | Detailed setup instructions |
| [QUICK-START.md](QUICK-START.md) | PowerShell commands reference |
| [SHARING-GUIDE.md](SHARING-GUIDE.md) | How to share this project |

---

## 🎯 API Endpoints Overview

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and get JWT
- `GET /api/auth/me` - Get current user

### Tasks  
- `POST /api/tasks` - Create task (AI-powered classification)
- `GET /api/tasks` - List tasks
- `GET /api/tasks/nearby` - Find nearby tasks (providers)
- `GET /api/tasks/:id` - Get task details

### Bidding
- `POST /api/bids` - Submit bid (providers)
- `GET /api/bids/task/:taskId` - View task bids
- `POST /api/bids/:id/accept` - Accept bid (creates booking)
- `POST /api/bids/:id/reject` - Reject bid

### Bookings
- `GET /api/bookings` - List bookings
- `PATCH /api/bookings/:id/start` - Start job
- `PATCH /api/bookings/:id/complete` - Complete job
- `PATCH /api/bookings/:id/cancel` - Cancel booking

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/provider/:id` - Provider reviews
- `DELETE /api/reviews/:id` - Delete review (24hr window)

### Search
- `GET /api/search/tasks` - Advanced task search
- `GET /api/search/providers` - Find providers
- `GET /api/search/statistics/platform` - Platform stats

**Total**: 42 production endpoints + 5 test endpoints

See [API_DOCS.md](API_DOCS.md) for complete documentation.

---

## 🧪 Testing

### Automated Test Suite

```powershell
.\test-complete.ps1
```

Tests 16 features:
- ✅ System health (3 tests)
- ✅ AI services (2 tests)
- ✅ Authentication (3 tests)
- ✅ Task management (3 tests)
- ✅ Search & statistics (3 tests)
- ✅ User profiles (2 tests)

### Manual Testing

```bash
# Health check
curl http://localhost:5000/health

# Test AI classification
curl -X POST http://localhost:5000/api/test/ai-classification \
  -H "Content-Type: application/json" \
  -d '{"task_description": "AC not cooling", "location": "Mumbai"}'
```

---

## 🔑 Getting API Keys

### Google Gemini (Free)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API Key
3. Add to `.env` as `GEMINI_API_KEY`

### Supabase (Free)
1. Create project at [Supabase](https://supabase.com)
2. Go to Settings → API
3. Copy URL and Service Role Key
4. Add to `.env`

### Twilio (Free Trial)
1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Get credentials from Console
3. Add to `.env` (optional)

---

## 📁 Project Structure

```
raahi-api/
├── src/
│   ├── config/           # Database & AI configuration
│   │   ├── database.js   # Supabase client
│   │   └── gemini.js     # Google Gemini AI
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.js
│   │   ├── task.controller.js
│   │   ├── bid.controller.js
│   │   ├── user.controller.js
│   │   ├── booking.controller.js
│   │   ├── review.controller.js
│   │   └── search.controller.js
│   ├── middleware/       # Auth & error handling
│   │   ├── auth.middleware.js
│   │   └── errorHandler.js
│   ├── routes/           # API routes
│   │   ├── auth.routes.js
│   │   ├── task.routes.js
│   │   ├── bid.routes.js
│   │   ├── user.routes.js
│   │   ├── booking.routes.js
│   │   ├── review.routes.js
│   │   └── search.routes.js
│   ├── services/         # Business logic
│   │   ├── gemini.service.js
│   │   ├── taskClassification.service.js
│   │   ├── priceEstimation.service.js
│   │   ├── bidAnalysis.service.js
│   │   └── sms.service.js
│   ├── utils/            # Helpers
│   │   ├── logger.js
│   │   └── response.js
│   └── server.js         # Express app
├── database/
│   └── migration.sql     # Database schema
├── logs/                 # Application logs
├── test-complete.ps1     # Full test suite
├── .env.example          # Environment template
└── README.md             # This file
```

---

## 🚀 Deployment

### Environment Variables

For production, ensure:
- `NODE_ENV=production`
- Strong `JWT_SECRET` (32+ characters)
- Valid production URLs
- Real Twilio credentials for SMS

### Platform Recommendations

- **Backend**: Railway, Render, Heroku, AWS
- **Database**: Supabase (included), or PostgreSQL
- **Domain**: Cloudflare for DNS + DDoS protection

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of Conduct
- Development workflow
- Pull request process
- Coding standards

---

## 📊 Project Stats

- **Lines of Code**: 3,500+
- **API Endpoints**: 42 production + 5 test
- **Database Tables**: 7
- **Dependencies**: 190 packages
- **Test Coverage**: 16 automated tests
- **AI Services**: 3 (classification, pricing, bid analysis)
- **SMS Templates**: 10+

---

## 🐛 Troubleshooting

### Common Issues

**Server won't start**
- Check Node.js version: `node -v` (need v18+)
- Verify `.env` file exists and has all required variables
- Check logs in `logs/error.log`

**Database errors**
- Ensure migration script ran successfully
- Verify Supabase credentials in `.env`
- Check Supabase dashboard for connection errors

**AI not working**
- Verify Gemini API key is valid
- Check quota limits on Google AI Studio
- Model `gemini-2.5-flash-lite` must be available

**SMS not sending**
- Check Twilio credentials
- Verify phone number is verified (trial accounts)
- Check Twilio balance for paid accounts
- In development, OTPs log to console by default

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💖 Acknowledgments

- Google Gemini for AI capabilities
- Supabase for database infrastructure
- Twilio for SMS services
- Open source community for amazing packages

---

## 🎯 What's Next?

- [ ] Build frontend (React/Next.js)
- [ ] Add payment gateway integration
- [ ] Implement real-time chat
- [ ] Add push notifications
- [ ] Build mobile app

---

<div align="center">

**Built with ❤️ for the RAAHI Platform**

[⭐ Star this repo](https://github.com/YOUR_USERNAME/raahi-api) • [🐛 Report Bug](https://github.com/YOUR_USERNAME/raahi-api/issues) • [💡 Request Feature](https://github.com/YOUR_USERNAME/raahi-api/issues)

</div>
