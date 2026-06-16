<?php
/**
 * Telnyx Integration Tests
 * Tests for Telnyx provider factory and client implementations
 */

require_once __DIR__ . '/../lib/ProviderFactory.php';
require_once __DIR__ . '/../lib/VoiceProviderInterface.php';
require_once __DIR__ . '/../lib/MessagingProviderInterface.php';

class TelnyxIntegrationTest {
    
    /**
     * Test provider factory creation
     */
    public function testVoiceProviderFactory() {
        try {
            $provider = ProviderFactory::createVoiceProvider('telnyx');
            
            if ($provider instanceof VoiceProviderInterface) {
                echo "✓ Voice provider factory creates correct interface\n";
                return true;
            } else {
                echo "✗ Voice provider factory does not return correct interface\n";
                return false;
            }
        } catch (Exception $e) {
            echo "✗ Voice provider factory error: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Test messaging provider factory
     */
    public function testMessagingProviderFactory() {
        try {
            $provider = ProviderFactory::createMessagingProvider('telnyx');
            
            if ($provider instanceof MessagingProviderInterface) {
                echo "✓ Messaging provider factory creates correct interface\n";
                return true;
            } else {
                echo "✗ Messaging provider factory does not return correct interface\n";
                return false;
            }
        } catch (Exception $e) {
            echo "✗ Messaging provider factory error: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Test phone number validation
     */
    public function testPhoneNumberValidation() {
        try {
            $provider = ProviderFactory::createMessagingProvider('telnyx');
            
            $validNumbers = ['+1234567890', '+14155552671'];
            $invalidNumbers = ['123', 'abc', ''];
            
            $allValid = true;
            foreach ($validNumbers as $num) {
                if (!$provider->validatePhoneNumber($num)) {
                    echo "✗ Valid number failed validation: $num\n";
                    $allValid = false;
                }
            }
            
            foreach ($invalidNumbers as $num) {
                if ($provider->validatePhoneNumber($num)) {
                    echo "✗ Invalid number passed validation: $num\n";
                    $allValid = false;
                }
            }
            
            if ($allValid) {
                echo "✓ Phone number validation works correctly\n";
            }
            
            return $allValid;
        } catch (Exception $e) {
            echo "✗ Phone number validation error: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Test phone number formatting
     */
    public function testPhoneNumberFormatting() {
        try {
            $provider = ProviderFactory::createMessagingProvider('telnyx');
            
            $testCases = [
                '1234567890' => '+11234567890',
                '2345678901' => '+12345678901',
                '+1234567890' => '+1234567890',
            ];
            
            $allCorrect = true;
            foreach ($testCases as $input => $expected) {
                $formatted = $provider->formatPhoneNumber($input);
                if ($formatted !== $expected) {
                    echo "✗ Formatting failed: $input -> $formatted (expected $expected)\n";
                    $allCorrect = false;
                }
            }
            
            if ($allCorrect) {
                echo "✓ Phone number formatting works correctly\n";
            }
            
            return $allCorrect;
        } catch (Exception $e) {
            echo "✗ Phone number formatting error: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Test provider factory error handling
     */
    public function testProviderFactoryErrors() {
        try {
            // Test invalid provider
            try {
                ProviderFactory::createVoiceProvider('invalid_provider');
                echo "✗ Factory should throw error for invalid provider\n";
                return false;
            } catch (InvalidArgumentException $e) {
                echo "✓ Factory correctly rejects invalid provider\n";
            }
            
            return true;
        } catch (Exception $e) {
            echo "✗ Provider factory error handling test failed: " . $e->getMessage() . "\n";
            return false;
        }
    }
    
    /**
     * Run all tests
     */
    public function runAll() {
        echo "Running Telnyx Integration Tests\n";
        echo "================================\n\n";
        
        $results = [];
        $results[] = $this->testVoiceProviderFactory();
        $results[] = $this->testMessagingProviderFactory();
        $results[] = $this->testPhoneNumberValidation();
        $results[] = $this->testPhoneNumberFormatting();
        $results[] = $this->testProviderFactoryErrors();
        
        echo "\n================================\n";
        $passed = count(array_filter($results));
        $total = count($results);
        echo "Tests passed: $passed/$total\n";
        
        return $passed === $total;
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli') {
    $test = new TelnyxIntegrationTest();
    $success = $test->runAll();
    exit($success ? 0 : 1);
}
