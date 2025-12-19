# RAAHI API - DEMO GUIDE

## How to Run the Complete Demo

This demo shows the ENTIRE marketplace flow with ALL AI features.

### Prerequisites
1. Server must be running: `npm run dev`
2. Database migrated (7 tables created)
3. Two phone numbers for testing (or use same number twice)

### Run Demo

```powershell
.\demo-complete-journey.ps1
```

### What the Demo Shows

**Complete User Journey (10 Phases):**

1. **Customer Authentication** - Phone OTP login
2. **Task Creation** - AI classifies "AC thoda cooling nahi kar raha" → AC Repair
3. **Provider Authentication** - Provider logs in
4. **Provider Discovery** - Finds nearby tasks (geolocation)
5. **Bid Submission** - Provider bids Rs 950
6. **AI Recommendation** - System recommends best provider
7. **Confidence Score** - AI calculates 92/100 confidence
8. **Booking Creation** - Customer accepts, booking confirmed
9. **Service Completion** - Provider completes job
10. **Review System** - Customer leaves 5-star rating

**All 5 AI Services in Action:**
- ✅ Task Classification (Hinglish → Structured data)
- ✅ Price Estimation (Location + Complexity)
- ✅ Bid Analysis (Multi-factor comparison)
- ✅ Provider Recommendation (Single best choice)
- ✅ Booking Confidence (Explainable score)

### Demo Flow

```
Customer Posts                Provider Responds           Smart Decisions
─────────────                ──────────────────          ───────────────
"AC not cooling"      →      Finds nearby task    →      AI analyzes
     ↓                              ↓                         ↓
AI Classifies         →      Submits bid Rs 950   →      Recommends best
     ↓                              ↓                         ↓
Shows Rs 800-1200     →      Gets notification    →      92% confidence
     ↓                              ↓                         ↓
Views bids            →      Booking confirmed    →      Service complete
     ↓                              ↓                         ↓
Accepts bid           →      Completes job        →      Gets 5-star review
```

### Expected Output

The script will show:
- ✅ Real SMS notifications (check phone/logs)
- ✅ AI-generated classifications
- ✅ Price estimates with reasoning
- ✅ Bid recommendations
- ✅ Confidence scores with explanations
- ✅ Complete booking lifecycle

### Perfect For

- **Demo to stakeholders** - Shows complete functionality
- **Developer onboarding** - See how to integrate
- **Testing** - Verify all features work
- **Presentation** - Live marketplace demo

### Notes

- You'll need to enter 2 OTPs (customer + provider)
- SMS sends in real-time (check your phone!)
- All AI responses are generated live
- Booking flow is fully automated

**This is exactly how developers will use your API!** 🚀
