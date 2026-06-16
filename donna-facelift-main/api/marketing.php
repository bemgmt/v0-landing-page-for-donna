<?php
/**
 * Marketing API Endpoint
 *
 * This script now acts as a simple router to the main inbox API.
 * It preserves the `marketing.php` endpoint for any frontend components that may be calling it,
 * but all logic is now handled by `inbox.php`.
 *
 * CORS validation is performed here before routing to ensure security at the entry point.
 * It handles OPTIONS preflight requests and enforces allowed origins.
 *
 * All responses from this endpoint follow the standardized schema:
 * { success: boolean, data?: any, error?: string, traceId: string }
 * This is provided through the ApiResponder pattern used in `inbox.php`.
 */

// --- GEMINI PROPOSED CHANGE START ---
require_once __DIR__ . '/lib/cors.php';

// Enforce CORS for all requests to this endpoint.
// This also handles the OPTIONS preflight request and exits if needed.
CORSHelper::enforceCORS();

// Route all requests to the main inbox API handler.
require_once __DIR__ . '/inbox.php';
// --- GEMINI PROPOSED CHANGE END ---

// --- OLD CODE TO BE DELETED START ---
// require_once __DIR__ . '/inbox.php';
// --- OLD CODE TO BE DELETED END ---
