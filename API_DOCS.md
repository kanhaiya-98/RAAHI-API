# RAAHI API Documentation

Complete API reference for the RAAHI service marketplace platform.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Send OTP

Send verification code to phone number.

**Endpoint:** `POST /api/auth/send-otp`

**Access:** Public

**Request Body:**
```json
{
  "phone": "+919876543210",
  "role": "customer" // or "provider"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully. Valid for 5 minutes.",
  "data": {
    "phone": "+919876543210"
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "role": "customer"}'
```

---

### Verify OTP

Verify OTP and receive JWT token.

**Endpoint:** `POST /api/auth/verify-otp`

**Access:** Public

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "role": "customer" // optional, defaults to customer
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "phone": "+919876543210",
      "name": null,
      "role": "customer",
      "is_verified": true
    }
  }
}
```

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+919876543210",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "location_lat": 19.0760,
      "location_lng": 72.8777,
      "address": "Mumbai",
      "is_verified": true,
      "provider_profile": null
    }
  }
}
```

---

## Task Management Endpoints

### Create Task

Create a new service task with AI classification and price estimation.

**Endpoint:** `POST /api/tasks`

**Access:** Private (Customer only)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "task_description": "Kitchen tap is leaking from the base, water dripping continuously",
  "location": {
    "lat": 19.0760,
    "lng": 72.8777,
    "address": "Andheri, Mumbai"
  },
  "photo_urls": ["https://example.com/photo1.jpg"] // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "uuid",
      "task_description": "Kitchen tap is leaking...",
      "ai_classification": {
        "service_category": "Plumbing",
        "issue_type": "Tap base leakage",
        "complexity": "Medium",
        "urgency": "Medium"
      },
      "price_estimate": {
        "min": 800,
        "max": 1200
      },
      "location": {
        "lat": 19.0760,
        "lng": 72.8777,
        "address": "Andheri, Mumbai"
      },
      "status": "open",
      "created_at": "2024-01-01T10:00:00Z"
    }
  }
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Only customers can create tasks
- `400`: Invalid input

---

### Get Task Details

Get detailed task information including all bids.

**Endpoint:** `GET /api/tasks/:taskId`

**Access:** Private

**Response (200):**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "uuid",
      "task_description": "...",
      "ai_service_category": "Plumbing",
      "ai_complexity": "Medium",
      "status": "open",
      "customer": {
        "id": "uuid",
        "name": "John Doe"
      },
      "bids": [
        {
          "id": "uuid",
          "bid_amount": 900,
          "message": "I can fix this today",
          "provider": {
            "id": "uuid",
            "name": "Provider Name"
          },
          "provider_profile": {
            "rating": 4.8,
            "experience_years": 5,
            "completed_jobs": 120
          }
        }
      ]
    }
  }
}
```

---

### Get Nearby Tasks

Find open tasks near provider's location.

**Endpoint:** `GET /api/tasks/nearby`

**Access:** Private (Provider only)

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius`: Radius in km (default: 5)

**Example:**
```bash
curl "http://localhost:5000/api/tasks/nearby?lat=19.0760&lng=72.8777&radius=10" \
  -H "Authorization: Bearer <token>"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "task_description": "...",
        "ai_price_min": 800,
        "ai_price_max": 1200,
        "distance": "2.5"
      }
    ],
    "count": 5
  }
}
```

---

### Update Task Status

Update task status (customer only).

**Endpoint:** `PATCH /api/tasks/:taskId/status`

**Access:** Private (Customer only)

**Request Body:**
```json
{
  "status": "cancelled" // open, bidding, assigned, in_progress, completed, cancelled
}
```

---

## Bidding Endpoints

### Submit Bid

Provider submits a bid on a task.

**Endpoint:** `POST /api/bids`

**Access:** Private (Provider only)

**Request Body:**
```json
{
  "task_id": "uuid",
  "bid_amount": 950,
  "estimated_hours": 2,
  "message": "I can fix this today afternoon"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Bid submitted successfully",
  "data": {
    "bid": {
      "id": "uuid",
      "task_id": "uuid",
      "provider_id": "uuid",
      "bid_amount": 950,
      "estimated_hours": 2,
      "message": "...",
      "status": "pending",
      "created_at": "2024-01-01T10:00:00Z"
    }
  }
}
```

**Validation:**
- Provider profile must be complete
- Task must be open
- Cannot bid on own task
- Bid amount should be within reasonable range of AI estimate

---

### Get Bids for Task

List all bids for a specific task.

**Endpoint:** `GET /api/bids/task/:taskId`

**Access:** Private

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "id": "uuid",
        "bid_amount": 950,
        "estimated_hours": 2,
        "message": "...",
        "status": "pending",
        "provider": {
          "id": "uuid",
          "name": "Provider Name"
        },
        "provider_profile": {
          "rating": 4.8,
          "experience_years": 5,
          "completed_jobs": 120
        }
      }
    ],
    "count": 3
  }
}
```

---

### Accept Bid

Customer accepts a bid and creates a booking.

**Endpoint:** `POST /api/bids/:bidId/accept`

**Access:** Private (Customer only)

**Response (201):**
```json
{
  "success": true,
  "message": "Bid accepted and booking created",
  "data": {
    "booking": {
      "id": "uuid",
      "task_id": "uuid",
      "provider_id": "uuid",
      "payment_amount": 950,
      "status": "scheduled"
    }
  }
}
```

**Side Effects:**
- Creates booking
- Rejects all other bids
- Updates task status to "assigned"
- Sends SMS to accepted provider
- Sends SMS to rejected providers

---

## User & Provider Endpoints

### Get Profile

Get current user's profile.

**Endpoint:** `GET /api/users/profile`

**Access:** Private

**Response:** Same as `/api/auth/me`

---

### Update Profile

Update user profile information.

**Endpoint:** `PATCH /api/users/profile`

**Access:** Private

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main St, Mumbai",
  "location_lat": 19.0760,
  "location_lng": 72.8777
}
```

