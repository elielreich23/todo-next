# PowerShell script to set up and run the Django backend locally

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Django Backend Locally" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot

# Step 1: Check if virtual environment exists, create if not
Write-Host "Step 1: Checking virtual environment..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Green
    python -m venv venv
    Write-Host "Virtual environment created!" -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists." -ForegroundColor Green
}
Write-Host ""

# Step 2: Activate virtual environment
Write-Host "Step 2: Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
Write-Host "Virtual environment activated!" -ForegroundColor Green
Write-Host ""

# Step 3: Upgrade pip
Write-Host "Step 3: Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
Write-Host ""

# Step 4: Install dependencies
Write-Host "Step 4: Installing dependencies from requirements.txt..." -ForegroundColor Yellow
pip install -r requirements.txt
Write-Host "Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 5: Run migrations
Write-Host "Step 5: Running database migrations..." -ForegroundColor Yellow
python manage.py migrate
Write-Host "Migrations completed!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the server, run:" -ForegroundColor Yellow
Write-Host "  python manage.py runserver" -ForegroundColor White
Write-Host ""
Write-Host "Or use:" -ForegroundColor Yellow
Write-Host "  python run.py" -ForegroundColor White
Write-Host ""
