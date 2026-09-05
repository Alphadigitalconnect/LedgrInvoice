<?php
// Hostinger Authentication API for LEDGR Portal
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$storageDir = __DIR__ . '/../storage';
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0755, true);
}

// Protect storage folder from direct HTTP access
$htaccessPath = $storageDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    file_put_contents($htaccessPath, "Deny from all\n");
}

$usersFile = $storageDir . '/users.json';
if (!file_exists($usersFile)) {
    file_put_contents($usersFile, json_encode([], JSON_PRETTY_PRINT));
}

function getUsers($usersFile) {
    $raw = @file_get_contents($usersFile);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function saveUsers($usersFile, $users) {
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$action = isset($_GET['action']) ? trim($_GET['action']) : '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

if ($action === 'register' || $action === 'set-password') {
    $identifier = trim($input['identifier'] ?? '');
    $password = trim($input['password'] ?? '');
    $name = trim($input['name'] ?? 'Account Owner');

    if (empty($identifier)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please provide an email address or mobile number.']);
        exit();
    }

    if (empty($password) || strlen($password) < 4) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 4 characters.']);
        exit();
    }

    $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false;
    $cleanPhone = preg_replace('/[^0-9]/', '', $identifier);

    $users = getUsers($usersFile);
    
    // Check if user exists
    foreach ($users as &$existing) {
        $matches = false;
        if ($isEmail && strtolower($existing['email'] ?? '') === strtolower($identifier)) {
            $matches = true;
        } elseif (!$isEmail && ($existing['mobile'] ?? '') === $cleanPhone) {
            $matches = true;
        }

        if ($matches) {
            // Update password / profile
            $existing['password_hash'] = password_hash($password, PASSWORD_BCRYPT);
            if (!empty($name)) $existing['name'] = $name;
            $existing['updated_at'] = date('c');
            $token = bin2hex(random_bytes(32));
            $existing['token'] = $token;
            saveUsers($usersFile, $users);

            echo json_encode([
                'success' => true,
                'message' => 'Password set successfully.',
                'user' => [
                    'id' => $existing['id'],
                    'name' => $existing['name'],
                    'email' => $existing['email'],
                    'mobile' => $existing['mobile'],
                    'token' => $token
                ]
            ]);
            exit();
        }
    }

    // Create new user
    $userId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
    $token = bin2hex(random_bytes(32));
    
    $newUser = [
        'id' => $userId,
        'name' => $name,
        'email' => $isEmail ? strtolower($identifier) : '',
        'mobile' => !$isEmail ? $cleanPhone : '',
        'password_hash' => password_hash($password, PASSWORD_BCRYPT),
        'token' => $token,
        'created_at' => date('c'),
        'updated_at' => date('c')
    ];

    $users[] = $newUser;
    saveUsers($usersFile, $users);

    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully.',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $newUser['email'],
            'mobile' => $newUser['mobile'],
            'token' => $token
        ]
    ]);
    exit();
}

if ($action === 'login') {
    $identifier = trim($input['identifier'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($identifier) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please enter your email/mobile and password.']);
        exit();
    }

    $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false;
    $cleanPhone = preg_replace('/[^0-9]/', '', $identifier);

    $users = getUsers($usersFile);
    $matchedUser = null;

    foreach ($users as &$u) {
        if ($isEmail && strtolower($u['email'] ?? '') === strtolower($identifier)) {
            $matchedUser = &$u;
            break;
        }
        if (!$isEmail && !empty($cleanPhone) && ($u['mobile'] ?? '') === $cleanPhone) {
            $matchedUser = &$u;
            break;
        }
    }

    if (!$matchedUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Account not found. Please sign up or check your credentials.']);
        exit();
    }

    if (!password_verify($password, $matchedUser['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Incorrect password. Please try again.']);
        exit();
    }

    // Refresh token
    $token = bin2hex(random_bytes(32));
    $matchedUser['token'] = $token;
    $matchedUser['last_login'] = date('c');
    saveUsers($usersFile, $users);

    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'user' => [
            'id' => $matchedUser['id'],
            'name' => $matchedUser['name'],
            'email' => $matchedUser['email'],
            'mobile' => $matchedUser['mobile'],
            'token' => $token
        ]
    ]);
    exit();
}

if ($action === 'reset-password') {
    $identifier = trim($input['identifier'] ?? '');
    $newPassword = trim($input['new_password'] ?? '');

    if (empty($identifier) || empty($newPassword) || strlen($newPassword) < 4) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid identifier and minimum 4-character password required.']);
        exit();
    }

    $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false;
    $cleanPhone = preg_replace('/[^0-9]/', '', $identifier);

    $users = getUsers($usersFile);
    $found = false;

    foreach ($users as &$u) {
        if (($isEmail && strtolower($u['email'] ?? '') === strtolower($identifier)) ||
            (!$isEmail && !empty($cleanPhone) && ($u['mobile'] ?? '') === $cleanPhone)) {
            $u['password_hash'] = password_hash($newPassword, PASSWORD_BCRYPT);
            $token = bin2hex(random_bytes(32));
            $u['token'] = $token;
            $u['updated_at'] = date('c');
            $found = true;
            saveUsers($usersFile, $users);

            echo json_encode([
                'success' => true,
                'message' => 'Password reset successfully.',
                'user' => [
                    'id' => $u['id'],
                    'name' => $u['name'],
                    'email' => $u['email'],
                    'mobile' => $u['mobile'],
                    'token' => $token
                ]
            ]);
            exit();
        }
    }

    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'No account registered with that email or mobile number.']);
        exit();
    }
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
