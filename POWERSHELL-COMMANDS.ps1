# RAAHI API - Quick Commands for PowerShell
# Copy and paste these commands directly into PowerShell

# 1. SEND OTP
$otpBody = '{"phone": "+919326650454", "role": "customer"}'
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $otpBody

# Check your server terminal (where npm run dev is running) for the OTP
# It will show: SMS (TEST MODE): ... OTP: 123456

# 2. VERIFY OTP (Replace 123456 with your actual OTP)
$verifyBody = '{"phone": "+919326650454", "otp": "123456"}'
$authResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-otp" -Method Post -ContentType "application/json" -Body $verifyBody
$token = $authResponse.data.token
Write-Host "Your token: $token" -ForegroundColor Green

# 3. CREATE A TASK (AI-powered!)
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$taskBody = @{
    task_description = "Kitchen tap leaking continuously, water wastage ho raha hai"
    location = @{
        lat = 19.0760
        lng = 72.8777
        address = "Andheri West, Mumbai"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method Post -Headers $headers -Body $taskBody

# 4. GET MY TASKS
Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method Get -Headers $headers

# 5. TEST AI CLASSIFICATION (No auth needed)
$aiBody = '{"task_description": "AC not cooling", "location": "Mumbai"}'
Invoke-RestMethod -Uri "http://localhost:5000/api/test/ai-classification" -Method Post -ContentType "application/json" -Body $aiBody
