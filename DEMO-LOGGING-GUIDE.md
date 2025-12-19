# Demo Logging Guide

## Problem Identified

The demo was failing because:
1. **Same phone number used for both customer AND provider** - This creates role conflicts
2. **No detailed logging** - Hard to debug what's happening

## Solution

Use the new **`demo-with-logging.ps1`** script:

### Features
- ✅ **Full JSON logging** - Every request/response saved to file
- ✅ **Separate phone numbers** - Customer and Provider use different numbers
- ✅ **Timestamp** - Each log file has unique timestamp
- ✅ **Console + File** - See output AND have permanent record
- ✅ **Error details** - Full error messages captured

### How to Run

```powershell
.\demo-with-logging.ps1
```

### Log Files

Logs are saved in `demo-logs/` directory:
```
demo-logs/
└── demo-run-2025-12-19_16-30-45.log
```

### What Gets Logged

- All API requests (full JSON)
- All API responses (full JSON)
- Timestamps for each step
- Success/failure status
- Full error details if any fail
- Token snippets
- User IDs and roles

### Phone Numbers

Update these in the script:
```powershell
$CUSTOMER_PHONE = "+919326650454"  # Your number
$PROVIDER_PHONE = "+919999999999"  # Different number or use Twilio test number
```

**IMPORTANT**: Customer and Provider MUST have different phone numbers to avoid role conflicts!

### Troubleshooting

**Issue**: AI fields showing blank
**Fix**: Check the log file to see full task response - AI fields might be nested differently

**Issue**: 403 Forbidden on bid
**Fix**: Ensure provider is using DIFFERENT phone number than customer

**Issue**: Can't see what's happening
**Fix**: Open the log file in `demo-logs/` - everything is there!

## Log File Example

```
[16:30:45] === CREATE TASK REQUEST ===
{
  "task_description": "AC not cooling",
  "location": {
    "lat": 19.0760,
    "lng": 72.8777
  }
}

[16:30:46] === CREATE TASK RESPONSE ===
{
  "success": true,
  "data": {
    "task": {
      "id": "abc-123",
      "ai_service_category": "AC Repair",
      ...
    }
  }
}
```

Perfect for debugging! 🔍
