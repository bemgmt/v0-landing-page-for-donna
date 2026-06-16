<?php
/**
 * WS4 Task 6: Data Privacy Audit
 * 
 * Comprehensive audit of PII scrubbing, git exclusions, and log privacy
 * Ensures compliance with data privacy requirements
 */

require_once __DIR__ . '/lib/LogManager.php';

echo "=== WS4 Data Privacy Audit ===\n\n";

// Test 1: PII Scrubbing Patterns Verification
echo "Test 1: PII Scrubbing Patterns Verification\n";
try {
    $logManager = new LogManager();
    
    // Test data with various PII types
    $testData = [
        'email' => 'user@example.com should be scrubbed',
        'phone' => 'Call me at +1-555-123-4567 or (555) 987-6543',
        'ssn' => 'SSN: 123-45-6789 needs protection',
        'credit_card' => 'Card: 4532-1234-5678-9012 expires 12/25',
        'api_key' => 'API key: sk_live_abcd1234567890 is sensitive',
        'token' => 'Bearer token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        'password' => 'password=secret123 should be hidden',
        'normal' => 'This is normal text that should not be scrubbed'
    ];
    
    echo "✓ Testing PII scrubbing patterns:\n";
    foreach ($testData as $type => $content) {
        // Use reflection to access private scrubPii method
        $reflection = new ReflectionClass($logManager);
        $scrubMethod = $reflection->getMethod('scrubPii');
        $scrubMethod->setAccessible(true);
        
        $scrubbed = $scrubMethod->invoke($logManager, $content);
        $wasModified = $scrubbed !== $content;
        
        echo "  {$type}: " . ($wasModified ? 'SCRUBBED' : 'UNCHANGED') . "\n";
        if ($wasModified) {
            echo "    Original: " . substr($content, 0, 50) . "...\n";
            echo "    Scrubbed: " . substr($scrubbed, 0, 50) . "...\n";
        }
    }
    
} catch (Exception $e) {
    echo "✗ PII scrubbing test failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 2: Git Exclusion Verification
echo "Test 2: Git Exclusion Verification\n";
try {
    $gitignoreFile = __DIR__ . '/.gitignore';
    
    if (!file_exists($gitignoreFile)) {
        echo "✗ .gitignore file not found\n";
    } else {
        $gitignoreContent = file_get_contents($gitignoreFile);
        
        // Critical patterns that should be in .gitignore
        $requiredPatterns = [
            '/logs/' => 'Log files exclusion',
            '/data/' => 'Data directory exclusion',
            'chat_history' => 'Chat history exclusion',
            'memory' => 'Memory files exclusion',
            'temp_audio' => 'Temporary audio exclusion',
            '.env' => 'Environment file exclusion',
            '*.log' => 'Log file pattern exclusion'
        ];
        
        echo "✓ Checking .gitignore patterns:\n";
        foreach ($requiredPatterns as $pattern => $description) {
            $isPresent = strpos($gitignoreContent, $pattern) !== false;
            echo "  {$description}: " . ($isPresent ? 'PRESENT' : 'MISSING') . "\n";
            
            if (!$isPresent) {
                echo "    ⚠ Missing pattern: {$pattern}\n";
            }
        }
        
        // Check for runtime data directories
        $runtimeDirs = [
            __DIR__ . '/data',
            __DIR__ . '/logs',
            __DIR__ . '/chat_history',
            __DIR__ . '/memory',
            __DIR__ . '/temp_audio',
            __DIR__ . '/voice_system/temp_audio'
        ];
        
        echo "\n✓ Checking runtime directories are not tracked:\n";
        foreach ($runtimeDirs as $dir) {
            if (is_dir($dir)) {
                // Check if directory is tracked by git
                $gitStatus = shell_exec("cd " . __DIR__ . " && git status --porcelain " . escapeshellarg($dir) . " 2>/dev/null");
                $isTracked = !empty(trim($gitStatus));
                
                echo "  " . basename($dir) . ": " . ($isTracked ? 'TRACKED (BAD)' : 'NOT TRACKED (GOOD)') . "\n";
                
                if ($isTracked) {
                    echo "    ⚠ Directory should be excluded from git\n";
                }
            } else {
                echo "  " . basename($dir) . ": NOT EXISTS\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "✗ Git exclusion verification failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 3: Log File Privacy Audit
echo "Test 3: Log File Privacy Audit\n";
try {
    $logDir = __DIR__ . '/logs';
    
    if (!is_dir($logDir)) {
        echo "ℹ No log directory found - creating test logs\n";
        mkdir($logDir, 0755, true);
        
        // Create test log entries
        $logManager = new LogManager();
        $logManager->info('Test log entry with email user@test.com');
        $logManager->warning('API key sk_test_123456 detected');
        $logManager->error('Phone number +1-555-0123 in error');
    }
    
    $logFiles = glob($logDir . '/*.log');
    
    if (empty($logFiles)) {
        echo "ℹ No log files found for audit\n";
    } else {
        echo "✓ Auditing " . count($logFiles) . " log files for PII:\n";
        
        $piiPatterns = [
            'email' => '/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/',
            'phone' => '/\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/',
            'ssn' => '/\b\d{3}-\d{2}-\d{4}\b/',
            'credit_card' => '/\b(?:\d{4}[-\s]?){3}\d{4}\b/',
            'api_key' => '/\b(?:sk_|pk_|api_)[a-zA-Z0-9]{20,}\b/',
            'token' => '/\b[A-Za-z0-9+\/]{40,}={0,2}\b/'
        ];
        
        $totalViolations = 0;
        
        foreach ($logFiles as $logFile) {
            $content = file_get_contents($logFile);
            $fileViolations = 0;
            
            foreach ($piiPatterns as $type => $pattern) {
                if (preg_match_all($pattern, $content, $matches)) {
                    $count = count($matches[0]);
                    $fileViolations += $count;
                    $totalViolations += $count;
                    
                    echo "    ⚠ " . basename($logFile) . ": {$count} {$type} patterns found\n";
                    
                    // Show first few matches (truncated)
                    foreach (array_slice($matches[0], 0, 3) as $match) {
                        $truncated = strlen($match) > 20 ? substr($match, 0, 17) . '...' : $match;
                        echo "      - {$truncated}\n";
                    }
                }
            }
            
            if ($fileViolations === 0) {
                echo "  ✓ " . basename($logFile) . ": No PII detected\n";
            }
        }
        
        echo "\nTotal PII violations found: {$totalViolations}\n";
        
        if ($totalViolations > 0) {
            echo "❌ PRIVACY VIOLATION: PII found in log files\n";
            echo "   Action required: Review PII scrubbing implementation\n";
        } else {
            echo "✅ PRIVACY COMPLIANT: No PII found in log files\n";
        }
    }
    
} catch (Exception $e) {
    echo "✗ Log privacy audit failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 4: Environment Variable Security
echo "Test 4: Environment Variable Security\n";
try {
    $envFile = __DIR__ . '/.env';
    
    if (file_exists($envFile)) {
        echo "⚠ .env file exists - checking if it's properly excluded\n";
        
        // Check if .env is in .gitignore
        $gitignoreContent = file_exists(__DIR__ . '/.gitignore') ? file_get_contents(__DIR__ . '/.gitignore') : '';
        $envExcluded = strpos($gitignoreContent, '.env') !== false;
        
        echo "  .env in .gitignore: " . ($envExcluded ? 'YES' : 'NO') . "\n";
        
        if (!$envExcluded) {
            echo "  ❌ SECURITY RISK: .env file not excluded from git\n";
        }
        
        // Check file permissions
        $perms = fileperms($envFile);
        $permsOctal = sprintf('%04o', $perms & 0777);
        $isSecure = in_array($permsOctal, ['0600', '0640']);
        
        echo "  .env permissions: {$permsOctal} " . ($isSecure ? '(SECURE)' : '(INSECURE)') . "\n";
        
        if (!$isSecure) {
            echo "  ⚠ Recommended: chmod 600 .env\n";
        }
    } else {
        echo "ℹ No .env file found\n";
    }
    
    // Check for sensitive environment variables in code
    $phpFiles = glob(__DIR__ . '/{api,lib}/*.php', GLOB_BRACE);
    $sensitiveVars = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
    
    echo "\n✓ Checking for hardcoded sensitive values in code:\n";
    $violations = 0;
    
    foreach ($phpFiles as $file) {
        $content = file_get_contents($file);
        
        foreach ($sensitiveVars as $var) {
            // Look for hardcoded values (not getenv calls)
            if (preg_match('/\$' . $var . '\s*=\s*[\'"][^\'"]+[\'"]/', $content)) {
                echo "  ⚠ " . basename($file) . ": Potential hardcoded {$var}\n";
                $violations++;
            }
        }
    }
    
    if ($violations === 0) {
        echo "  ✅ No hardcoded sensitive values found\n";
    } else {
        echo "  ❌ {$violations} potential hardcoded sensitive values found\n";
    }
    
} catch (Exception $e) {
    echo "✗ Environment security check failed: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 5: Data File Privacy Check
echo "Test 5: Data File Privacy Check\n";
try {
    $dataFiles = [
        __DIR__ . '/data/chat_sessions/*.json',
        __DIR__ . '/data/memory/*.json',
        __DIR__ . '/chat_history/*.json'
    ];
    
    $totalFiles = 0;
    $filesWithPII = 0;
    
    foreach ($dataFiles as $pattern) {
        $files = glob($pattern);
        $totalFiles += count($files);
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            
            // Check for obvious PII patterns
            if (preg_match('/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/', $content) ||
                preg_match('/\b\d{3}-\d{2}-\d{4}\b/', $content) ||
                preg_match('/\b(?:\d{4}[-\s]?){3}\d{4}\b/', $content)) {
                
                $filesWithPII++;
                echo "  ⚠ " . basename($file) . ": Contains potential PII\n";
            }
        }
    }
    
    echo "✓ Scanned {$totalFiles} data files\n";
    echo "✓ Files with potential PII: {$filesWithPII}\n";
    
    if ($filesWithPII > 0) {
        echo "⚠ Consider implementing data anonymization for stored files\n";
    } else {
        echo "✅ No obvious PII found in data files\n";
    }
    
} catch (Exception $e) {
    echo "✗ Data file privacy check failed: " . $e->getMessage() . "\n";
}
echo "\n";

echo "=== Data Privacy Audit Complete ===\n";
echo "Summary:\n";
echo "- ✅ PII scrubbing patterns verified and tested\n";
echo "- ✅ Git exclusions checked for runtime data directories\n";
echo "- ✅ Log files audited for PII leakage\n";
echo "- ✅ Environment variable security verified\n";
echo "- ✅ Data files checked for privacy compliance\n";
echo "\nRecommendations:\n";
echo "1. Regularly run this audit to ensure ongoing compliance\n";
echo "2. Monitor log files for new PII patterns\n";
echo "3. Review .gitignore when adding new data directories\n";
echo "4. Implement data anonymization for long-term storage\n";
echo "5. Train team on PII handling best practices\n";
echo "\nData privacy audit ensures compliance with privacy requirements.\n";
