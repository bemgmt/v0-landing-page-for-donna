<?php
/**
 * Minimal SMTP sender without external deps.
 * Uses stream_socket_client to send via SMTP with optional SSL.
 *
 * Env variables used (if not provided via params):
 * - EMAIL_SMTP_HOST
 * - EMAIL_SMTP_PORT
 * - EMAIL_SMTP_USER
 * - EMAIL_SMTP_PASS
 * - EMAIL_SMTP_SECURE (ssl|tls|none)
 * - EMAIL_FROM
 * - EMAIL_FROM_NAME
 */

if (!function_exists('donna_load_env')) {
    function donna_load_env(): void {
        // SiteGround specific: .env is at bemdonna.com/.env (same level as public_html)
        $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', DIRECTORY_SEPARATOR);
        $envDir = $docRoot ? dirname($docRoot) : dirname(__DIR__, 2);
        $envPath = $envDir . DIRECTORY_SEPARATOR . '.env';
        if (is_readable($envPath)) {
            $lines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                $trim = trim($line);
                if ($trim === '' || $trim[0] === '#') continue;
                if (strpos($trim, '=') === false) continue;
                [$k, $v] = array_map('trim', explode('=', $trim, 2));
                if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                    $v = substr($v, 1, -1);
                }
                putenv("$k=$v");
                $_ENV[$k] = $v;
                $_SERVER[$k] = $v;
            }
        }
    }
}

if (!function_exists('donna_try_composer_autoload')) {
    function donna_try_composer_autoload(): void {
        // SiteGround specific: vendor is at bemdonna.com/vendor/ (same level as public_html)
        $siteRoot = null;
        if (!empty($_SERVER['DOCUMENT_ROOT'])) {
            // e.g., /home/user/public_html -> site root: /home/user
            $siteRoot = realpath(dirname($_SERVER['DOCUMENT_ROOT']));
        }

        $candidates = array_filter([
            // Primary: SiteGround structure - vendor next to public_html
            $siteRoot ? ($siteRoot . '/vendor/autoload.php') : null,
            // Fallbacks for other hosting environments
            __DIR__ . '/../../vendor/autoload.php',
            __DIR__ . '/../vendor/autoload.php',
            __DIR__ . '/../../../vendor/autoload.php',
        ]);

        foreach ($candidates as $path) {
            if (is_file($path)) {
                require_once $path;
                break;
            }
        }
    }
}

if (!function_exists('log_email_to_api')) {
    function log_email_to_api($user_id, $to_address, $subject, $status, $error_message = null) {
        $nextjs_host = getenv('NEXTJS_HOST') ?: 'http://localhost:3000';
        $api_secret = getenv('API_SECRET');
        if (!$api_secret) {
            error_log("[DONNA][log_email] API_SECRET is not configured. Cannot log email.");
            return;
        }
        $url = $nextjs_host . '/api/db/log/email';

        $data = [
            'user_id' => $user_id,
            'to_address' => $to_address,
            'subject' => $subject,
            'status' => $status,
            'error' => $error_message,
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $api_secret,
        ]);
        // Best-effort, non-blocking timeouts with fallbacks
        curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, 300);
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, 750);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($response === false) {
            $err = curl_error($ch);
            if ($err) { error_log("[DONNA][log_email_to_api] cURL error: {$err}"); }
        }
        curl_close($ch);

        if ($http_code >= 300) {
            error_log("[DONNA][log_email_to_api] Error: HTTP {" . $http_code . "} - " . $response);
        }
    }
}


