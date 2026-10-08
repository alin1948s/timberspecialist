<?php
/**
 * TIMBER SPECIALIST S.R.L. - Procesor Trimitere Formular Email (Production Ready)
 * Someș-Odorhei, Sălaj • CUI 32954515
 */

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Metodă nepermisă.']);
    exit;
}

// Honeypot anti-spam check
if (!empty($_POST['website_hp'])) {
    echo json_encode(['status' => 'error', 'message' => 'Spam detectat.']);
    exit;
}

$name = isset($_POST['name']) ? trim(strip_tags($_POST['name'])) : '';
$phone = isset($_POST['phone']) ? trim(strip_tags($_POST['phone'])) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$product = isset($_POST['product']) ? trim(strip_tags($_POST['product'])) : 'General';
$volume = isset($_POST['volume']) ? trim(strip_tags($_POST['volume'])) : '';
$message = isset($_POST['message']) ? trim(strip_tags($_POST['message'])) : '';

if (empty($name) || strlen($name) < 3) {
    echo json_encode(['status' => 'error', 'message' => 'Numele este obligatoriu.']);
    exit;
}

if (empty($phone) || strlen($phone) < 9) {
    echo json_encode(['status' => 'error', 'message' => 'Numărul de telefon este obligatoriu.']);
    exit;
}

$orderId = isset($_POST['id']) && !empty($_POST['id']) ? trim(strip_tags($_POST['id'])) : ('TS-' . date('Y') . '-' . rand(1050, 9999));
$createdAt = isset($_POST['createdAt']) && !empty($_POST['createdAt']) ? trim(strip_tags($_POST['createdAt'])) : date('c');
$category = isset($_POST['category']) && !empty($_POST['category']) ? trim(strip_tags($_POST['category'])) : 'Lemn de Foc Gorun Paletizat';
$estimatedTotal = isset($_POST['estimatedTotal']) ? floatval($_POST['estimatedTotal']) : 0;
$source = isset($_POST['source']) && !empty($_POST['source']) ? trim(strip_tags($_POST['source'])) : 'Pagina Contact (contact.html)';

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

// Salvare comandă în baza de date JSON (data/orders.json) pentru Panoul Admin
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
@file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

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
@mail($to, $subject, $body, $headers);

echo json_encode([
    'status' => 'success',
    'order' => $newOrder,
    'message' => 'Solicitarea a fost recepționată cu succes de către Timber Specialist SRL!'
]);

