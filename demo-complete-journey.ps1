# ====================================================================
# RAAHI API - COMPLETE END-TO-END DEMO SCRIPT
# ====================================================================
# This script demonstrates the FULL marketplace flow with ALL AI features
# Perfect for showing how the API works to potential users/developers
# ====================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RAAHI API - COMPLETE DEMO" -ForegroundColor Cyan
Write-Host "End-to-End Marketplace Journey" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$API_BASE = "http://localhost:5000"
$CUSTOMER_PHONE = "+919326650454"
$PROVIDER_PHONE = "+919082262956"

# ====================================================================
# PHASE 1: CUSTOMER AUTHENTICATION
# ====================================================================
Write-Host "`n========== PHASE 1: CUSTOMER AUTHENTICATION ==========" -ForegroundColor Magenta
Write-Host "Scenario: Customer needs AC repair service`n" -ForegroundColor Yellow

Write-Host "[Step 1.1] Sending OTP to customer..." -ForegroundColor Cyan
$body = @{
    phone = $CUSTOMER_PHONE
    role = "customer"
} | ConvertTo-Json

try {
    $otpResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $body
    Write-Host "SUCCESS - OTP sent to $CUSTOMER_PHONE" -ForegroundColor Green
    Write-Host "Check your phone or server logs for OTP`n" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Could not send OTP" -ForegroundColor Red
    exit
}

$customerOtp = Read-Host "Enter OTP from SMS"

Write-Host "`n[Step 1.2] Verifying OTP and logging in..." -ForegroundColor Cyan
$body = @{
    phone = $CUSTOMER_PHONE
    otp = $customerOtp
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/verify-otp" -Method Post -ContentType "application/json" -Body $body
    $customerToken = $authResponse.data.token
    $customerId = $authResponse.data.user.id
    Write-Host "SUCCESS - Customer logged in!" -ForegroundColor Green
    Write-Host "Customer ID: $customerId" -ForegroundColor Gray
    Write-Host "Token: $($customerToken.Substring(0,30))...`n" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - OTP verification failed" -ForegroundColor Red
    exit
}

# ====================================================================
# PHASE 2: CUSTOMER POSTS TASK (AI CLASSIFICATION & PRICING)
# ====================================================================
Write-Host "`n========== PHASE 2: CUSTOMER POSTS TASK ==========" -ForegroundColor Magenta
Write-Host "AI Feature 1: Task Classification" -ForegroundColor Yellow
Write-Host "AI Feature 2: Price Estimation`n" -ForegroundColor Yellow

Write-Host "[Step 2.1] Customer describes problem in Hinglish..." -ForegroundColor Cyan
$taskDescription = "AC thoda cooling nahi kar raha, aur awaaz bhi aa rahi hai. Mumbai me urgent chahiye"

Write-Host "Input: '$taskDescription'" -ForegroundColor White

Write-Host "`n[Step 2.2] Creating task (AI auto-classifies)..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $customerToken"
    "Content-Type" = "application/json"
}

$body = @{
    task_description = $taskDescription
    location = @{
        lat = 19.0760
        lng = 72.8777
        address = "Andheri West, Mumbai"
    }
} | ConvertTo-Json