---

### Create Provider Profile

Create or update provider profile.

**Endpoint:** `POST /api/users/provider-profile`

**Access:** Private (Provider only)

**Request Body:**
```json
{
  "service_categories": ["Plumbing", "Electrical"],
  "experience_years": 5,
  "bio": "Experienced plumber with 5 years in the industry"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Provider profile saved successfully",
  "data": {
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "service_categories": ["Plumbing", "Electrical"],
      "experience_years": 5,
      "rating": 0.0,
      "verification_status": "pending",
      "bio": "..."
    }
  }
}
```

---

### Get Provider Stats

Get provider dashboard statistics.

**Endpoint:** `GET /api/users/stats`

**Access:** Private (Provider only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_bids": 15,
      "accepted_bids": 8,
      "pending_bids": 3,
      "completed_jobs": 25,
      "current_rating": 4.7,
      "total_earnings": 45000,
      "verification_status": "verified"
    }
  }
}
```

---

## Booking Endpoints

### List Bookings

Get all bookings for current user.

**Endpoint:** `GET /api/bookings`

**Access:** Private

**Query Parameters:**
- `status`: Filter by status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:** Paginated list of bookings

---

### Start Booking

Provider marks job as started.

**Endpoint:** `PATCH /api/bookings/:bookingId/start`

**Access:** Private (Provider only)

**Response (200):**
```json
{
  "success": true,
  "message": "Booking started",
  "data": {
    "booking": {
      "id": "uuid",
      "status": "in_progress"
    }
  }
}
```

---

### Complete Booking

Provider marks job as completed.

**Endpoint:** `PATCH /api/bookings/:bookingId/complete`

**Access:** Private (Provider only)

**Side Effects:**
- Updates task to completed
- Increments provider's completed jobs count
- Sends SMS to customer for review

---

## ReviewEndpoints

### Create Review

Customer submits review after job completion.

**Endpoint:** `POST /api/reviews`

**Access:** Private (Customer only)

**Request Body:**
```json
{
  "booking_id": "uuid",
  "rating": 5,
  "comment": "Excellent work, very professional"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "review": {
      "id": "uuid",
      "booking_id": "uuid",
      "rating": 5,
      "comment": "...",
      "created_at": "2024-01-01T10:00:00Z"
    }
  }
}
```

**Side Effects:**
- Updates provider's average rating

---

### Get Provider Reviews

List all reviews for a provider.

**Endpoint:** `GET /api/reviews/provider/:providerId`

**Access:** Private

**Query Parameters:**
- `page`, `limit`: Pagination

**Response:** Paginated list of reviews with customer first name only

---

## Search & Statistics

### Search Tasks

Advanced task search with filters.

**Endpoint:** `GET /api/search/tasks`

**Access:** Public/Private (optional auth)

**Query Parameters:**
- `service_category`: Filter by category
- `complexity`: Low/Medium/High
- `status`: Task status
- `lat`, `lng`, `radius`: Location filter
- `min_price`, `max_price`: Price range
- `urgency`: Urgency level
- `page`, `limit`: Pagination

---

### Search Providers

Find providers with filters.

**Endpoint:** `GET /api/search/providers`

**Access:** Public/Private

**Query Parameters:**
- `service_category`: Service type
- `min_rating`: Minimum rating
- `min_experience`: Minimum years
- `lat`, `lng`, `radius`: Location
- `page`, `limit`: Pagination

---

### Platform Statistics

Get overall platform statistics.

**Endpoint:** `GET /api/search/statistics/platform`

**Access:** Public

**Response (200):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_tasks": 1547,
      "active_tasks": 234,
      "total_providers": 456,
      "verified_providers": 389,
      "total_bookings": 1123,
      "average_rating": 4.6
    }
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

API is rate-limited to 100 requests per 15 minutes per IP address.

When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Development Testing Endpoints

Available only when `NODE_ENV=development`

### Test AI Classification
```bash
POST /api/test/ai-classification
Body: { "task_description": "...", "location": "Mumbai" }
```

### Test AI Pricing
```bash
POST /api/test/ai-pricing
Body: { "service_category": "Plumbing", "complexity": "Medium" }
```

### Test Database Connection
```bash
GET /api/test/db
```

### Test Gemini API
```bash
GET /api/test/gemini
```

---

## SMS Notifications

Users receive SMS notifications for:

**Customers:**
- Task posted confirmation
- New bid received
- Bid accepted confirmation
- Job completed
- Payment reminder

**Providers:**
- New task nearby
- Bid accepted
- Bid rejected
- Job reminder

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Validate input** before sending requests
3. **Handle errors gracefully** with proper user feedback
4. **Use pagination** for list endpoints
5. **Test with development endpoints** before production use
6. **Rate limit awareness** - implement backoff strategies
7. **Store JWT securely** - never expose in client-side code

---

For more information, see the [README.md](README.md) file.
