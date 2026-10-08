<?php
/**
 * TIMBER SPECIALIST S.R.L. - Procesor Trimitere Formular Email (Production Ready)
 * Someș-Odorhei, Sălaj • CUI 32954515
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/cloudflare-runtime.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Metodă nepermisă.']);
    exit;
}

function timberPostString($key, $default, $maxLength) {
    if (!isset($_POST[$key]) || !is_string($_POST[$key])) {
        return $default;
    }
    $value = trim(strip_tags($_POST[$key]));
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
    if (!is_string($value)) {
        return $default;
    }
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }
    $characters = preg_split('//u', $value, -1, PREG_SPLIT_NO_EMPTY);
    if (is_array($characters)) {
        return implode('', array_slice($characters, 0, $maxLength));
    }
    return substr($value, 0, $maxLength);
}

// Honeypot anti-spam check
if (!empty($_POST['website_hp'])) {
    echo json_encode(['status' => 'error', 'message' => 'Spam detectat.']);
    exit;
}

$name = timberPostString('name', '', 120);
$phone = timberPostString('phone', '', 40);
$email = isset($_POST['email']) && is_string($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$email = is_string($email) && strlen($email) <= 254 && filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
$product = timberPostString('product', 'General', 240);
$volume = timberPostString('volume', '', 100);
$message = timberPostString('message', '', 4000);

if (empty($name) || strlen($name) < 3) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Numele este obligatoriu.']);
    exit;
}

if (empty($phone) || !preg_match('/^(?:0|\+40)?[0-9]{9,10}$/', preg_replace('/[\s\-\.\(\)]/', '', $phone))) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Numărul de telefon este obligatoriu.']);
    exit;
}

$orderId = 'TS-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(6)));
$createdAt = date('c');
$category = timberPostString('category', 'Lemn de Foc Gorun Paletizat', 160);
$estimatedTotal = isset($_POST['estimatedTotal']) && is_numeric($_POST['estimatedTotal'])
    ? min(10000000, max(0, (float)$_POST['estimatedTotal']))
    : 0;
$sourceValue = timberPostString('source', '', 80);
$source = $sourceValue === 'Pagina Contact (contact.html)'
    ? 'Pagina Contact (contact.html)'
    : 'Prima Pagină (index.html)';

$newOrder = [
    'id' => $orderId,
    'createdAt' => $createdAt,
    'updatedAt' => $createdAt,
    'name' => $name,
    'phone' => $phone,
    'email' => $email,
    'product' => $product,
    'category' => $category,
    'volume' => $volume,
    'estimatedTotal' => $estimatedTotal,
    'message' => $message,
    'source' => $source,
    'status' => 'noua',
    'canceledAt' => null,
    'cancelReason' => '',
    'adminNotes' => ''
];

// Cloudflare uses persistent D1 storage; local PHP retains the private JSON file.
if (timberCloudflareMode()) {
    $saveResult = timberCloudflareRequest('POST', '/orders', [
        'action' => 'create',
        'order' => $newOrder
    ]);
    if (!isset($saveResult['status']) || $saveResult['status'] !== 'success') {
        http_response_code(503);
        echo json_encode([
            'status' => 'error',
            'message' => 'Solicitarea nu a putut fi salvată momentan. Vă rugăm să încercați din nou sau să ne sunați.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    $dataDir = __DIR__ . '/data';
    $ordersFile = $dataDir . '/orders.json';
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0755, true);
    }
    $orders = [];
    if (file_exists($ordersFile)) {
        $raw = @file_get_contents($ordersFile);
        $decoded = @json_decode($raw, true);
        if (is_array($decoded)) {
            $orders = $decoded;
        }
    }
    $orders = array_values(array_filter($orders, function($o) use ($orderId) {
        return is_array($o) && (!isset($o['id']) || $o['id'] !== $orderId);
    }));
    array_unshift($orders, $newOrder);
    if (@file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
        http_response_code(503);
        echo json_encode([
            'status' => 'error',
            'message' => 'Solicitarea nu a putut fi salvată momentan. Vă rugăm să încercați din nou sau să ne sunați.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$to = 'contact@timberspecialist.ro';
$subject = "Comandă Nouă [{$orderId}] Lemn de Foc Cer/Gorun: {$name} - {$product}";

$body = "Ai primit o solicitare nouă de comandă (#{$orderId}) de pe site-ul Timber Specialist Someș-Odorhei:\n\n";
$body .= "Cod Comandă: {$orderId}\n";
$body .= "Data & Ora: " . date('d.m.Y H:i:s', strtotime($createdAt)) . "\n";
$body .= "Nume / Societate: {$name}\n";
$body .= "Telefon: {$phone}\n";
$body .= "Email: " . (!empty($email) ? $email : "Nespecificat") . "\n";
$body .= "Produs Solicitat: {$product}\n";
$body .= "Cantitate / Volum: " . (!empty($volume) ? $volume : "Nespecificat") . "\n";
$body .= "Detalii / Adresă Livrare / Mesaj:\n{$message}\n\n";
$body .= "---\nMesaj expediat automat de pe https://timberspecialist.ro la " . date('d.m.Y H:i:s');

$headers = "From: webmaster@timberspecialist.ro\r\n";
if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $headers .= "Reply-To: {$email}\r\n";
}
$headers .= "X-Mailer: PHP/" . phpversion();

// Încercare trimitere mail (pe server compatibil PHP)
$notificationSent = false;
if (timberCloudflareMode()) {
    $emailResult = timberCloudflareRequest('POST', '/email', [
        'subject' => $subject,
        'text' => $body,
        'replyTo' => !empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : ''
    ]);
    $notificationSent = isset($emailResult['status']) && $emailResult['status'] === 'success';
} else {
    $notificationSent = @mail($to, $subject, $body, $headers);
}

echo json_encode([
    'status' => 'success',
    'order' => $newOrder,
    'notificationSent' => $notificationSent,
    'message' => 'Solicitarea a fost recepționată cu succes de către Timber Specialist SRL!'
], JSON_UNESCAPED_UNICODE);

