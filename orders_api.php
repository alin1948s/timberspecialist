<?php
/**
 * TIMBER SPECIALIST S.R.L. - API Administrare Comenzi (Panou Admin)
 * Someș-Odorhei, Sălaj • CUI 32954515
 */

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/admin-session.php';
timberAdminRequireAuth();

$dataDir = __DIR__ . '/data';
$ordersFile = $dataDir . '/orders.json';

if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

function loadOrders($ordersFile) {
    if (!file_exists($ordersFile)) {
        return [];
    }
    $raw = @file_get_contents($ordersFile);
    $decoded = @json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function saveOrders($ordersFile, $orders) {
    $seen = [];
    $unique = [];
    foreach ($orders as $ord) {
        if (is_array($ord) && !empty($ord['id']) && !isset($seen[$ord['id']])) {
            $seen[$ord['id']] = true;
            $unique[] = $ord;
        }
    }
    @file_put_contents($ordersFile, json_encode($unique, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $orders = loadOrders($ordersFile);
    echo json_encode([
        'status' => 'success',
        'orders' => $orders
    ]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $action = isset($input['action']) ? $input['action'] : '';
    $orders = loadOrders($ordersFile);
    $now = date('c');

    if ($action === 'sync_all' && isset($input['orders']) && is_array($input['orders'])) {
        saveOrders($ordersFile, $input['orders']);
        echo json_encode(['status' => 'success', 'orders' => $input['orders']]);
        exit;
    }

    if ($action === 'create' && isset($input['order']) && is_array($input['order'])) {
        array_unshift($orders, $input['order']);
        saveOrders($ordersFile, $orders);
        echo json_encode(['status' => 'success', 'order' => $input['order'], 'orders' => $orders]);
        exit;
    }

    if ($action === 'cancel' && !empty($input['id'])) {
        $id = $input['id'];
        $reason = isset($input['cancelReason']) ? trim(strip_tags($input['cancelReason'])) : 'Anulată din panoul de administrare';
        foreach ($orders as &$ord) {
            if ($ord['id'] === $id) {
                $ord['status'] = 'anulata';
                $ord['canceledAt'] = $now;
                $ord['cancelReason'] = $reason;
                $ord['updatedAt'] = $now;
                break;
            }
        }
        saveOrders($ordersFile, $orders);
        echo json_encode(['status' => 'success', 'orders' => $orders]);
        exit;
    }

    if ($action === 'update_status' && !empty($input['id']) && !empty($input['status'])) {
        $id = $input['id'];
        $newStatus = $input['status'];
        foreach ($orders as &$ord) {
            if ($ord['id'] === $id) {
                $ord['status'] = $newStatus;
                $ord['updatedAt'] = $now;
                if ($newStatus !== 'anulata') {
                    $ord['canceledAt'] = null;
                    $ord['cancelReason'] = '';
                } else if (empty($ord['canceledAt'])) {
                    $ord['canceledAt'] = $now;
                    $ord['cancelReason'] = isset($input['cancelReason']) ? $input['cancelReason'] : 'Anulată de administrator';
                }
                break;
            }
        }
        saveOrders($ordersFile, $orders);
        echo json_encode(['status' => 'success', 'orders' => $orders]);
        exit;
    }

    if ($action === 'update_order' && isset($input['order']) && !empty($input['order']['id'])) {
        $updatedOrder = $input['order'];
        foreach ($orders as &$ord) {
            if ($ord['id'] === $updatedOrder['id']) {
                $ord = array_merge($ord, $updatedOrder);
                $ord['updatedAt'] = $now;
                break;
            }
        }
        saveOrders($ordersFile, $orders);
        echo json_encode(['status' => 'success', 'orders' => $orders]);
        exit;
    }

    if ($action === 'delete' && !empty($input['id'])) {
        $id = $input['id'];
        $orders = array_filter($orders, function($o) use ($id) {
            return $o['id'] !== $id;
        });
        saveOrders($ordersFile, $orders);
        echo json_encode(['status' => 'success', 'orders' => array_values($orders)]);
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Acțiune necunoscută.']);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Metodă nepermisă.']);
