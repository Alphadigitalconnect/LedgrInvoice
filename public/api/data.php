<?php
// Hostinger Data Persistence API for LEDGR Portal
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id, X-Auth-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$storageDir = __DIR__ . '/../storage';
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0755, true);
}

// Get user ID from header or query
$userId = $_SERVER['HTTP_X_USER_ID'] ?? ($_GET['userId'] ?? 'default_workspace');
$cleanUserId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $userId);
if (empty($cleanUserId)) {
    $cleanUserId = 'default_workspace';
}

$dataFile = $storageDir . '/data_' . $cleanUserId . '.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        $raw = file_get_contents($dataFile);
        $json = json_decode($raw, true);
        echo json_encode([
            'success' => true,
            'data' => $json,
            'source' => 'hostinger_cloud',
            'last_modified' => date('c', filemtime($dataFile))
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'data' => [
                'entities' => [],
                'clients' => [],
                'engagements' => [],
                'invoices' => [],
                'activeEntityId' => 'all'
            ],
            'source' => 'empty_cloud'
        ]);
    }
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
        exit();
    }

    $payload = [
        'updated_at' => date('c'),
        'user_id' => $cleanUserId,
        'entities' => $input['entities'] ?? [],
        'clients' => $input['clients'] ?? [],
        'engagements' => $input['engagements'] ?? [],
        'invoices' => $input['invoices'] ?? [],
        'activeEntityId' => $input['activeEntityId'] ?? 'all'
    ];

    $saved = file_put_contents($dataFile, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($saved !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'Data synced and saved to Hostinger cloud successfully.',
            'timestamp' => $payload['updated_at'],
            'stats' => [
                'entities_count' => count($payload['entities']),
                'clients_count' => count($payload['clients']),
                'engagements_count' => count($payload['engagements']),
                'invoices_count' => count($payload['invoices'])
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write data to Hostinger server.']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
