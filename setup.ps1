# FarmGear one-time local setup script (PowerShell)
# - Generates and trusts a local HTTPS developer certificate for ASP.NET Core
# - Creates frontend .env for local development

Write-Host "=== FarmGear Local Setup ===" -ForegroundColor Cyan

try {
	# 1) Ensure backend certs directory exists
	$certDir = Join-Path (Get-Location) "certs/backend"
	New-Item -ItemType Directory -Force -Path $certDir | Out-Null
	Write-Host "[1/3] Ensured directory: $certDir" -ForegroundColor Green

	# 2) Export and trust ASP.NET Core dev certificate
	$pfxPath = Join-Path $certDir "aspnetapp.pfx"
	$pfxPassword = "changeit"

	# Export new certificate to project certs folder
	dotnet dev-certs https -ep "$pfxPath" -p "$pfxPassword" | Out-Null
	# Trust on host (may show a trust prompt on Windows/macOS)
	dotnet dev-certs https --trust | Out-Null
	Write-Host "[2/3] Generated and trusted dev cert: $pfxPath" -ForegroundColor Green

	# 3) Create frontend .env if missing
	$frontendEnv = Join-Path (Get-Location) "farmgear-app-frontend/.env"
	if (-not (Test-Path $frontendEnv)) {
		@"
VITE_API_BASE_URL=https://localhost:8443
VITE_APP_TITLE=FarmGear
VITE_ENABLE_ERROR_REPORTING=true
"@ | Out-File -Encoding UTF8 $frontendEnv
		Write-Host "[3/3] Created frontend .env at: $frontendEnv" -ForegroundColor Green
	} else {
		Write-Host "[3/3] Frontend .env already exists, skipping" -ForegroundColor Yellow
	}

	Write-Host "\nSetup complete. You can now run:" -ForegroundColor Cyan
	Write-Host "  docker compose up --build -d" -ForegroundColor Yellow
}
catch {
	Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
	exit 1
}