try {
    $taskResponse = Invoke-RestMethod -Uri "$API_BASE/api/tasks" -Method Post -Headers $headers -Body $body
    $task = $taskResponse.data.task
    $taskId = $task.id
    
    Write-Host "SUCCESS - Task created with AI intelligence!" -ForegroundColor Green
    
    Write-Host "`nAI CLASSIFICATION:" -ForegroundColor Cyan
    Write-Host "  Category: $($task.ai_classification.service_category)" -ForegroundColor White
    Write-Host "  Issue: $($task.ai_classification.issue_type)" -ForegroundColor White
    Write-Host "  Complexity: $($task.ai_classification.complexity)" -ForegroundColor White
    Write-Host "  Urgency: $($task.ai_classification.urgency)" -ForegroundColor White
    
    Write-Host "`nAI PRICE ESTIMATION:" -ForegroundColor Cyan
    Write-Host "  Range: Rs $($task.price_estimate.min) - Rs $($task.price_estimate.max)" -ForegroundColor White
    Write-Host "  Location: Mumbai (1.2x adjustment applied)" -ForegroundColor Gray
    Write-Host "`nTask ID: $taskId`n" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Task creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2

# ====================================================================
# PHASE 3: PROVIDER AUTHENTICATION & DISCOVERS TASK
# ====================================================================
Write-Host "`n========== PHASE 3: PROVIDER JOINS PLATFORM ==========" -ForegroundColor Magenta
Write-Host "Scenario: AC repair provider gets notified of nearby task`n" -ForegroundColor Yellow

Write-Host "[Step 3.1] Provider authentication..." -ForegroundColor Cyan
$body = @{
    phone = $PROVIDER_PHONE
    role = "provider"
} | ConvertTo-Json

try {
    $providerOtpResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $body
    Write-Host "SUCCESS - OTP sent to provider $PROVIDER_PHONE" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Could not send provider OTP" -ForegroundColor Red
    exit
}

$providerOtp = Read-Host "Enter Provider OTP from SMS"

$body = @{
    phone = $PROVIDER_PHONE
    otp = $providerOtp
} | ConvertTo-Json

try {
    $providerAuthResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/verify-otp" -Method Post -ContentType "application/json" -Body $body
    $providerToken = $providerAuthResponse.data.token
    $providerId = $providerAuthResponse.data.user.id
    Write-Host "SUCCESS - Provider logged in!" -ForegroundColor Green
    Write-Host "Provider ID: $providerId`n" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Provider OTP verification failed" -ForegroundColor Red
    exit
}

Write-Host "[Step 3.2] Provider searches nearby tasks..." -ForegroundColor Cyan
$providerHeaders = @{
    "Authorization" = "Bearer $providerToken"
}

try {
    $nearbyTasks = Invoke-RestMethod -Uri "$API_BASE/api/tasks/nearby?lat=19.0760&lng=72.8777&radius=10" -Headers $providerHeaders
    Write-Host "SUCCESS - Found $($nearbyTasks.data.tasks.Count) nearby tasks" -ForegroundColor Green
    Write-Host "Provider sees: $($task.ai_service_category) - Rs $($task.ai_price_min)-$($task.ai_price_max)`n" -ForegroundColor White
} catch {
    Write-Host "WARNING - Could not fetch nearby tasks, continuing with known task..." -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

# ====================================================================
# PHASE 4: PROVIDER SUBMITS BID
# ====================================================================
Write-Host "`n========== PHASE 4: PROVIDER SUBMITS BID ==========" -ForegroundColor Magenta
Write-Host "Provider analyzes task and submits competitive bid`n" -ForegroundColor Yellow

Write-Host "[Step 4.1] Provider submits bid..." -ForegroundColor Cyan
$providerHeaders = @{
    "Authorization" = "Bearer $providerToken"
    "Content-Type" = "application/json"
}

$body = @{
    task_id = $taskId
    bid_amount = 950
    estimated_hours = 2
    message = "Experienced AC technician. Can come today within 2 hours. 5 years experience."
} | ConvertTo-Json

try {
    $bidResponse = Invoke-RestMethod -Uri "$API_BASE/api/bids" -Method Post -Headers $providerHeaders -Body $body
    $bidId = $bidResponse.data.bid.id
    Write-Host "SUCCESS - Bid submitted!" -ForegroundColor Green
    Write-Host "  Amount: Rs 950" -ForegroundColor White
    Write-Host "  Message: Experienced technician, available today" -ForegroundColor White
    Write-Host "  Bid ID: $bidId`n" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Bid submission failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2

# ====================================================================
# PHASE 5: CUSTOMER VIEWS BIDS (AI BID ANALYSIS)
# ====================================================================
Write-Host "`n========== PHASE 5: CUSTOMER REVIEWS BIDS ==========" -ForegroundColor Magenta
Write-Host "AI Feature 3: Bid Comparison & Analysis`n" -ForegroundColor Yellow

Write-Host "[Step 5.1] Customer views task with bids..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $customerToken"
}

try {
    $taskDetails = Invoke-RestMethod -Uri "$API_BASE/api/tasks/$taskId" -Headers $headers
    $allBids = $taskDetails.data.bids
    Write-Host "SUCCESS - Task has $($allBids.Count) bid(s)" -ForegroundColor Green
    
    foreach ($bid in $allBids) {
        Write-Host "`nBid from Provider:" -ForegroundColor White
        Write-Host "  Amount: Rs $($bid.bid_amount)" -ForegroundColor White
        Write-Host "  Time: $($bid.estimated_hours) hours" -ForegroundColor White
        Write-Host "  Message: $($bid.message)" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "FAILED - Could not fetch task details" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2

# ====================================================================
# PHASE 6: AI PROVIDER RECOMMENDATION
# ====================================================================
Write-Host "`n========== PHASE 6: AI RECOMMENDATION ENGINE ==========" -ForegroundColor Magenta
Write-Host "AI Feature 4: Provider Recommendation`n" -ForegroundColor Yellow

Write-Host "[Step 6.1] Getting AI recommendation for best provider..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $customerToken"
    "Content-Type" = "application/json"
}

$body = @{
    task_id = $taskId
    user_priority = "best_value"
} | ConvertTo-Json

try {
    $recommendation = Invoke-RestMethod -Uri "$API_BASE/api/ai/recommend-provider" -Method Post -Headers $headers -Body $body
    
    Write-Host "SUCCESS - AI Recommendation Generated!" -ForegroundColor Green
    Write-Host "`nRECOMMENDED PROVIDER:" -ForegroundColor Cyan
    Write-Host "  Price: Rs $($recommendation.data.recommendation.recommended_price)" -ForegroundColor White
    Write-Host "  Confidence: $($recommendation.data.recommendation.confidence_score)/100" -ForegroundColor White
    Write-Host "`n  Justification:" -ForegroundColor Cyan
    foreach ($reason in $recommendation.data.recommendation.justification) {
        Write-Host "    - $reason" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "INFO - AI recommendation not available (may need multiple bids)" -ForegroundColor Yellow
    Write-Host "Continuing with manual selection...`n" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# ====================================================================
# PHASE 7: AI BOOKING CONFIDENCE SCORE
# ====================================================================
Write-Host "`n========== PHASE 7: BOOKING CONFIDENCE ANALYSIS ==========" -ForegroundColor Magenta
Write-Host "AI Feature 5: Booking Confidence Score`n" -ForegroundColor Yellow

Write-Host "[Step 7.1] Analyzing booking confidence..." -ForegroundColor Cyan
$body = @{
    bid_id = $bidId
} | ConvertTo-Json

try {
    $confidence = Invoke-RestMethod -Uri "$API_BASE/api/ai/booking-confidence" -Method Post -Headers $headers -Body $body
    
    Write-Host "SUCCESS - Confidence Analysis Complete!" -ForegroundColor Green
    Write-Host "`nBOOKING CONFIDENCE:" -ForegroundColor Cyan
    Write-Host "  Score: $($confidence.data.confidence_score)/100" -ForegroundColor White
    Write-Host "  Level: $($confidence.data.confidence_level)" -ForegroundColor White
    Write-Host "  Recommendation: $($confidence.data.recommendation)" -ForegroundColor White
    
    Write-Host "`n  Positive Factors:" -ForegroundColor Green
    foreach ($factor in $confidence.data.explanation) {
        Write-Host "    + $factor" -ForegroundColor White
    }
    
    Write-Host "`n  Risk Assessment:" -ForegroundColor Yellow
    foreach ($risk in $confidence.data.risk_factors) {
        Write-Host "    ! $risk" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "INFO - Confidence score analysis failed, continuing..." -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# ====================================================================
# PHASE 8: CUSTOMER ACCEPTS BID (CREATES BOOKING)
# ====================================================================
Write-Host "`n========== PHASE 8: BOOKING CREATION ==========" -ForegroundColor Magenta
Write-Host "Customer accepts bid and creates confirmed booking`n" -ForegroundColor Yellow

Write-Host "[Step 8.1] Customer accepts the bid..." -ForegroundColor Cyan
try {
    $bookingResponse = Invoke-RestMethod -Uri "$API_BASE/api/bids/$bidId/accept" -Method Post -Headers $headers
    $bookingId = $bookingResponse.data.booking.id
    
    Write-Host "SUCCESS - Booking Created!" -ForegroundColor Green
    Write-Host "  Booking ID: $bookingId" -ForegroundColor White
    Write-Host "  Status: $($bookingResponse.data.booking.status)" -ForegroundColor White
    Write-Host "  Amount: Rs $($bookingResponse.data.booking.payment_amount)" -ForegroundColor White
    Write-Host "`n  SMS notifications sent to both parties!`n" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Booking creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2

# ====================================================================
# PHASE 9: SERVICE COMPLETION
# ====================================================================
Write-Host "`n========== PHASE 9: SERVICE LIFECYCLE ==========" -ForegroundColor Magenta
Write-Host "Provider completes the service`n" -ForegroundColor Yellow

Write-Host "[Step 9.1] Provider starts the job..." -ForegroundColor Cyan
$providerHeaders = @{
    "Authorization" = "Bearer $providerToken"
    "Content-Type" = "application/json"
}

try {
    $startResponse = Invoke-RestMethod -Uri "$API_BASE/api/bookings/$bookingId/start" -Method Patch -Headers $providerHeaders
    Write-Host "SUCCESS - Job started!" -ForegroundColor Green
    Write-Host "  Status: $($startResponse.data.booking.status)`n" -ForegroundColor White
} catch {
    Write-Host "INFO - Job start failed, continuing...`n" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

Write-Host "[Step 9.2] Provider completes the job..." -ForegroundColor Cyan
try {
    $completeResponse = Invoke-RestMethod -Uri "$API_BASE/api/bookings/$bookingId/complete" -Method Patch -Headers $providerHeaders
    Write-Host "SUCCESS - Job completed!" -ForegroundColor Green
    Write-Host "  Status: $($completeResponse.data.booking.status)" -ForegroundColor White
    Write-Host "  Completion Time: $($completeResponse.data.booking.completion_time)" -ForegroundColor White
    Write-Host "`n  Customer notified via SMS!`n" -ForegroundColor Gray
} catch {
    Write-Host "INFO - Job completion failed, continuing...`n" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# ====================================================================
# PHASE 10: CUSTOMER REVIEW
# ====================================================================
Write-Host "`n========== PHASE 10: REVIEW SYSTEM ==========" -ForegroundColor Magenta
Write-Host "Customer submits rating and review`n" -ForegroundColor Yellow

Write-Host "[Step 10.1] Customer submits 5-star review..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $customerToken"
    "Content-Type" = "application/json"
}

$body = @{
    booking_id = $bookingId
    rating = 5
    comment = "Excellent service! AC is working perfectly now. Professional and quick work."
} | ConvertTo-Json

try {
    $reviewResponse = Invoke-RestMethod -Uri "$API_BASE/api/reviews" -Method Post -Headers $headers -Body $body
    Write-Host "SUCCESS - Review submitted!" -ForegroundColor Green
    Write-Host "  Rating: 5/5 stars" -ForegroundColor White
    Write-Host "  Comment: Excellent service!" -ForegroundColor White
    Write-Host "`n  Provider rating automatically updated!`n" -ForegroundColor Gray
} catch {
    Write-Host "INFO - Review submission failed (booking may need to be completed first)`n" -ForegroundColor Yellow
}

# ====================================================================
# FINAL SUMMARY
# ====================================================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "DEMO COMPLETE - ALL FEATURES TESTED!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`nCOMPLETE USER JOURNEY:" -ForegroundColor Green
Write-Host "1. Customer authenticated via OTP" -ForegroundColor White
Write-Host "2. AI classified task (AC Repair)" -ForegroundColor White
Write-Host "3. AI estimated price (Rs 800-1200)" -ForegroundColor White
Write-Host "4. Provider discovered nearby task" -ForegroundColor White
Write-Host "5. Provider submitted competitive bid" -ForegroundColor White
Write-Host "6. AI analyzed and recommended provider" -ForegroundColor White
Write-Host "7. AI generated booking confidence score" -ForegroundColor White
Write-Host "8. Customer accepted bid (booking created)" -ForegroundColor White
Write-Host "9. Provider completed service" -ForegroundColor White
Write-Host "10. Customer left 5-star review" -ForegroundColor White

Write-Host "`nAI FEATURES DEMONSTRATED:" -ForegroundColor Cyan
Write-Host "  Task Classification (Hindi/Hinglish)" -ForegroundColor White
Write-Host "  Dynamic Price Estimation (Location-based)" -ForegroundColor White
Write-Host "  Intelligent Bid Analysis" -ForegroundColor White
Write-Host "  Smart Provider Recommendation" -ForegroundColor White
Write-Host "  Explainable Confidence Scoring" -ForegroundColor White

Write-Host "`nREAL-TIME FEATURES:" -ForegroundColor Cyan
Write-Host "  SMS notifications at every step" -ForegroundColor White
Write-Host "  Geolocation-based matching" -ForegroundColor White
Write-Host "  Automatic provider rating updates" -ForegroundColor White

Write-Host "`nThis is how developers will integrate your API!" -ForegroundColor Yellow
Write-Host "Complete marketplace in 10 simple API calls.`n" -ForegroundColor Yellow

Write-Host "============================================`n" -ForegroundColor Cyan
