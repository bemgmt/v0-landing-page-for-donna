<?php
// check_inbox.php — check Donna's inbox for new messages

ini_set('display_errors', 1);
error_reporting(E_ALL);

$hostname = '{mail.bemdonna.com:993/imap/ssl/novalidate-cert}INBOX';
$username = 'donna@bemdonna.com';
$password = 'Om1lf$51(|6)'; // replace with real password

// Connect to mailbox
$inbox = imap_open($hostname, $username, $password);
if (!$inbox) {
    die('❌ IMAP connection failed: ' . imap_last_error());
}

// Search for unread emails
$emails = imap_search($inbox, 'UNSEEN');
if (!$emails) {
    echo "📭 No new unread emails found.\n";
    imap_close($inbox);
    exit;
}

echo "📥 Found " . count($emails) . " unread email(s):\n\n";

// Display basic info about each
foreach ($emails as $email_number) {
    $overview = imap_fetch_overview($inbox, $email_number, 0)[0];
    $header = imap_headerinfo($inbox, $email_number);
    $body = imap_fetchbody($inbox, $email_number, 1);

    echo "From: " . $overview->from . "\n";
    echo "Subject: " . $overview->subject . "\n";
    echo "Date: " . $overview->date . "\n";
    echo "----------------------------------------\n";
    echo substr(strip_tags($body), 0, 300) . "...\n\n";
}

imap_close($inbox);
?>
