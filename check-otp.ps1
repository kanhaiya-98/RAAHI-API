# Quick OTP Checker - Run this in a separate terminal while testing
# This shows the most recent OTPs from the log

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RAAHI OTP Checker - Real-Time" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Watching for OTPs in logs/combined.log..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray

# Get the last 50 OTPs from log
$otps = Get-Content "logs/combined.log" | Select-String -Pattern "verification code is: (\d+)" | Select-Object -Last 20

if ($otps.Count -eq 0) {
    Write-Host "No OTPs found in logs yet." -ForegroundColor Yellow
    Write-Host "`nChecking for SMS test mode messages..." -ForegroundColor Cyan
    
    # Alternative: Check for SMS test mode
    $testSms = Get-Content "logs/combined.log" | Select-String -Pattern "SMS.*:" | Select-Object -Last 10
    
    if ($testSms) {
        Write-Host "`nRecent SMS messages:" -ForegroundColor Green
        $testSms | ForEach-Object { Write-Host $_ -ForegroundColor White }
    }
} else {
    Write-Host "Recent OTPs (newest first):`n" -ForegroundColor Green
    
    $otps | ForEach-Object {
        if ($_ -match "verification code is: (\d+)") {
            $otp = $matches[1]
            $line = $_.Line
            
            # Extract timestamp if available
            if ($line -match "(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})") {
                $timestamp = $matches[1]
                Write-Host "[$timestamp] OTP: $otp" -ForegroundColor Cyan
            } else {
                Write-Host "OTP: $otp" -ForegroundColor Cyan
            }
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Latest OTP is at the bottom" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Cyan

# Also show in terminal output (server console)
Write-Host "`nTIP: The OTP is also logged in your npm run dev terminal!" -ForegroundColor Yellow
Write-Host "Look for: 'Your RAAHI verification code is: XXXXXX'`n" -ForegroundColor Gray
