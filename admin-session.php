<?php
/** Shared session helpers for the private order dashboard and its API. */

function timberAdminPasswordIsConfigured() {
    $password = getenv('TIMBER_ADMIN_PASSWORD');
    return is_string($password) && strlen($password) >= 16;
}

function timberAdminStartSession() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('timber_admin');
    $forwardedProtocol = isset($_SERVER['HTTP_X_FORWARDED_PROTO']) ? strtolower(trim($_SERVER['HTTP_X_FORWARDED_PROTO'])) : '';
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $forwardedProtocol === 'https';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    session_start();
}

function timberAdminRespond($payload, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function timberAdminRequireAuth() {
    require_once __DIR__ . '/cloudflare-runtime.php';
    if (timberCloudflareMode()) {
        // The public Worker verifies the signed session cookie and replaces this
        // header before the request reaches the private PHP container.
        if (isset($_SERVER['HTTP_X_TIMBER_WORKER_AUTHENTICATED']) && $_SERVER['HTTP_X_TIMBER_WORKER_AUTHENTICATED'] === '1') {
            return;
        }
        timberAdminRespond([
            'status' => 'error',
            'message' => 'Autentificarea este necesară pentru această acțiune.'
        ], 401);
    }

    if (!timberAdminPasswordIsConfigured()) {
        timberAdminRespond([
            'status' => 'error',
            'message' => 'Autentificarea panoului nu este configurată pe server.'
        ], 503);
    }

    timberAdminStartSession();
    if (empty($_SESSION['timber_admin_authenticated'])) {
        timberAdminRespond([
            'status' => 'error',
            'message' => 'Autentificarea este necesară pentru această acțiune.'
        ], 401);
    }
}