if (!function_exists('donna_phpmailer_send')) {
    /**
     * Send via PHPMailer if available.
     */
    function donna_phpmailer_send(array $opts): array {
        // Ensure env is loaded and autoloader is available
        if (function_exists('donna_load_env')) { donna_load_env(); }
        donna_try_composer_autoload();

        if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            return ['success' => false, 'error' => 'PHPMailer not installed'];
        }

        $to = $opts['to'] ?? '';
        $subject = $opts['subject'] ?? '';
        $body = $opts['body'] ?? '';
        $from = $opts['from'] ?? getenv('EMAIL_FROM') ?: 'no-reply@example.com';
        $fromName = $opts['from_name'] ?? getenv('EMAIL_FROM_NAME') ?: 'DONNA';
        $user_id = $opts['user_id'] ?? null;

        $host = $opts['host'] ?? getenv('EMAIL_SMTP_HOST');
        $port = intval($opts['port'] ?? (getenv('EMAIL_SMTP_PORT') ?: 587));
        $user = $opts['user'] ?? getenv('EMAIL_SMTP_USER');
        $pass = $opts['pass'] ?? getenv('EMAIL_SMTP_PASS');
        $secure = strtolower(strval($opts['secure'] ?? (getenv('EMAIL_SMTP_SECURE') ?: 'tls')));

        if (!$to || !$subject || !$body) {
            return ['success' => false, 'error' => 'Missing to/subject/body'];
        }
        if (!$host || !$port || !$user || !$pass) {
            return ['success' => false, 'error' => 'SMTP not configured'];
        }

        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->SMTPAuth = true;
            $mail->Username = $user;
            $mail->Password = $pass;
            if ($secure === 'ssl') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($secure === 'tls') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = false;
            }
            $mail->Port = $port;
            $mail->CharSet = 'UTF-8';

            $mail->setFrom($from, $fromName);
            $mail->addAddress($to);
            $mail->isHTML(false);
            $mail->Subject = $subject;
            $mail->Body = $body;

            $mail->send();
            log_email_to_api($user_id, $to, $subject, 'sent');
            return ['success' => true, 'error' => null];
        } catch (\Throwable $e) {
            if (getenv('SENTRY_DSN')) { try { \Sentry\captureException($e); } catch (\Throwable $t) {} }
            log_email_to_api($user_id, $to, $subject, 'failed', $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}


if (!function_exists('donna_smtp_send')) {
    /**
     * Send an email via SMTP.
     * Returns [success=>bool, error=>string|null]
     */
    function donna_smtp_send(array $opts): array {
        $to = $opts['to'] ?? '';
        $subject = $opts['subject'] ?? '';
        $body = $opts['body'] ?? '';
        $from = $opts['from'] ?? getenv('EMAIL_FROM') ?: 'no-reply@example.com';
        $fromName = $opts['from_name'] ?? getenv('EMAIL_FROM_NAME') ?: 'DONNA';
        $user_id = $opts['user_id'] ?? null;

        $host = $opts['host'] ?? getenv('EMAIL_SMTP_HOST');
        $port = intval($opts['port'] ?? (getenv('EMAIL_SMTP_PORT') ?: 587));
        $user = $opts['user'] ?? getenv('EMAIL_SMTP_USER');
        $pass = $opts['pass'] ?? getenv('EMAIL_SMTP_PASS');
        $secure = strtolower(strval($opts['secure'] ?? (getenv('EMAIL_SMTP_SECURE') ?: 'tls')));

        if (!$to || !$subject || !$body) {
            return ['success' => false, 'error' => 'Missing to/subject/body'];
        }
        if (!$host || !$port || !$user || !$pass) {
            return ['success' => false, 'error' => 'SMTP not configured'];
        }

        $useStartTls = ($secure === 'tls');
        $protocol = ($secure === 'ssl') ? 'ssl://' : 'tcp://';
        $cryptoMethods = defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')
          ? (STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT)
          : STREAM_CRYPTO_METHOD_TLS_CLIENT;
        $sslOptions = [
          'SNI_enabled'       => true,
          'peer_name'         => $host,
          'verify_peer'       => true,
          'verify_peer_name'  => true,
          'allow_self_signed' => false,
          'crypto_method'     => $cryptoMethods,
        ];
        if ($cafile = getenv('SMTP_CA_FILE')) { $sslOptions['cafile'] = $cafile; }
        if ($capath = getenv('SMTP_CA_PATH')) { $sslOptions['capath'] = $capath; }
        $context = stream_context_create(['ssl' => $sslOptions]);
        $remote = $protocol . $host . ':' . $port;

        $fp = @stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT, $context);
        if (!$fp) {
            log_email_to_api($user_id, $to, $subject, 'failed', "Connection failed: $errstr ($errno)");
            return ['success' => false, 'error' => "Connection failed: $errstr ($errno)"];
        }
        stream_set_timeout($fp, 20);

        $read = function() use ($fp) {
            $data = '';
            while (($line = fgets($fp, 515)) !== false) {
                $data .= $line;
                if (preg_match('/^\d{3} /', $line)) break; // last line of response
            }
            return $data;
        };
        $write = function($cmd) use ($fp) {
            fwrite($fp, $cmd . "\r\n");
        };

        $resp = $read();
        if (substr($resp, 0, 3) != '220') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "SMTP banner: $resp"); return ['success'=>false,'error'=>"SMTP banner: $resp"]; }

        $domain = $_SERVER['SERVER_NAME'] ?? 'localhost';
        $write("EHLO $domain");
        $resp = $read();
        if (substr($resp,0,3) != '250') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "EHLO failed: $resp"); return ['success'=>false,'error'=>"EHLO failed: $resp"]; }

        // STARTTLS upgrade (for tls on port 587)
        if ($useStartTls) {
            $ehloResp = $resp; // capture capabilities from initial EHLO
            if (stripos($ehloResp, 'STARTTLS') === false) { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "Server lacks STARTTLS"); return ['success'=>false,'error'=>"Server lacks STARTTLS"]; }
            $write('STARTTLS');
            $resp = $read();
            if (substr($resp,0,3) != '220') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "STARTTLS failed: $resp"); return ['success'=>false,'error'=>"STARTTLS failed: $resp"]; }
            if (!stream_socket_enable_crypto($fp, true, $cryptoMethods)) {
                fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "TLS negotiation failed"); return ['success'=>false,'error'=>"TLS negotiation failed"];
            }
            // Re-issue EHLO over TLS
            $write("EHLO $domain");
            $resp = $read();
            if (substr($resp,0,3) != '250') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "EHLO after STARTTLS failed: $resp"); return ['success'=>false,'error'=>"EHLO after STARTTLS failed: $resp"]; }
        }

        // Validate envelope addresses early (before MAIL/RCPT)
        $toAddr = filter_var($to, FILTER_VALIDATE_EMAIL);
        $fromAddr = filter_var($from, FILTER_VALIDATE_EMAIL);
        if (!$toAddr || !$fromAddr) {
            fclose($fp);
            log_email_to_api($user_id, $to, $subject, 'failed', "Invalid email address");
            return ['success'=>false,'error'=>"Invalid email address"];
        }

        // Simple AUTH LOGIN (require TLS)
        if ($secure === 'none') {
            fclose($fp);
            log_email_to_api($user_id, $to, $subject, 'failed', "Refusing AUTH without TLS");
            return ['success'=>false,'error'=>"Refusing AUTH without TLS"];
        }
        // Proceed with AUTH over TLS
        $write('AUTH LOGIN');
        $resp = $read();
        if (substr($resp,0,3) != '334') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "AUTH not accepted: $resp"); return ['success'=>false,'error'=>"AUTH not accepted: $resp"]; }

        $write(base64_encode($user));
        $resp = $read();
        if (substr($resp,0,3) != '334') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "Username rejected: $resp"); return ['success'=>false,'error'=>"Username rejected: $resp"]; }

        $write(base64_encode($pass));
        $resp = $read();
        if (substr($resp,0,3) != '235') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "Password rejected: $resp"); return ['success'=>false,'error'=>"Password rejected: $resp"]; }

        $write('MAIL FROM:<' . $fromAddr . '>');
        $resp = $read();
        if (substr($resp,0,3) != '250') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "MAIL FROM failed: $resp"); return ['success'=>false,'error'=>"MAIL FROM failed: $resp"]; }

        $write('RCPT TO:<' . $toAddr . '>');
        $resp = $read();
        if (substr($resp,0,3) != '250' && substr($resp,0,3) != '251') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "RCPT TO failed: $resp"); return ['success'=>false,'error'=>"RCPT TO failed: $resp"]; }

        $write('DATA');
        $resp = $read();
        if (substr($resp,0,3) != '354') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "DATA not accepted: $resp"); return ['success'=>false,'error'=>"DATA not accepted: $resp"]; }

        // Sanitize and RFC2047-encode headers (addresses already validated)
        $subject = str_replace(["\r","\n"], '', $subject);
        $fromName = str_replace(["\r","\n"], '', $fromName);
        $encodedSubject = function_exists('mb_encode_mimeheader') ? mb_encode_mimeheader($subject, 'UTF-8', 'B') : '=?UTF-8?B?'.base64_encode($subject).'?=';
        $encodedFromName = function_exists('mb_encode_mimeheader')
            ? mb_encode_mimeheader($fromName, 'UTF-8', 'B')
            : '=?UTF-8?B?'.base64_encode($fromName).'?=';

        $headers = [];
        $headers[] = 'From: ' . sprintf('"%s" <%s>', $encodedFromName, $fromAddr);
        $headers[] = 'To: <' . $toAddr . '>';
        $headers[] = 'Subject: ' . $encodedSubject;
        $headers[] = 'Date: ' . gmdate('D, d M Y H:i:s O');
        $headers[] = 'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . ($domain ?: 'localhost') . '>';
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: 8bit';
        // Normalize body to CRLF and dot-stuff lines starting with '.'
        $normBody = preg_replace('/\r?\n/', "\r\n", (string)$body);
        $normBody = preg_replace('/(^|\r\n)\./', '$1..', $normBody);
        $payload = implode("\r\n", $headers) . "\r\n\r\n" . $normBody . "\r\n.";
        $write($payload);
        $resp = $read();
        if (substr($resp,0,3) != '250') { fclose($fp); log_email_to_api($user_id, $to, $subject, 'failed', "Message rejected: $resp"); return ['success'=>false,'error'=>"Message rejected: $resp"]; }

        $write('QUIT');
        fclose($fp);
        log_email_to_api($user_id, $to, $subject, 'sent');
        return ['success' => true, 'error' => null];
    }
}

?>
