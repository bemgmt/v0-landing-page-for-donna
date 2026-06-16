<?php
header('Content-Type: application/json');

// CONFIG: Update these for your SiteGround mailbox
$hostname = '{mail.bemdonna.com:993/imap/ssl/novalidate-cert}INBOX';
$username = 'donna@bemdonna.com';
$password = 'Om1lf$51(|6)';

// Try to connect to the mailbox
$inbox = imap_open($hostname, $username, $password) or die(json_encode(["error" => imap_last_error()]));

// Search for recent or all messages
$emails = imap_search($inbox, 'ALL');

$threads = [];

if ($emails) {
    rsort($emails); // Most recent first
    foreach ($emails as $email_number) {
        $overview = imap_fetch_overview($inbox, $email_number, 0)[0];
        $message = imap_fetchbody($inbox, $email_number, 1);

        $threads[] = [
            "id" => "msg_" . $email_number,
            "sender" => $overview->from ?? '',
            "subject" => $overview->subject ?? '(No Subject)',
            "snippet" => substr(trim(strip_tags($message)), 0, 80) . '...',
            "campaign" => null,
            "is_hot" => false,
            "latest" => date("c", strtotime($overview->date ?? 'now')),
            "messages" => [[
                "from" => $overview->from ?? '',
                "text" => trim(strip_tags($message))
            ]]
        ];
    }
}

imap_close($inbox);
echo json_encode(["threads" => $threads], JSON_PRETTY_PRINT);
