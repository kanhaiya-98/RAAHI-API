@echo off
echo ==========================================
echo RAAHI API - Quick Test Script
echo ==========================================
echo.

echo [1/3] Testing Health Check...
curl -s http://localhost:5000/health
echo.
echo.

echo [2/3] Testing Database Connection...
curl -s http://localhost:5000/api/test/db
echo.
echo.

echo [3/3] Testing AI Classification...
curl -s -X POST http://localhost:5000/api/test/ai-classification ^
  -H "Content-Type: application/json" ^
  -d "{\"task_description\": \"AC not cooling\", \"location\": \"Mumbai\"}"
echo.
echo.

echo ==========================================
echo Test Complete!
echo ==========================================
pause
