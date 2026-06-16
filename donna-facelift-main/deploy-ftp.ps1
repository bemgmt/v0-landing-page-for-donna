# DONNA MVP - SiteGround FTP Deployment Script
# Run this script from the donna project root directory

param(
    [switch]$DryRun = $false
)

$ftpServer = "ftp.bemdonna.com"
$ftpUser = "derek@bemdonna.com"  
$ftpPass = "Thecone4peace!"
$ftpPort = 21
$remoteBasePath = "/public_html/donna"

Write-Host "🚀 DONNA MVP - SiteGround Deployment Script" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

if ($DryRun) {
    Write-Host "⚠️  DRY RUN MODE - No files will be uploaded" -ForegroundColor Yellow
}

# Check if WinSCP is available (recommended FTP client for PowerShell)
$winscpPath = Get-Command "WinSCP.com" -ErrorAction SilentlyContinue
if (-not $winscpPath) {
    Write-Host "❌ WinSCP not found. Please install WinSCP or use manual FTP upload." -ForegroundColor Red
    Write-Host "Download: https://winscp.net/eng/download.php" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📁 Files to upload manually:" -ForegroundColor Cyan
    Write-Host "- api/ folder → public_html/donna/api/" -ForegroundColor White
    Write-Host "- vendor/ folder → public_html/donna/vendor/" -ForegroundColor White  
    Write-Host "- bootstrap_env.php → public_html/donna/" -ForegroundColor White
    Write-Host "- composer.json → public_html/donna/" -ForegroundColor White
    Write-Host "- composer.lock → public_html/donna/" -ForegroundColor White
    Write-Host "- .env → /home/username/.env (OUTSIDE public_html)" -ForegroundColor Red
    exit 1
}

# Files and folders to upload
$filesToUpload = @{
    "api" = "$remoteBasePath/api"
    "vendor" = "$remoteBasePath/vendor"  
    "bootstrap_env.php" = "$remoteBasePath/bootstrap_env.php"
    "composer.json" = "$remoteBasePath/composer.json"
    "composer.lock" = "$remoteBasePath/composer.lock"
}

# Create WinSCP session script
$scriptContent = @"
open ftp://$ftpUser`:$ftpPass@$ftpServer`:$ftpPort
"@

foreach ($local in $filesToUpload.Keys) {
    $remote = $filesToUpload[$local]
    if (Test-Path $local) {
        Write-Host "✅ Found: $local → $remote" -ForegroundColor Green
        $scriptContent += "`nput `"$local`" `"$remote`""
    } else {
        Write-Host "❌ Missing: $local" -ForegroundColor Red
    }
}

$scriptContent += @"

# Create necessary directories
mkdir "$remoteBasePath/data"
mkdir "$remoteBasePath/data/chat_sessions" 
mkdir "$remoteBasePath/data/memory"
mkdir "$remoteBasePath/data/rate"
mkdir "$remoteBasePath/logs"

# Set permissions
chmod 755 "$remoteBasePath"
chmod 755 "$remoteBasePath/api"
chmod 755 "$remoteBasePath/data"
chmod 755 "$remoteBasePath/logs"

exit
"@

if (-not $DryRun) {
    # Write script to temp file and execute
    $scriptFile = [System.IO.Path]::GetTempFileName() + ".txt"
    $scriptContent | Out-File -FilePath $scriptFile -Encoding ASCII
    
    Write-Host "🔄 Uploading files to SiteGround..." -ForegroundColor Blue
    & "WinSCP.com" /script="$scriptFile"
    
    Remove-Item $scriptFile
    
    Write-Host "✅ Upload complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Manually upload .env file to /home/username/.env" -ForegroundColor Yellow
    Write-Host "Test: https://bemdonna.com/donna/api/health.php" -ForegroundColor Cyan
} else {
    Write-Host "📝 WinSCP Script Preview:" -ForegroundColor Blue
    Write-Host $scriptContent -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Green
Write-Host "1. Upload .env file to your home directory (outside public_html)" -ForegroundColor White
Write-Host "2. Set file permissions via cPanel File Manager" -ForegroundColor White  
Write-Host "3. Test: https://bemdonna.com/donna/api/health.php" -ForegroundColor White
Write-Host "4. Update NEXT_PUBLIC_API_BASE to point to bemdonna.com in Vercel" -ForegroundColor White
