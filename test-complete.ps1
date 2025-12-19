# RAAHI API - Complete Test Suite
# Tests all major features of the API

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RAAHI API - Complete Feature Test Suite" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Configuration
$API_BASE = "http://localhost:5000"
$TEST_PHONE = "+919326650454"

# Test Results
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
        Write-Host "PASSED" -ForegroundColor Green
    } catch {
        $results.failed++
        $results.tests += @{name=$name; status="FAIL"; error=$_.Exception.Message}
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# SYSTEM HEALTH TESTS
Write-Host "`nSYSTEM HEALTH TESTS" -ForegroundColor Magenta

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

# AI SERVICES TESTS
Write-Host "`nAI SERVICES TESTS" -ForegroundColor Magenta

Test-Endpoint "AI Task Classification" {
    $body = @{
        task_description = "AC not cooling properly"
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
    Write-Host "  Price Range: Rs $($r.data.estimation.min_price) - Rs $($r.data.estimation.max_price)" -ForegroundColor Gray
}

# AUTHENTICATION TESTS
Write-Host "`nAUTHENTICATION TESTS" -ForegroundColor Magenta

$global:token = $null
$global:userId = $null

Test-Endpoint "Send OTP" {
    $body = @{phone = $TEST_PHONE; role = "customer"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $body
    if (-not $r.success) { throw "OTP send failed" }
    Write-Host "  Check phone $TEST_PHONE for OTP" -ForegroundColor Gray
}

Write-Host "`nPAUSED - Enter OTP from SMS:" -ForegroundColor Yellow
$otp = Read-Host "OTP"

Test-Endpoint "Verify OTP and Get Token" {
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

# TASK MANAGEMENT TESTS
Write-Host "`nTASK MANAGEMENT TESTS" -ForegroundColor Magenta

$global:taskId = $null

Test-Endpoint "Create Task with AI" {
    $headers = @{"Authorization" = "Bearer $global:token"; "Content-Type" = "application/json"}
    $body = @{
        task_description = "Kitchen tap leaking continuously"
        location = @{lat = 19.0760; lng = 72.8777; address = "Mumbai"}
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/tasks" -Method Post -Headers $headers -Body $body
    if (-not $r.data.task.id) { throw "Task creation failed" }
    $global:taskId = $r.data.task.id
    Write-Host "  Task ID: $global:taskId" -ForegroundColor Gray
    Write-Host "  AI Category: $($r.data.task.ai_service_category)" -ForegroundColor Gray
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

# SEARCH AND STATISTICS TESTS
Write-Host "`nSEARCH AND STATISTICS TESTS" -ForegroundColor Magenta

Test-Endpoint "Search Tasks" {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/search/tasks?service_category=Plumbing"
    if (-not $r.success) { throw "Task search failed" }
}

Test-Endpoint "Platform Statistics" {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/search/statistics/platform"
    Write-Host "  Total Tasks: $($r.data.statistics.total_tasks)" -ForegroundColor Gray
}

Test-Endpoint "Category Statistics" {
    $r = Invoke-RestMethod -Uri "$API_BASE/api/search/statistics/categories"
    if (-not $r.success) { throw "Category stats failed" }
}

# USER PROFILE TESTS
Write-Host "`nUSER PROFILE TESTS" -ForegroundColor Magenta

Test-Endpoint "Update Profile" {
    $headers = @{"Authorization" = "Bearer $global:token"; "Content-Type" = "application/json"}
    $body = @{name = "Test User"; email = "test@raahi.com"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$API_BASE/api/users/profile" -Method Patch -Headers $headers -Body $body
    if (-not $r.success) { throw "Profile update failed" }
}

# FINAL RESULTS
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($results.passed + $results.failed)" -ForegroundColor White
Write-Host "Passed: $($results.passed)" -ForegroundColor Green
Write-Host "Failed: $($results.failed)" -ForegroundColor Red

if ($results.failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $results.tests | Where-Object {$_.status -eq "FAIL"} | ForEach-Object {
        Write-Host "  - $($_.name): $($_.error)" -ForegroundColor Red
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
$successRate = [math]::Round(($results.passed / ($results.passed + $results.failed)) * 100, 1)
if ($successRate -eq 100) {
    Write-Host "ALL TESTS PASSED! API is 100 percent functional!" -ForegroundColor Green
} else {
    Write-Host "Success Rate: $successRate percent" -ForegroundColor Yellow
}
Write-Host "============================================`n" -ForegroundColor Cyan
