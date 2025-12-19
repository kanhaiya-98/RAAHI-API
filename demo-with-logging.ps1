# RAAHI API - Complete Demo with Full Logging
# This version logs EVERYTHING to file for debugging

$API_BASE = "http://localhost:5000"
$CUSTOMER_PHONE = "+919326650454"
$PROVIDER_PHONE = "+919999999999"  # Use different number for provider

# Create logs directory
$logsDir = "demo-logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "$logsDir/demo-run-$timestamp.log"

function Write-Log {
    param($message, $color = "White", $includeTimestamp = $true)
    
    if ($includeTimestamp) {
        $logMessage = "[$(Get-Date -Format 'HH:mm:ss')] $message"
    } else {
        $logMessage = $message
    }
    
    # Write to console
    Write-Host $logMessage -ForegroundColor $color
    
    # Write to file
    Add-Content -Path $logFile -Value $logMessage
}

function Write-JsonLog {
    param($title, $data)
    
    Write-Log "`n=== $title ===" "Cyan"
    $jsonString = $data | ConvertTo-Json -Depth 10
    Write-Log $jsonString "Gray"
    Write-Log "=== END $title ===`n" "Cyan"
}

Write-Log "============================================" "Cyan" $false
Write-Log "RAAHI API - COMPLETE DEMO WITH FULL LOGGING" "Cyan" $false
Write-Log "Log File: $logFile" "Yellow" $false
Write-Log "============================================`n" "Cyan" $false

# ====================================================================
# PHASE 1: CUSTOMER AUTHENTICATION
# ====================================================================
Write-Log "`n========== PHASE 1: CUSTOMER AUTHENTICATION ==========" "Magenta" $false
Write-Log "Scenario: Customer needs AC repair service`n" "Yellow" $false

Write-Log "[Step 1.1] Sending OTP to customer $CUSTOMER_PHONE..." "Cyan" $false
$body = @{phone = $CUSTOMER_PHONE; role = "customer"} | ConvertTo-Json
Write-JsonLog "SEND OTP REQUEST" $body

try {
    $otpResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $body
    Write-JsonLog "SEND OTP RESPONSE" $otpResponse
    Write-Log "SUCCESS - OTP sent!" "Green" $false
} catch {
    Write-Log "FAILED - $($_.Exception.Message)" "Red" $false
    Write-Log $_.Exception.Response | Out-String "Red"
    exit
}

$customerOtp = Read-Host "Enter Customer OTP from SMS"

Write-Log "`n[Step 1.2] Verifying OTP..." "Cyan" $false
$body = @{phone = $CUSTOMER_PHONE; otp = $customerOtp} | ConvertTo-Json
Write-JsonLog "VERIFY OTP REQUEST" $body

try {
    $authResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/verify-otp" -Method Post -ContentType "application/json" -Body $body
    Write-JsonLog "VERIFY OTP RESPONSE" $authResponse
    
    $customerToken = $authResponse.data.token
    $customerId = $authResponse.data.user.id
    $customerRole = $authResponse.data.user.role
    
    Write-Log "SUCCESS - Customer logged in!" "Green" $false
    Write-Log "  Customer ID: $customerId" "White" $false
    Write-Log "  Role: $customerRole" "White" $false
    Write-Log "  Token: $($customerToken.Substring(0,50))...`n" "Gray" $false
} catch {
    Write-Log "FAILED - $($_.Exception.Message)" "Red" $false
    exit
}

# ====================================================================
# PHASE 2: CUSTOMER POSTS TASK
# ====================================================================
Write-Log "`n========== PHASE 2: CUSTOMER POSTS TASK ==========" "Magenta" $false
Write-Log "AI Feature 1: Task Classification" "Yellow" $false
Write-Log "AI Feature 2: Price Estimation`n" "Yellow" $false

$taskDescription = "AC thoda cooling nahi kar raha, aur awaaz bhi aa rahi hai. Mumbai me urgent chahiye"
Write-Log "Input: '$taskDescription'" "White" $false

Write-Log "`n[Step 2.1] Creating task with AI..." "Cyan" $false
$headers = @{
    "Authorization" = "Bearer $customerToken"
    "Content-Type" = "application/json"
}

$taskBody = @{
    task_description = $taskDescription
    location = @{lat = 19.0760; lng = 72.8777; address = "Andheri West, Mumbai"}
} | ConvertTo-Json

Write-JsonLog "CREATE TASK REQUEST" $taskBody

