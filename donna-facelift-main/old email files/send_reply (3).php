<?php
// send_reply.php — send Donna's AI-generated reply using PHPMailer

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use Dotenv\Dotenv;

// Load .env for SMTP credentials
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

$from_address = 'donna@bemdonna.com';
$from_name = 'Donna Assistant';
$smtp_host = 'mail.bemdonna.com';
$smtp_user = $from_address;
$smtp_pass = $_ENV['EMAIL_PASSWORD']; // set this in .env
$smtp_port = 465;
$smtp_secure = 'ssl';

// Get thread ID
$thread_id = $_GET['thread'] ?? '';
if (!$thread_id) {
    die("Missing thread ID. Use ?thread=FOLDER_NAME");
}

$base_dir = __DIR__ . '/../email_logs/' . basename($thread_id);
$thread_file = $base_dir . '/thread.json';
$draft_file = $base_dir . '/draft.txt';
$log_file = $base_dir . '/sent.log';

if (!file_exists($thread_file) || !file_exists($draft_file)) {
    die("Missing thread or draft file.");
}

$thread = json_decode(file_get_contents($thread_file), true);
$draft = trim(file_get_contents($draft_file));
if (!$draft) die("Draft is empty.");

$latest = $thread[count($thread) - 1];
$to_address = '';
if (preg_match('/<(.*?)>/', $latest['from'], $matches)) {
    $to_address = $matches[1];
} elseif (strpos($latest['from'], '@') !== false) {
    $to_address = $latest['from'];
}
if (!$to_address) die("Could not extract recipient email.");

$subject = (stripos($latest['subject'], 're:') === 0)
    ? $latest['subject']
    : 'Re: ' . $latest['subject'];

// Start PHPMailer
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = $smtp_host;
    $mail->SMTPAuth = true;
    $mail->Username = $smtp_user;
    $mail->Password = $smtp_pass;
    $mail->SMTPSecure = $smtp_secure;
    $mail->Port = $smtp_port;

    $mail->setFrom($from_address, $from_name);
    $mail->addAddress($to_address);
    $mail->Subject = $subject;
    $mail->Body = $draft;

    // Set In-Reply-To and References headers
    if (!empty($latest['message_id'])) {
        $mail->addCustomHeader('In-Reply-To', $latest['message_id']);
        $mail->addCustomHeader('References', $latest['message_id']);
    }

    $mail->send();
    echo "✅ Email sent to: $to_address\n";

    // Log sent message
    file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] To: $to_address\nSubject: $subject\n\n$draft\n\n", FILE_APPEND);
    echo "📝 Logged to: $log_file\n";

} catch (Exception $e) {
    echo "❌ Failed to send email: {$mail->ErrorInfo}";
}
?>
