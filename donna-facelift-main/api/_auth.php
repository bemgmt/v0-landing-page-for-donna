<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../bootstrap_env.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\JWK;

function donna_send_unauthorized($msg = 'Unauthorized') {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => $msg]);
  exit;
}

function donna_cors_and_auth(): array {
  // CORS
  $allowed = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: '*')));
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $originAllowed = in_array('*', $allowed, true) || ($origin && in_array($origin, $allowed, true));
  
  if ($originAllowed) {
      header('Access-Control-Allow-Origin: ' . $origin);
  } else if (!empty($allowed)) {
      header('Access-Control-Allow-Origin: ' . $allowed[0]);
  } else {
      header('Access-Control-Allow-Origin: *');
  }

  header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  header('Access-Control-Allow-Credentials: true');

  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { 
    http_response_code(204); 
    exit; 
  }

  // Auth: Check if Clerk is disabled (development mode)
  $disableClerk = getenv('AUTH_DISABLE_CLERK') === 'true';
  if ($disableClerk) {
      // In development mode, return a mock auth array
      return ['auth' => 'dev', 'user_id' => 'dev-user'];
  }

  // Auth: API_SECRET fallback
  $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (stripos($authHeader, 'Bearer ') === 0) {
    $token = trim(substr($authHeader, 7));
    $apiSecret = getenv('API_SECRET');
    if ($token && $apiSecret && $token === $apiSecret) {
        return ['auth' => 'internal'];
    }
  }

  // Auth: Clerk JWT (RS256)
  $jwt = null;
  if (stripos($authHeader, 'Bearer ') === 0) { 
      $jwt = trim(substr($authHeader, 7)); 
  }
  
  if (!$jwt) {
      donna_send_unauthorized('JWT not found');
  }

  $jwksUrl = getenv('CLERK_JWKS_URL');
  if (!$jwksUrl) {
      donna_send_unauthorized('Clerk JWKS URL not configured');
  }

  // Cache JWKS
  $jwksCacheFile = __DIR__ . '/../data/jwks_cache.json';
  $jwks = null;
  if (file_exists($jwksCacheFile) && (filemtime($jwksCacheFile) + 300) > time()) {
      $jwks = json_decode(file_get_contents($jwksCacheFile), true);
  } else {
      $jwksJson = @file_get_contents($jwksUrl);
      if ($jwksJson) {
          $jwks = json_decode($jwksJson, true);
          if ($jwks && !empty($jwks['keys'])) {
              if (!is_dir(dirname($jwksCacheFile))) {
                  mkdir(dirname($jwksCacheFile), 0777, true);
              }
              file_put_contents($jwksCacheFile, $jwksJson);
          }
      }
  }

  if (!$jwks || empty($jwks['keys'])) {
      donna_send_unauthorized('JWKS fetch or cache read failed');
  }
  
  try {
    $decoded = JWT::decode($jwt, JWK::parseKeySet($jwks));
    return ['auth' => 'clerk', 'claims' => (array)$decoded];
  } catch (\Exception $e) {
    donna_send_unauthorized('JWT validation failed: ' . $e->getMessage());
  }
  
  donna_send_unauthorized('JWT validation failed for an unknown reason.');
  return []; // Should not be reached
}