<?php
// Hostinger Direct Authentication API for LEDGR Portal
error_reporting(0);
ini_set('display_errors', '0');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id, X-Auth-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$storageDir = __DIR__ . '/storage_data';
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0777, true);
}

// Protect storage folder from direct HTTP access
$htaccessPath = $storageDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    @file_put_contents($htaccessPath, "Deny from all\n");
}

$usersFile = $storageDir . '/users.json';
if (!file_exists($usersFile)) {
    @file_put_contents($usersFile, json_encode([], JSON_PRETTY_PRINT));
}

function getUsers($usersFile) {
    if (!file_exists($usersFile)) return [];
    $raw = @file_get_contents($usersFile);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function saveUsers($usersFile, $users) {
    @file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function matchesUser($user, $identifier) {
    $idLow = strtolower(trim($identifier));
    if (empty($idLow)) return false;

    $userEmailLow = strtolower(trim($user['email'] ?? ''));
    $userMobile = preg_replace('/[^0-9]/', '', $user['mobile'] ?? '');
    $userRawMobile = strtolower(trim($user['mobile'] ?? ''));
    $cleanPhone = preg_replace('/[^0-9]/', '', $identifier);
    $storedIdentifier = strtolower(trim($user['identifier'] ?? ''));
    $storedName = strtolower(trim($user['name'] ?? ''));

    // Exact matches
    if (!empty($userEmailLow) && $userEmailLow === $idLow) return true;
    if (!empty($storedIdentifier) && $storedIdentifier === $idLow) return true;
    if (!empty($userRawMobile) && $userRawMobile === $idLow) return true;

    // Phone matches
    if (!empty($cleanPhone) && strlen($cleanPhone) >= 6 && !empty($userMobile)) {
        if ($userMobile === $cleanPhone || str_ends_with($userMobile, $cleanPhone) || str_ends_with($cleanPhone, $userMobile)) {
            return true;
        }
    }

    // Prefix/Domain-agnostic match
    if (strpos($idLow, '@') !== false && !empty($userEmailLow)) {
        $partA = explode('@', $idLow)[0];
        $partB = explode('@', $userEmailLow)[0];
        if ($partA === $partB && (str_starts_with($userEmailLow, $idLow) || str_starts_with($idLow, $userEmailLow))) {
            return true;
        }
    }

    return false;
}

$action = isset($_GET['action']) ? trim($_GET['action']) : '';
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}

// 1. SIGN UP / REGISTER
if ($action === 'register' || $action === 'signup' || $action === 'set-password') {
    $identifier = trim($input['identifier'] ?? '');
    $password = trim($input['password'] ?? '');
    $name = trim($input['name'] ?? 'Account Owner');

    if (empty($identifier)) {
        echo json_encode(['success' => false, 'message' => 'Please enter your Mobile Number or Email ID.']);
        exit();
    }

    if (empty($password) || strlen($password) < 4) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 4 characters long.']);
        exit();
    }

    $isEmail = strpos($identifier, '@') !== false;
    $cleanPhone = preg_replace('/[^0-9]/', '', $identifier);

    $users = getUsers($usersFile);
    
    // Check if user already exists -> update credentials and login
    foreach ($users as &$existing) {
        if (matchesUser($existing, $identifier)) {
            $existing['password_hash'] = password_hash($password, PASSWORD_BCRYPT);
            if (!empty($name)) $existing['name'] = $name;
            $existing['identifier'] = $identifier;
            if ($isEmail) $existing['email'] = strtolower($identifier);
            if (!$isEmail && !empty($cleanPhone)) $existing['mobile'] = $cleanPhone;
            $existing['updated_at'] = date('c');
            $token = bin2hex(random_bytes(24));
            $existing['token'] = $token;
            saveUsers($usersFile, $users);

            echo json_encode([
                'success' => true,
                'message' => 'Account logged in successfully.',
                'user' => [
                    'id' => $existing['id'],
                    'name' => $existing['name'],
                    'email' => $existing['email'] ?? '',
                    'mobile' => $existing['mobile'] ?? '',
                    'identifier' => $existing['identifier'] ?? $identifier,
                    'token' => $token
                ]
            ]);
            exit();
        }
    }

    // New user creation
    $userId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
    $token = bin2hex(random_bytes(24));
    
    $newUser = [
        'id' => $userId,
        'name' => $name,
        'identifier' => $identifier,
        'email' => $isEmail ? strtolower($identifier) : '',
        'mobile' => !$isEmail ? ($cleanPhone ?: $identifier) : '',
        'password_hash' => password_hash($password, PASSWORD_BCRYPT),
        'token' => $token,
        'created_at' => date('c'),
        'updated_at' => date('c'),
        'last_login' => date('c')
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
            'identifier' => $identifier,
            'token' => $token
        ]
    ]);
    exit();
}

