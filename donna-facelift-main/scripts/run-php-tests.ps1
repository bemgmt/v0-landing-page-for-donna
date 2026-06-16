# PHP Test Runner Script
# Supports Docker, local PHP, or portable PHP

param(
    [string]$Method = "auto"  # auto, docker, local, portable
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 PHP Test Runner" -ForegroundColor Cyan

# PHP test files to run
$phpTests = @(
    "test_error_responses.php",
    "test_error_responses_comprehensive.php", 
    "test_response_cache_integration.php",
    "test_caching.php",
    "api/test-rate-limit.php"
)

function Test-Docker {
    try {
        docker --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-LocalPHP {
    try {
        php --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-PortablePHP {
    return Test-Path ".tools/php/php.exe"
}

function Run-PHPTest {
    param([string]$TestFile, [string]$PhpCommand)
    
    Write-Host "🔍 Running: $TestFile" -ForegroundColor Yellow
    
    try {
        if ($PhpCommand.StartsWith("docker")) {
            Invoke-Expression "$PhpCommand php $TestFile"
        } else {
            & $PhpCommand $TestFile
        }
        Write-Host "✅ PASS: $TestFile" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ FAIL: $TestFile" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Determine PHP execution method
$phpCommand = ""
$method = ""

if ($Method -eq "auto") {
    if (Test-Docker) {
        $method = "docker"
        $phpCommand = "docker run --rm -v ${PWD}:/app -w /app php:8.2-cli"
    } elseif (Test-LocalPHP) {
        $method = "local"
        $phpCommand = "php"
    } elseif (Test-PortablePHP) {
        $method = "portable"
        $phpCommand = ".tools/php/php.exe"
    } else {
        Write-Host "❌ No PHP runtime found!" -ForegroundColor Red
        Write-Host "Options:" -ForegroundColor Yellow
        Write-Host "  1. Install Docker and run: scripts/run-php-tests.ps1 -Method docker" -ForegroundColor Yellow
        Write-Host "  2. Install PHP and run: scripts/run-php-tests.ps1 -Method local" -ForegroundColor Yellow
        Write-Host "  3. Use portable PHP: scripts/run-php-tests.ps1 -Method portable" -ForegroundColor Yellow
        exit 1
    }
} else {
    $method = $Method
    switch ($Method) {
        "docker" { 
            if (-not (Test-Docker)) { 
                Write-Host "❌ Docker not available" -ForegroundColor Red
                exit 1 
            }
            $phpCommand = "docker run --rm -v ${PWD}:/app -w /app php:8.2-cli" 
        }
        "local" { 
            if (-not (Test-LocalPHP)) { 
                Write-Host "❌ Local PHP not available" -ForegroundColor Red
                exit 1 
            }
            $phpCommand = "php" 
        }
        "portable" { 
            if (-not (Test-PortablePHP)) { 
                Write-Host "❌ Portable PHP not found at .tools/php/php.exe" -ForegroundColor Red
                exit 1 
            }
            $phpCommand = ".tools/php/php.exe" 
        }
        default {
            Write-Host "❌ Unknown method: $Method" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "📋 Using method: $method" -ForegroundColor Cyan
Write-Host "🔧 PHP command: $phpCommand" -ForegroundColor Cyan

# Run tests
$passed = 0
$total = $phpTests.Count

foreach ($test in $phpTests) {
    if (Run-PHPTest -TestFile $test -PhpCommand $phpCommand) {
        $passed++
    }
}

Write-Host "`n🎉 PHP Tests completed: $passed/$total passed" -ForegroundColor Cyan

if ($passed -eq $total) {
    Write-Host "✅ All PHP tests PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some PHP tests FAILED" -ForegroundColor Red
    exit 1
}
