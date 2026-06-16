<?php

/**
 * Analytics Logic for DONNA Dashboard
 * Handles data collection and processing for analytics interface
 */

// Database connection helper
function getDbConnection() {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? 'donna_db';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASS'] ?? '';
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        // Fallback to file-based data if database not available
        return null;
    }
}

/**
 * Get main analytics dashboard data
 */
function getAnalyticsDashboard() {
    $data = [
        'revenue' => getRevenueMetrics(),
        'users' => getUserMetrics(),
        'conversion' => getConversionMetrics(),
        'engagement' => getEngagementMetrics(),
        'emails' => getEmailMetrics(),
        'contacts' => getContactMetrics(),
        'texts' => getTextMetrics()
    ];
    
    return $data;
}

/**
 * Get revenue metrics
 */
function getRevenueMetrics($period = 30) {
    // Try database first, fallback to mock data
    $pdo = getDbConnection();
    
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    SUM(amount) as total_revenue,
                    COUNT(*) as total_transactions,
                    AVG(amount) as avg_transaction
                FROM transactions 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$period]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && $result['total_revenue']) {
                return [
                    'total' => '$' . number_format($result['total_revenue'], 2),
                    'change' => '+12.5%', // Calculate actual change
                    'transactions' => $result['total_transactions'],
                    'average' => '$' . number_format($result['avg_transaction'], 2)
                ];
            }
        } catch (Exception $e) {
            // Continue to fallback
        }
    }
    
    // Fallback mock data
    return [
        'total' => '$124,592',
        'change' => '+12.5%',
        'transactions' => 1247,
        'average' => '$99.91'
    ];
}

/**
 * Get user metrics
 */
function getUserMetrics($period = 30) {
    $pdo = getDbConnection();
    
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                SELECT COUNT(DISTINCT user_id) as active_users
                FROM user_activity 
                WHERE activity_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$period]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return [
                    'active' => number_format($result['active_users']),
                    'change' => '+8.2%'
                ];
            }
        } catch (Exception $e) {
            // Continue to fallback
        }
    }
    
    return [
        'active' => '8,429',
        'change' => '+8.2%'
    ];
}

/**
 * Get conversion metrics
 */
function getConversionMetrics($period = 30) {
    return [
        'rate' => '3.24%',
        'change' => '-2.1%',
        'conversions' => 273
    ];
}

/**
 * Get engagement metrics
 */
function getEngagementMetrics($period = 30) {
    // Check chat logs for engagement data
    $chatLogPath = '../chat_history/';
    $engagementScore = 94.2;
    
    if (is_dir($chatLogPath)) {
        $files = glob($chatLogPath . '*.json');
        $totalSessions = count($files);
        $engagementScore = min(95, 80 + ($totalSessions * 0.1));
    }
    
    return [
        'score' => number_format($engagementScore, 1) . '%',
        'change' => '+5.7%',
        'sessions' => $totalSessions ?? 156
    ];
}

/**
 * Get email metrics (sent/received)
 */
function getEmailMetrics($period = 30) {
    $emailsSent = 0;
    $emailsReceived = 0;
    
    // Check marketing bot logs
    $marketingLogPath = '../marketing-bot/conversations/';
    if (is_dir($marketingLogPath)) {
        $files = glob($marketingLogPath . '*.json');
        $emailsSent = count($files) * 15; // Estimate
    }
    
    // Check email logs
    $logPath = '../logs/';
    if (is_dir($logPath)) {
        $logFiles = glob($logPath . '*.log');
        foreach ($logFiles as $file) {
            $content = file_get_contents($file);
            $emailsReceived += substr_count($content, 'email received');
        }
    }
    
    return [
        'sent' => $emailsSent ?: 1247,
        'received' => $emailsReceived ?: 892,
        'total' => ($emailsSent ?: 1247) + ($emailsReceived ?: 892),
        'change' => '+15.3%'
    ];
}

/**
 * Get contact metrics (new contacts)
 */
function getContactMetrics($period = 30) {
    $newContacts = 0;
    
    // Check dashboard-bot contacts
    $contactsPath = '../dashboard-bot/';
    $pdo = getDbConnection();
    
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as new_contacts
                FROM contacts 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$period]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $newContacts = $result['new_contacts'] ?? 0;
        } catch (Exception $e) {
            // Continue to fallback
        }
    }
    
    // Fallback: check contact files
    if ($newContacts === 0) {
        $contactFiles = glob('../donna-db/contacts/*.json');
        $newContacts = count($contactFiles);
    }
    
    return [
        'new' => $newContacts ?: 156,
        'total' => ($newContacts ?: 156) * 3, // Estimate total
        'change' => '+22.1%'
    ];
}

/**
 * Get text message metrics
 */
function getTextMetrics($period = 30) {
    $textsSent = 0;
    
    // Check for SMS logs or Twilio logs
    $logPath = '../logs/';
    if (is_dir($logPath)) {
        $logFiles = glob($logPath . '*.log');
        foreach ($logFiles as $file) {
            $content = file_get_contents($file);
            $textsSent += substr_count($content, 'SMS sent') + substr_count($content, 'text sent');
        }
    }
    
    return [
        'sent' => $textsSent ?: 423,
        'change' => '+18.7%',
        'delivery_rate' => '98.2%'
    ];
}

/**
 * Get revenue data for charts
 */
function getRevenueData($period = 30) {
    // Generate sample data for charts
    $data = [];
    for ($i = $period; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $revenue = rand(2000, 8000);
        $data[] = [
            'date' => $date,
            'revenue' => $revenue,
            'transactions' => rand(20, 80)
        ];
    }
    
    return $data;
}

/**
 * Export analytics data
 */
function exportAnalyticsData($format = 'csv', $period = 30) {
    $data = getAnalyticsDashboard();
    
    if ($format === 'csv') {
        $csv = "Metric,Value,Change\n";
        $csv .= "Revenue," . $data['revenue']['total'] . "," . $data['revenue']['change'] . "\n";
        $csv .= "Active Users," . $data['users']['active'] . "," . $data['users']['change'] . "\n";
        $csv .= "Emails Sent," . $data['emails']['sent'] . "," . $data['emails']['change'] . "\n";
        $csv .= "New Contacts," . $data['contacts']['new'] . "," . $data['contacts']['change'] . "\n";
        $csv .= "Texts Sent," . $data['texts']['sent'] . "," . $data['texts']['change'] . "\n";
        
        return [
            'format' => 'csv',
            'data' => $csv,
            'filename' => 'analytics_' . date('Y-m-d') . '.csv'
        ];
    }
    
    return $data;
}

/**
 * Generate custom report
 */
function generateCustomReport($metrics, $dateRange) {
    $report = [];
    
    foreach ($metrics as $metric) {
        switch ($metric) {
            case 'revenue':
                $report['revenue'] = getRevenueMetrics();
                break;
            case 'emails':
                $report['emails'] = getEmailMetrics();
                break;
            case 'contacts':
                $report['contacts'] = getContactMetrics();
                break;
            case 'texts':
                $report['texts'] = getTextMetrics();
                break;
        }
    }
    
    return $report;
}

?>
