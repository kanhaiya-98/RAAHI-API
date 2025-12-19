# RAAHI API - PowerShell Test Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RAAHI API - Testing Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1/4] Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    Write-Host "SUCCESS - Server is healthy!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "FAILED - Health check error" -ForegroundColor Red
}
Write-Host ""

# Test 2: Database Connection
Write-Host "[2/4] Testing Database Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/test/db" -Method Get
    Write-Host "SUCCESS - Database connected!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "FAILED - Database test error" -ForegroundColor Red
}
Write-Host ""

# Test 3: Send OTP
Write-Host "[3/4] Testing Send OTP..." -ForegroundColor Yellow
$otpBody = @{
    phone = "+919326650454"
    role = "customer"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-otp" -Method Post -ContentType "application/json" -Body $otpBody
    Write-Host "SUCCESS - OTP sent!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    Write-Host ""
    Write-Host "CHECK SERVER TERMINAL for OTP code (in dev mode, it logs to console)" -ForegroundColor Cyan
} catch {
    Write-Host "FAILED - OTP test error" -ForegroundColor Red
}
Write-Host ""

# Test 4: AI Classification
Write-Host "[4/4] Testing AI Classification..." -ForegroundColor Yellow
$classifyBody = @{
    task_description = "AC not cooling properly, making noise"
    location = "Mumbai"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/test/ai-classification" -Method Post -ContentType "application/json" -Body $classifyBody
    Write-Host "SUCCESS - AI Classification working!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "FAILED - AI test error" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