try {
    $taskResponse = Invoke-RestMethod -Uri "$API_BASE/api/tasks" -Method Post -Headers $headers -Body $taskBody
    Write-JsonLog "CREATE TASK RESPONSE" $taskResponse
    
    $task = $taskResponse.data.task
    $taskId = $task.id
    
    Write-Log "SUCCESS - Task created!" "Green" $false
    Write-Log "`nAI CLASSIFICATION:" "Cyan" $false
    Write-Log "  Category: $($task.ai_service_category)" "White" $false
    Write-Log "  Issue: $($task.ai_issue_type)" "White" $false
    Write-Log "  Complexity: $($task.ai_complexity)" "White" $false
    Write-Log "  Urgency: $($task.ai_urgency)" "White" $false
    
    Write-Log "`nAI PRICE ESTIMATION:" "Cyan" $false
    Write-Log "  Min: Rs $($task.ai_price_min)" "White" $false
    Write-Log "  Max: Rs $($task.ai_price_max)" "White" $false
    
    Write-Log "`nTask ID: $taskId`n" "Gray" $false
} catch {
    Write-Log "FAILED - $($_.Exception.Message)" "Red" $false
    Write-Log $_ | Out-String "Red"
    exit
}

Start-Sleep -Seconds 2

# ====================================================================
# PHASE 3: PROVIDER AUTHENTICATION
# ====================================================================
Write-Log "`n========== PHASE 3: PROVIDER JOINS PLATFORM ==========" "Magenta" $false
Write-Log "Using DIFFERENT phone number for provider`n" "Yellow" $false

Write-Log "[Step 3.1] Sending OTP to provider $PROVIDER_PHONE..." "Cyan" $false
$body = @{phone = $PROVIDER_PHONE; role = "provider"} | ConvertTo-Json
Write-JsonLog "PROVIDER OTP REQUEST" $body

try {
    $providerOtpResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $body
    Write-JsonLog "PROVIDER OTP RESPONSE" $providerOtpResponse
    Write-Log "SUCCESS - OTP sent to provider!" "Green" $false  
} catch {
    Write-Log "FAILED - $($_.Exception.Message)" "Red" $false
    exit
}

$providerOtp = Read-Host "Enter Provider OTP from SMS"

$body = @{phone = $PROVIDER_PHONE; otp = $providerOtp} | ConvertTo-Json
Write-JsonLog "PROVIDER VERIFY REQUEST" $body

try {
    $providerAuthResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/verify-otp" -Method Post -ContentType "application/json" -Body $body
    Write-JsonLog "PROVIDER VERIFY RESPONSE" $providerAuthResponse
    
    $providerToken = $providerAuthResponse.data.token
    $providerId = $providerAuthResponse.data.user.id
    $providerRole = $providerAuthResponse.data.user.role
    
    Write-Log "SUCCESS - Provider logged in!" "Green" $false
    Write-Log "  Provider ID: $providerId" "White" $false
    Write-Log "  Role: $providerRole" "White" $false
    Write-Log ""
} catch {
    Write-Log "FAILED - $($_.Exception.Message)" "Red" $false
    exit
}

# ====================================================================
# PHASE 4: PROVIDER SUBMITS BID
# ====================================================================
Write-Log "`n========== PHASE 4: PROVIDER SUBMITS BID ==========" "Magenta" $false

Write-Log "[Step 4.1] Provider submits bid..." "Cyan" $false
$providerHeaders = @{
    "Authorization" = "Bearer $providerToken"
    "Content-Type" = "application/json"
}

$bidBody = @{
    task_id = $taskId
    bid_amount = 950
    estimated_hours = 2
    message = "Experienced AC technician. 5 years experience."
} | ConvertTo-Json

Write-JsonLog "SUBMIT BID REQUEST" $bidBody

try {
    $bidResponse = Invoke-RestMethod -Uri "$API_BASE/api/bids" -Method Post -Headers $providerHeaders -Body $bidBody
    Write-JsonLog "SUBMIT BID RESPONSE" $bidResponse
    
    $bidId = $bidResponse.data.bid.id
    Write-Log "SUCCESS - Bid submitted!" "Green" $false
    Write-Log "  Bid ID: $bidId" "White" $false
    Write-Log "  Amount: Rs 950`n" "White" $false
} catch {
    Write-Log "FAILED - $($_.Exception.Message)" "Red" $false
    
    # Try to get more error details
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Log "Error Details: $responseBody" "Red"
    }
    exit
}

Write-Log "`n============================================" "Cyan" $false
Write-Log "DEMO LOG COMPLETE!" "Green" $false
Write-Log "Full log saved to: $logFile" "Yellow" $false
Write-Log "============================================`n" "Cyan" $false