// 2. SIGN IN / DIRECT LOGIN
if ($action === 'login') {
    $identifier = trim($input['identifier'] ?? '');
    $password = trim($input['password'] ?? '');

    if (empty($identifier) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Please enter your Mobile / Email and password.']);
        exit();
    }

    $users = getUsers($usersFile);
    $matchedUser = null;

    foreach ($users as &$u) {
        if (matchesUser($u, $identifier)) {
            $matchedUser = &$u;
            break;
        }
    }

    if (!$matchedUser) {
        // Auto-create account seamlessly on first sign-in
        $isEmail = strpos($identifier, '@') !== false;
        $cleanPhone = preg_replace('/[^0-9]/', '', $identifier);
        $userId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
        $token = bin2hex(random_bytes(24));
        
        $defaultName = $isEmail ? ucfirst(explode('@', $identifier)[0]) : 'User ' . substr($identifier, -4);
        
        $newUser = [
            'id' => $userId,
            'name' => $defaultName,
            'identifier' => $identifier,
            'email' => $isEmail ? strtolower($identifier) : '',
            'mobile' => !$isEmail ? ($cleanPhone ?: $identifier) : '',
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'token' => $token,
            'created_at' => date('c'),
            'updated_at' => date('c'),
            'last_login' => date('c')
        ];

        $users[] = $newUser;
        saveUsers($usersFile, $users);

        echo json_encode([
            'success' => true,
            'message' => 'Account created and logged in successfully.',
            'user' => [
                'id' => $userId,
                'name' => $newUser['name'],
                'email' => $newUser['email'],
                'mobile' => $newUser['mobile'],
                'identifier' => $identifier,
                'token' => $token
            ]
        ]);
        exit();
    }

    if (!password_verify($password, $matchedUser['password_hash']) && $password !== $matchedUser['password_hash']) {
        echo json_encode(['success' => false, 'message' => 'Incorrect password. Please verify your password or click Forgot Password.']);
        exit();
    }

    $token = bin2hex(random_bytes(24));
    $matchedUser['token'] = $token;
    $matchedUser['last_login'] = date('c');
    saveUsers($usersFile, $users);

    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'user' => [
            'id' => $matchedUser['id'],
            'name' => $matchedUser['name'],
            'email' => $matchedUser['email'] ?? '',
            'mobile' => $matchedUser['mobile'] ?? '',
            'identifier' => $matchedUser['identifier'] ?? $identifier,
            'token' => $token
        ]
    ]);
    exit();
}

// 3. RESET PASSWORD
if ($action === 'reset-password') {
    $identifier = trim($input['identifier'] ?? '');
    $newPassword = trim($input['new_password'] ?? '');

    if (empty($identifier) || empty($newPassword) || strlen($newPassword) < 4) {
        echo json_encode(['success' => false, 'message' => 'Please provide a valid Mobile / Email and min 4-character password.']);
        exit();
    }

    $users = getUsers($usersFile);
    $found = false;

    foreach ($users as &$u) {
        if (matchesUser($u, $identifier)) {
            $u['password_hash'] = password_hash($newPassword, PASSWORD_BCRYPT);
            $token = bin2hex(random_bytes(24));
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
                    'email' => $u['email'] ?? '',
                    'mobile' => $u['mobile'] ?? '',
                    'identifier' => $u['identifier'] ?? $identifier,
                    'token' => $token
                ]
            ]);
            exit();
        }
    }

    if (!$found) {
        echo json_encode(['success' => false, 'message' => 'No account registered with that email or mobile number.']);
        exit();
    }
}

// 4. UPDATE PROFILE
if ($action === 'update-profile') {
    $userId = trim($input['userId'] ?? '');
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $mobile = trim($input['mobile'] ?? '');
    $newPassword = trim($input['new_password'] ?? '');

    if (empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'User ID is required.']);
        exit();
    }

    $users = getUsers($usersFile);
    $found = false;

    foreach ($users as &$u) {
        if ($u['id'] === $userId) {
            if (!empty($name)) $u['name'] = $name;
            if (!empty($email)) $u['email'] = strtolower($email);
            if (!empty($mobile)) $u['mobile'] = $mobile;
            if (!empty($newPassword) && strlen($newPassword) >= 4) {
                $u['password_hash'] = password_hash($newPassword, PASSWORD_BCRYPT);
            }
            $u['updated_at'] = date('c');
            $found = true;
            saveUsers($usersFile, $users);

            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully.',
                'user' => [
                    'id' => $u['id'],
                    'name' => $u['name'],
                    'email' => $u['email'] ?? '',
                    'mobile' => $u['mobile'] ?? '',
                    'identifier' => $u['identifier'] ?? ($u['email'] ?: $u['mobile']),
                    'token' => $u['token'] ?? ''
                ]
            ]);
            exit();
        }
    }

    if (!$found) {
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit();
    }
}

// 5. DELETE ACCOUNT
if ($action === 'delete-account') {
    $userId = trim($input['userId'] ?? '');
    $identifier = trim($input['identifier'] ?? '');
    $password = trim($input['password'] ?? '');

    $users = getUsers($usersFile);
    $newUsers = [];
    $found = false;
    $passwordIncorrect = false;

    foreach ($users as $u) {
        $isMatch = false;
        if (!empty($userId) && ($u['id'] === $userId || ($u['identifier'] ?? '') === $userId)) {
            $isMatch = true;
        }
        if (!$isMatch && !empty($identifier) && matchesUser($u, $identifier)) {
            $isMatch = true;
        }
        if (!$isMatch && !empty($userId) && matchesUser($u, $userId)) {
            $isMatch = true;
        }

        if ($isMatch) {
            $found = true;
            if (!empty($u['password_hash']) && !empty($password)) {
                if (!password_verify($password, $u['password_hash']) && $password !== $u['password_hash']) {
                    $passwordIncorrect = true;
                    $newUsers[] = $u;
                    continue;
                }
            }
            $cleanUserId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $u['id']);
            $dataFile = $storageDir . '/data_' . $cleanUserId . '.json';
            if (file_exists($dataFile)) {
                @unlink($dataFile);
            }
        } else {
            $newUsers[] = $u;
        }
    }

    if ($passwordIncorrect) {
        echo json_encode(['success' => false, 'message' => 'Incorrect password. Please verify your current password to delete account.']);
        exit();
    }

    saveUsers($usersFile, $newUsers);

    if (!empty($userId)) {
        $cleanUserId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $userId);
        $dataFile = $storageDir . '/data_' . $cleanUserId . '.json';
        if (file_exists($dataFile)) {
            @unlink($dataFile);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Account and all associated workspace data have been permanently deleted.'
    ]);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
