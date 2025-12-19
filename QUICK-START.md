# 🚀 RAAHI API - Quick Start Guide (Windows PowerShell)

## ✅ Your API is Running!

**Server:** http://localhost:5000  
**Status:** All systems operational  
**Database:** 7 tables created  

---

## 📝 PowerShell Commands (Copy & Paste)

### 1. Run Full Test Suite
```powershell
cd "d:/raahi iitb/raahi-api"
.\test-api.ps1
```

### 2. Send OTP
```powershell
$otpBody = '{"phone": "+919326650454", "role": "customer"}'
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $otpBody
```

**→ Check your server terminal for OTP!** (Look for: `SMS (TEST MODE): ... OTP: 123456`)

### 3. Verify OTP & Get Token
```powershell
# Replace 123456 with your actual OTP
$verifyBody = '{"phone": "+919326650454", "otp": "123456"}'
$authResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-otp" -Method Post -ContentType "application/json" -Body $verifyBody
$token = $authResponse.data.token
Write-Host "Token: $token" -ForegroundColor Green
```

### 4. Create Task (AI-Powered!)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$taskBody = @{
    task_description = "Kitchen tap leaking, water wastage ho raha hai"
    location = @{
        lat = 19.0760
        lng = 72.8777
        address = "Mumbai"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method Post -Headers $headers -Body $taskBody
```

**AI automatically classifies and estimates price!**

### 5. Get My Tasks
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method Get -Headers $headers
```

---

## 🎯 Files Created

- ✅ `test-api.ps1` - Full test suite
- ✅ `POWERSHELL-COMMANDS.ps1` - All commands reference
- ✅ `API_DOCS.md` - Complete API documentation
- ✅ `README.md` - Setup guide

---

## 📚 Documentation

- **API Docs:** `d:/raahi iitb/raahi-api/API_DOCS.md`
- **Commands:** `d:/raahi iitb/raahi-api/POWERSHELL-COMMANDS.ps1`

---

## 🔥 Quick Tips

1. **OTP appears in server terminal** (where `npm run dev` is running)
2. **Keep server running** while testing
3. **Use PowerShell**, not Command Prompt
4. **Save your token** to variable `$token` for easier use

---

## ✅ What Works

- Phone OTP Authentication
- AI Task Classification (Hindi/Hinglish supported!)
- AI Price Estimation
- Task Management
- Bidding System
- SMS Notifications (test mode)
- Geolocation Search
- Reviews & Ratings

**Everything is ready! Start testing!** 🎉
