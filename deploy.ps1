# Deploy Script for Cafe-POS to VPS
# Target: teko@103.172.205.208
param (
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All
)

$VPS_USER = "teko"
$VPS_IP = "103.172.205.208"
$VPS_PATH = "/var/www/cafe-pos"

Write-Host "Memulai sinkronisasi ke VPS ($VPS_IP)..." -ForegroundColor Cyan

if (-not $Backend -and -not $Frontend -and -not $All) {
    $Frontend = $true
}

if ($Frontend -or $All) {
    Write-Host "Mengirim berkas Frontend src/..." -ForegroundColor Yellow
    scp -o BatchMode=yes -r ./frontend/src/* "${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/src/"

    if (Test-Path ./frontend/public) {
        Write-Host "Mengirim berkas Frontend public/ (icons & assets)..." -ForegroundColor Yellow
        ssh -o BatchMode=yes "${VPS_USER}@${VPS_IP}" "mkdir -p ${VPS_PATH}/frontend/public"
        scp -o BatchMode=yes -r ./frontend/public/* "${VPS_USER}@${VPS_IP}:${VPS_PATH}/frontend/public/"
    }

    Write-Host "Menjalankan build dan reload PM2 di VPS..." -ForegroundColor Yellow
    ssh -o BatchMode=yes "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH}/frontend; npm run build; pm2 reload cafe-pos-web"
}

if ($Backend -or $All) {
    Write-Host "Mengirim berkas Backend src/ dan prisma/..." -ForegroundColor Yellow
    scp -o BatchMode=yes -r ./backend/src/* "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/src/"
    scp -o BatchMode=yes ./backend/prisma/schema.prisma "${VPS_USER}@${VPS_IP}:${VPS_PATH}/backend/prisma/schema.prisma"

    Write-Host "Menjalankan migrasi database, build, dan restart Backend di VPS..." -ForegroundColor Yellow
    ssh -o BatchMode=yes "${VPS_USER}@${VPS_IP}" "cd ${VPS_PATH}/backend; npx prisma db push; npx prisma generate; npm run build; pm2 reload cafe-pos-api"
}

Write-Host "Deployment ke VPS selesai dan aplikasi telah online!" -ForegroundColor Green
