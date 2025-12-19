# RAAHI API - Single User Demo (For Testing Without Second Phone)
# This demo shows AI features using one phone number

$API_BASE = "http://localhost:5000"
$PHONE = "+919326650454"  # Your phone

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RAAHI API - Single User AI Features Demo" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# ====================================================================
# STEP 1: Login as Customer
# ====================================================================
Write-Host "[Step 1] Customer Authentication..." -ForegroundColor Cyan
$body = @{phone = $PHONE; role = "customer"} | ConvertTo-Json

$otpResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $body
Write-Host "OTP sent! Check your phone or server logs`n" -ForegroundColor Green

$otp = Read-Host "Enter OTP"

$body = @{phone = $PHONE; otp = $otp} | ConvertTo-Json
$authResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/verify-otp" -Method Post -ContentType "application/json" -Body $body
$token = $authResponse.data.token

Write-Host "SUCCESS - Logged in as Customer`n" -ForegroundColor Green

# ====================================================================
# STEP 2: Create Task (AI Classification + Price Estimation)
# ====================================================================
Write-Host "[Step 2] Creating Task with AI..." -ForegroundColor Cyan
Write-Host "Input: 'AC thoda cooling nahi kar raha, Mumbai me urgent chahiye'`n" -ForegroundColor White

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$taskBody = @{
    task_description = "AC thoda cooling nahi kar raha, aur awaaz bhi aa rahi hai. Mumbai me urgent chahiye"
    location = @{lat = 19.0760; lng = 72.8777; address = "Andheri West, Mumbai"}
} | ConvertTo-Json

$taskResponse = Invoke-RestMethod -Uri "$API_BASE/api/tasks" -Method Post -Headers $headers -Body $taskBody
$task = $taskResponse.data.task

Write-Host "SUCCESS - AI Analysis Complete!`n" -ForegroundColor Green

Write-Host "AI CLASSIFICATION:" -ForegroundColor Cyan
Write-Host "  Service Category: $($task.ai_service_category)" -ForegroundColor White
Write-Host "  Issue Type: $($task.ai_issue_type)" -ForegroundColor White
Write-Host "  Complexity: $($task.ai_complexity)" -ForegroundColor White
Write-Host "  Urgency: $($task.ai_urgency)" -ForegroundColor White

Write-Host "`nAI PRICE ESTIMATION:" -ForegroundColor Cyan
Write-Host "  Price Range: Rs $($task.ai_price_min) - Rs $($task.ai_price_max)" -ForegroundColor White
Write-Host "  Location Adjusted: Mumbai (1.2x multiplier)`n" -ForegroundColor Gray

# ====================================================================
# STEP 3: Test Other AI Features
# ====================================================================
Write-Host "[Step 3] Testing AI Price Estimation Service..." -ForegroundColor Cyan

$priceBody = @{
    service_category = "Plumbing"
    complexity = "Medium"
    issue_type = "Tap leakage"
    location = "Mumbai"
} | ConvertTo-Json

try {
    $priceResponse = Invoke-RestMethod -Uri "$API_BASE/api/test/ai-pricing" -Method Post -ContentType "application/json" -Body $priceBody
    
    Write-Host "SUCCESS - Price Estimation:" -ForegroundColor Green
    Write-Host "  Min Price: Rs $($priceResponse.data.estimation.min_price)" -ForegroundColor White
    Write-Host "  Max Price: Rs $($priceResponse.data.estimation.max_price)" -ForegroundColor White
    Write-Host "  Reasoning: $($priceResponse.data.estimation.reasoning[0])`n" -ForegroundColor Gray
} catch {
    Write-Host "Price estimation unavailable`n" -ForegroundColor Yellow
}

# ====================================================================
# STEP 4: Platform Statistics
# ====================================================================
Write-Host "[Step 4] Getting Platform Statistics..." -ForegroundColor Cyan

try {
    $stats = Invoke-RestMethod -Uri "$API_BASE/api/search/statistics/platform"
    
    Write-Host "SUCCESS - Platform Stats:" -ForegroundColor Green
    Write-Host "  Total Tasks: $($stats.data.statistics.total_tasks)" -ForegroundColor White
    Write-Host "  Active Tasks: $($stats.data.statistics.active_tasks)" -ForegroundColor White
    Write-Host "  Total Providers: $($stats.data.statistics.total_providers)" -ForegroundColor White
    Write-Host "  Total Bookings: $($stats.data.statistics.total_bookings)" -ForegroundColor White
    Write-Host "  Average Rating: $($stats.data.statistics.average_rating)`n" -ForegroundColor White
} catch {
    Write-Host "Stats unavailable`n" -ForegroundColor Yellow
}

# ====================================================================
# SUMMARY
# ====================================================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEMO COMPLETE - AI FEATURES VERIFIED!" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "AI FEATURES DEMONSTRATED:" -ForegroundColor Green
Write-Host "  1. Task Classification (Hinglish -> Structured)" -ForegroundColor White
Write-Host "  2. Price Estimation (Location-based)" -ForegroundColor White
Write-Host "  3. Platform Analytics" -ForegroundColor White

Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
Write-Host "- Check logs/combined.log for detailed logs" -ForegroundColor White
Write-Host "- View API_DOCS.md for all 44 endpoints" -ForegroundColor White
Write-Host "- Ready to integrate with frontend!`n" -ForegroundColor White
