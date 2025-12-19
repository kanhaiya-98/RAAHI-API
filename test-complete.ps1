# 🧪 RAAHI API - Complete Test Suite
# This script tests ALL features of the API

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 RAAHI API - Complete Feature Test Suite" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Configuration
$API_BASE = "http://localhost:5000"
$TEST_PHONE = "+919326650454"

# Test Results Tracking
$results = @{
    passed = 0
    failed = 0
    tests = @()
}

function Test-Endpoint {
    param($name, $scriptBlock)
    Write-Host "`n[$($results.tests.Count + 1)] Testing: $name" -ForegroundColor Yellow
    try {
        & $scriptBlock
        $results.passed++
        $results.tests += @{name=$name; status="PASS"}
        Write-Host "✅ PASSED" -ForegroundColor Green
    } catch {
        $results.failed++
        $results.tests += @{name=$name; status="FAIL"; error=$_.Exception.Message}
        Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================
# 1. SYSTEM HEALTH TESTS
# ============================================
Write-Host "`n📊 SYSTEM HEALTH TESTS" -ForegroundColor Magenta

Test-Endpoint "Health Check" {
    $r = Invoke-RestMethod -Uri "$API_BASE/health"
    if (-not $r.success) { throw "Health check failed" }
}

Test-Endpoint "Database Connection" {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/test/db"
    if ($r.data.database -ne "connected") { throw "Database not connected" }
}

Test-Endpoint "Gemini AI Connection" {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/test/gemini"
    if ($r.data.gemini -ne "connected") { throw "Gemini not connected" }
}

# ============================================
# 2. AI SERVICES TESTS
# ============================================
Write-Host "`n🤖 AI SERVICES TESTS" -ForegroundColor Magenta

Test-Endpoint "AI Task Classification" {
    $body = @{
        task_description = "AC not cooling properly, making noise"
        location = "Mumbai"
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/test/ai-classification" -Method Post -ContentType "application/json" -Body $body
    if (-not $r.data.classification.service_category) { throw "Classification failed" }
    Write-Host "  Category: $($r.data.classification.service_category)" -ForegroundColor Gray
}

Test-Endpoint "AI Price Estimation" {
    $body = @{
        service_category = "Plumbing"
        complexity = "Medium"
        issue_type = "Tap leakage"
        location = "Mumbai"
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/test/ai-pricing" -Method Post -ContentType "application/json" -Body $body
    if (-not $r.data.estimation.min_price) { throw "Price estimation failed" }
    Write-Host "  Price Range: ₹$($r.data.estimation.min_price) - ₹$($r.data.estimation.max_price)" -ForegroundColor Gray
}

# ============================================
# 3. AUTHENTICATION TESTS
# ============================================
Write-Host "`n🔐 AUTHENTICATION TESTS" -ForegroundColor Magenta

$global:token = $null
$global:userId = $null

Test-Endpoint "Send OTP" {
    $body = @{phone = $TEST_PHONE; role = "customer"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $body
    if (-not $r.success) { throw "OTP send failed" }
    Write-Host "  📱 Check phone $TEST_PHONE for OTP" -ForegroundColor Gray
}

Write-Host "`n⏸️  PAUSED - Enter OTP from SMS:" -ForegroundColor Yellow
$otp = Read-Host "OTP"

Test-Endpoint "Verify OTP & Get Token" {
    $body = @{phone = $TEST_PHONE; otp = $otp} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/auth/verify-otp" -Method Post -ContentType "application/json" -Body $body
    if (-not $r.data.token) { throw "OTP verification failed" }
    $global:token = $r.data.token
    $global:userId = $r.data.user.id
    Write-Host "  Token: $($global:token.Substring(0,20))..." -ForegroundColor Gray
}

Test-Endpoint "Get Current User" {
    $headers = @{"Authorization" = "Bearer $global:token"}
    $r = Invoke-RestMethod -Uri "$API_BASE/api/auth/me" -Headers $headers
    if ($r.data.user.id -ne $global:userId) { throw "User fetch failed" }
}

# ============================================
# 4. TASK MANAGEMENT TESTS
# ============================================
Write-Host "`n📋 TASK MANAGEMENT TESTS" -ForegroundColor Magenta

$global:taskId = $null

Test-Endpoint "Create Task (with AI)" {
    $headers = @{"Authorization" = "Bearer $global:token"; "Content-Type" = "application/json"}
    $body = @{
        task_description = "Kitchen tap leaking continuously, urgent repair needed"
        location = @{lat = 19.0760; lng = 72.8777; address = "Andheri West, Mumbai"}
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/tasks" -Method Post -Headers $headers -Body $body
    if (-not $r.data.task.id) { throw "Task creation failed" }
    $global:taskId = $r.data.task.id
    Write-Host "  Task ID: $global:taskId" -ForegroundColor Gray
    Write-Host "  AI Category: $($r.data.task.ai_service_category)" -ForegroundColor Gray
    Write-Host "  AI Price: ₹$($r.data.task.ai_price_min) - ₹$($r.data.task.ai_price_max)" -ForegroundColor Gray
}

Test-Endpoint "Get All Tasks" {
    $headers = @{"Authorization" = "Bearer $global:token"}
    $r = Invoke-RestMethod -Uri "$API_BASE/api/tasks" -Headers $headers
    if ($r.data.tasks.Count -eq 0) { throw "No tasks found" }
}

Test-Endpoint "Get Task by ID" {
    $headers = @{"Authorization" = "Bearer $global:token"}
    $r = Invoke-RestMethod -Uri "$API_BASE/api/tasks/$global:taskId" -Headers $headers
    if ($r.data.task.id -ne $global:taskId) { throw "Task fetch failed" }
}

# ============================================
# 5. SEARCH & STATISTICS TESTS
# ============================================
Write-Host "`n🔍 SEARCH & STATISTICS TESTS" -ForegroundColor Magenta

Test-Endpoint "Search Tasks" {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/search/tasks?service_category=Plumbing"
    if (-not $r.success) { throw "Task search failed" }
}

Test-Endpoint "Platform Statistics" {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/search/statistics/platform"
    Write-Host "  Total Tasks: $($r.data.statistics.total_tasks)" -ForegroundColor Gray
    Write-Host "  Total Providers: $($r.data.statistics.total_providers)" -ForegroundColor Gray
}

Test-Endpoint "Category Statistics" {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/search/statistics/categories"
    if (-not $r.success) { throw "Category stats failed" }
}

# ============================================
# 6. USER PROFILE TESTS
# ============================================
Write-Host "`n👤 USER PROFILE TESTS" -ForegroundColor Magenta

Test-Endpoint "Update Profile" {
    $headers = @{"Authorization" = "Bearer $global:token"; "Content-Type" = "application/json"}
    $body = @{name = "Test User"; email = "test@raahi.com"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/users/profile" -Method Patch -Headers $headers -Body $body
    if (-not $r.success) { throw "Profile update failed" }
}

Test-Endpoint "Get Nearby Providers" {
    $headers = @{"Authorization" = "Bearer $global:token"}
    $r = Invoke-RestMethod -Uri "$API_BASE/api/users/providers/nearby?lat=19.0760&lng=72.8777&radius=10" -Headers $headers
    if (-not $r.success) { throw "Provider search failed" }
}

# ============================================
# FINAL RESULTS
# ============================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($results.passed + $results.failed)" -ForegroundColor White
Write-Host "✅ Passed: $($results.passed)" -ForegroundColor Green
Write-Host "❌ Failed: $($results.failed)" -ForegroundColor Red
Write-Host ""

if ($results.failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $results.tests | Where-Object {$_.status -eq "FAIL"} | ForEach-Object {
        Write-Host "  - $($_.name): $($_.error)" -ForegroundColor Red
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
$successRate = [math]::Round(($results.passed / ($results.passed + $results.failed)) * 100, 1)
if ($successRate -eq 100) {
    Write-Host "🎉 ALL TESTS PASSED! API is 100% functional!" -ForegroundColor Green
} else {
    Write-Host "Success Rate: $successRate%" -ForegroundColor Yellow
}
Write-Host "============================================`n" -ForegroundColor Cyan
