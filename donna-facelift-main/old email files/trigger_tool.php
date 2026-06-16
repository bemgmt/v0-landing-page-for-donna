<?php
// trigger_tool.php
header('Content-Type: application/json');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || !isset($data['tool']) || !isset($data['args'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid tool payload']);
    exit;
}

$tool = $data['tool'];
$args = $data['args'];

switch ($tool) {
    case 'send_email':
        include_once 'mailer.php';
        $to = $args['to'] ?? null;
        $subject = $args['subject'] ?? '';
        $body = $args['body'] ?? '';

        if ($to) {
            $sent = send_email($to, $subject, $body);
            echo json_encode(['status' => $sent ? 'sent' : 'fail']);
        } else {
            http_response_code(422);
            echo json_encode(['error' => 'Missing email address']);
        }
        break;

    // Add more tools here

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Unknown tool: ' . $tool]);
}

function send_email($to, $subject, $body) {
    $headers = "From: donna@bemdonna.com\r\n" .
               "Content-Type: text/plain; charset=UTF-8";
    return mail($to, $subject, $body, $headers);
}
