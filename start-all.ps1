# FinPilot - Launch Full Stack Application
$root = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FinPilot — AI Financial Intelligence (Full-Stack SaaS)  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "`n1. Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\venv\Scripts\Activate.ps1; python run.py"

Write-Host "2. Launching Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "`nBoth services started!" -ForegroundColor Green
Write-Host "- Web App:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Swagger:  http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "- Demo Account: alex@finpilot.io / password123" -ForegroundColor Magenta
