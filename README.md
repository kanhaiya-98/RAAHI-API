# RAAHI API - AI-Powered Service Marketplace

Complete Node.js/Express REST API for RAAHI, featuring AI-powered task classification, price estimation, and bid analysis using Google Gemini.

## 🚀 Features

- **AI-Powered Services**
  - Intelligent task classification (supports Hindi/Hinglish/English)
  - Automated price estimation with location-based adjustments
  - Smart bid comparison and recommendations
  
- **Complete Marketplace Functionality**
  - Phone OTP authentication with JWT
  - Task posting and management
  - Provider bidding system
  - Booking lifecycle management
  - Review and rating system
  
- **Real-Time Notifications**
  - SMS notifications via Twilio
  - Event-based updates for all marketplace actions
  
- **Advanced Features**
  - Geolocation-based provider search
  - Advanced filtering and search
  - Platform analytics and statistics

## 📋 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **SMS**: Twilio
- **Authentication**: JWT + OTP
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## 🛠️ Installation

### 1. Clone and Install

```bash
cd raahi-api
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=5000
NODE_ENV=development

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Base URL
BASE_URL=http://localhost:5000
```

### 3. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the migration script from `database/migration.sql`
4. Verify all tables are created successfully

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and get token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Tasks
- `POST /api/tasks` - Create task (with AI classification)
- `GET /api/tasks` - List tasks
- `GET /api/tasks/:id` - Get task details
- `GET /api/tasks/nearby` - Find nearby tasks
- `PATCH /api/tasks/:id/status` - Update status
- `DELETE /api/tasks/:id` - Cancel task

### Bids
- `POST /api/bids` - Submit bid
- `GET /api/bids/task/:taskId` - Get bids for task
- `GET /api/bids/my-bids` - Provider's bids
- `POST /api/bids/:id/accept` - Accept bid
- `POST /api/bids/:id/reject` - Reject bid
- `DELETE /api/bids/:id` - Withdraw bid

### Users & Providers
- `GET /api/users/profile` - Get profile
- `PATCH /api/users/profile` - Update profile
- `POST /api/users/provider-profile` - Create provider profile
- `GET /api/users/providers/nearby` - Find providers
- `GET /api/users/providers/:id` - Get provider
- `GET /api/users/stats` - Provider stats

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking
- `PATCH /api/bookings/:id/start` - Start job
- `PATCH /api/bookings/:id/complete` - Complete job
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/:id/timeline` - Booking history

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/provider/:id` - Provider reviews
- `GET /api/reviews/booking/:id` - Booking review
- `DELETE /api/reviews/:id` - Delete review

### Search & Statistics
- `GET /api/search/tasks` - Search tasks
- `GET /api/search/providers` - Search providers
- `GET /api/search/statistics/platform` - Platform stats
- `GET /api/search/statistics/categories` - Category stats

### Health & Testing
- `GET /health` - Health check
- `POST /api/test/ai-classification` - Test AI classification (dev only)
- `POST /api/test/ai-pricing` - Test AI pricing (dev only)
- `GET /api/test/db` - Test database connection (dev only)

## 🔒 Authentication

All protected routes require JWT token in header:

```
Authorization: Bearer <your_jwt_token>
```

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "role": "customer"}'
```

### 3. Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

### 4. Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Kitchen tap is leaking from base",
    "location": {
      "lat": 19.0760,
      "lng": 72.8777,
      "address": "Andheri, Mumbai"
    }
  }'
```

## 📚 Documentation

For detailed API documentation, see [API_DOCS.md](API_DOCS.md)

## 🏗️ Project Structure

```
raahi-api/
├── src/
│   ├── config/          # Database & AI configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling
│   ├── routes/          # API routes
│   ├── services/        # AI & SMS services
│   ├── utils/           # Logger, response helpers
│   └── server.js        # Express app entry point
├── database/
│   └── migration.sql    # Database schema
├── .env.example         # Environment template
├── package.json
└── README.md
```

## 🔧 Development

### Run with Nodemon
```bash
npm run dev
```

### Check Logs
Logs are stored in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## 🌐 Deployment

### Environment Variables
Ensure all production environment variables are set:
- Use strong `JWT_SECRET` (min 32 characters)
- Set `NODE_ENV=production`
- Configure actual Twilio and Gemini API keys
- Use production Supabase credentials

### Production Checklist
- [ ] All environment variables configured
- [ ] Database migration run successfully
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Logging and monitoring setup
- [ ] Error tracking (e.g., Sentry) integrated

## 📞 Support

For issues or questions, please check:
1. API documentation in `API_DOCS.md`
2. Database schema in `database/migration.sql`
3. Example requests in documentation

## 📄 License

MIT License

---

Built with ♥ for RAAHI Platform
