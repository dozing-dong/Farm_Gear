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
	}
 else {
		Write-Host "[3/3] Frontend .env already exists, skipping" -ForegroundColor Yellow
	}

	# 4) Generate frontend HTTPS certificates for Vite dev server
	$feCertDir = Join-Path (Get-Location) "farmgear-app-frontend/certs"
	New-Item -ItemType Directory -Force -Path $feCertDir | Out-Null
	$feKeyPath = Join-Path $feCertDir "localhost-key.pem"
	$fePemPath = Join-Path $feCertDir "localhost.pem"

	$mkcert = Get-Command mkcert -ErrorAction SilentlyContinue
	if ($mkcert) {
		Write-Host "[extra] mkcert detected. Generating trusted local certs for frontend..." -ForegroundColor Cyan
		# Install local CA if not present
		mkcert -install | Out-Null
		# Generate key/cert for localhost and loopback addresses
		mkcert -key-file "$feKeyPath" -cert-file "$fePemPath" localhost 127.0.0.1 ::1 | Out-Null
		Write-Host "[extra] Frontend HTTPS certs generated via mkcert: $feKeyPath / $fePemPath" -ForegroundColor Green
	}
 else {
		# Fallback: try OpenSSL if available (self-signed; browser will warn unless trusted manually)
		$openssl = Get-Command openssl -ErrorAction SilentlyContinue
		if ($openssl) {
			Write-Host "[extra] mkcert not found. Using OpenSSL to create self-signed certs for frontend..." -ForegroundColor Yellow
			$subject = "/CN=localhost"
			openssl req -x509 -nodes -newkey rsa:2048 -keyout "$feKeyPath" -out "$fePemPath" -days 825 -subj $subject | Out-Null
			Write-Host "[extra] Frontend self-signed certs generated via OpenSSL: $feKeyPath / $fePemPath" -ForegroundColor Green
		}
		else {
			Write-Host "[warn] Neither mkcert nor openssl found. Frontend will run on HTTP unless certs exist at $feCertDir." -ForegroundColor Yellow
			Write-Host "       Recommended: Install mkcert (https://github.com/FiloSottile/mkcert) and rerun ./setup.ps1" -ForegroundColor Yellow
		}
	}

	Write-Host "\nSetup complete. You can now run:" -ForegroundColor Cyan
	Write-Host "  docker compose up --build -d" -ForegroundColor Yellow
}
catch {
	Write-Host "Setup failed: $($_.Exception.Message)" -ForegroundColor Red
	exit 1
}

