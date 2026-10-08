<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/admin-session.php';
timberAdminStartSession();

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'GET' && $action === 'status') {
    timberAdminRespond([
        'status' => 'success',
        'authenticated' => !empty($_SESSION['timber_admin_authenticated']),
        'setupRequired' => !timberAdminPasswordIsConfigured()
    ]);
}

if ($method !== 'POST') {
    timberAdminRespond(['status' => 'error', 'message' => 'Metodă nepermisă.'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}
$action = isset($input['action']) ? $input['action'] : '';

if ($action === 'login') {
    if (!timberAdminPasswordIsConfigured()) {
        timberAdminRespond([
            'status' => 'error',
            'message' => 'Autentificarea panoului nu este configurată pe server.'
        ], 503);
    }

    $password = isset($input['password']) && is_string($input['password']) ? $input['password'] : '';
    $configuredPassword = getenv('TIMBER_ADMIN_PASSWORD');
    if ($password === '' || !hash_equals($configuredPassword, $password)) {
        timberAdminRespond(['status' => 'error', 'message' => 'Parola introdusă nu este corectă.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['timber_admin_authenticated'] = true;
    timberAdminRespond(['status' => 'success', 'authenticated' => true]);
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    timberAdminRespond(['status' => 'success', 'authenticated' => false]);
}

timberAdminRespond(['status' => 'error', 'message' => 'Acțiune necunoscută.'], 400);
