# PowerShell script to start the Django development server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Django Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Error: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run setup_local.ps1 first to set up the environment." -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "Starting Django server on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python manage.py runserver
