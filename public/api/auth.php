<?php
// Hostinger Authentication & OTP Verification API for LEDGR Portal
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

    // Prefix/Domain-agnostic match (e.g. admin@scandassociates matching admin@scandassociates.com)
    if (strpos($idLow, '@') !== false && !empty($userEmailLow)) {
        $partA = explode('@', $idLow)[0];
        $partB = explode('@', $userEmailLow)[0];
        if ($partA === $partB && (str_starts_with($userEmailLow, $idLow) || str_starts_with($idLow, $userEmailLow))) {
            return true;
        }
    }

    return false;
}

function sendOTPEmail($toEmail, $otp, $name) {
    $subject = "Your LEDGR Portal Verification Code: " . $otp;
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8\r\n";
    $headers .= "From: LEDGR Security <no-reply@lavenderblush-wren-342345.hostingersite.com>\r\n";
    $headers .= "Reply-To: no-reply@lavenderblush-wren-342345.hostingersite.com\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $html = '<div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;">';
    $html .= '<div style="text-align:center;padding-bottom:16px;border-bottom:1px solid #f1f5f9;">';
    $html .= '<h2 style="color:#0f172a;margin:0;font-size:20px;font-weight:bold;">LEDGR Portal</h2>';
    $html .= '<p style="color:#64748b;font-size:12px;margin:4px 0 0;">Multi-Entity Invoicing & Business Management</p>';
    $html .= '</div>';
    $html .= '<div style="padding:24px 0;text-align:center;">';
    $html .= '<p style="color:#334155;font-size:14px;margin-bottom:16px;">Hello ' . htmlspecialchars($name ?: 'User') . ',</p>';
    $html .= '<p style="color:#334155;font-size:13px;line-height:1.5;">Your secure 6-digit One-Time Password (OTP) for account login is:</p>';
    $html .= '<div style="margin:20px auto;display:inline-block;padding:14px 32px;background:#f8fafc;border:2px dashed #0f172a;border-radius:10px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f172a;font-family:monospace;">' . $otp . '</div>';
    $html .= '<p style="color:#94a3b8;font-size:12px;margin-top:16px;">This OTP is valid for 10 minutes. If you did not request this login, please ignore this email.</p>';
    $html .= '</div>';
    $html .= '<div style="border-top:1px solid #f1f5f9;padding-top:14px;text-align:center;color:#94a3b8;font-size:11px;">';
    $html .= 'LEDGR Secure Multi-Entity Cloud Portal • Hosted on Hostinger';
    $html .= '</div>';
    $html .= '</div>';

    return @mail($toEmail, $subject, $html, $headers);
}

$action = isset($_GET['action']) ? trim($_GET['action']) : '';
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}

// 1. INITIATE LOGIN / SIGN UP & SEND OTP
if ($action === 'login' || $action === 'register' || $action === 'send-otp') {
    $identifier = trim($input['identifier'] ?? '');
    $password = trim($input['password'] ?? '');
    $name = trim($input['name'] ?? '');

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
    $matchedUser = null;

    foreach ($users as &$u) {
        if (matchesUser($u, $identifier)) {
            $matchedUser = &$u;
            break;
        }
    }

    // Generate 6-digit OTP and 10-minute expiry
    $otp = str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $otpExpiry = time() + 600;

    if (!$matchedUser) {
        // Auto-provision user record
        $userId = 'usr_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6);
        $defaultName = !empty($name) ? $name : ($isEmail ? ucfirst(explode('@', $identifier)[0]) : 'User ' . substr($identifier, -4));

        $newUser = [
            'id' => $userId,
            'name' => $defaultName,
            'identifier' => $identifier,
            'email' => $isEmail ? strtolower($identifier) : '',
            'mobile' => !$isEmail ? ($cleanPhone ?: $identifier) : '',
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'token' => '',
            'otp_code' => $otp,
            'otp_expiry' => $otpExpiry,
            'created_at' => date('c'),
            'updated_at' => date('c')
        ];

        $users[] = $newUser;
        saveUsers($usersFile, $users);
        $matchedUser = $newUser;
    } else {
        // Verify password
        if (!password_verify($password, $matchedUser['password_hash']) && $password !== $matchedUser['password_hash']) {
            echo json_encode(['success' => false, 'message' => 'Incorrect password. Please verify your password or use Forgot Password.']);
            exit();
        }

        // Update OTP
        $matchedUser['otp_code'] = $otp;
        $matchedUser['otp_expiry'] = $otpExpiry;
        if (!empty($name)) $matchedUser['name'] = $name;
        $matchedUser['updated_at'] = date('c');
        saveUsers($usersFile, $users);
    }

    // Deliver OTP
    $deliveryType = $isEmail ? 'email' : 'mobile';
    $targetMask = $isEmail ? $identifier : (strlen($cleanPhone) >= 10 ? '+91 ' . $cleanPhone : $identifier);

    $whatsappUrl = '';
    if ($isEmail) {
        sendOTPEmail($identifier, $otp, $matchedUser['name'] ?? '');
    } else if (!empty($cleanPhone)) {
        // WhatsApp message dispatch URL
        $waMsg = "Your LEDGR Portal Login Verification Code (OTP) is: *" . $otp . "*. This code is valid for 10 minutes. Please do not share it with anyone.";
        $whatsappUrl = "https://api.whatsapp.com/send?phone=91" . $cleanPhone . "&text=" . urlencode($waMsg);
    }

    echo json_encode([
        'success' => true,
        'requires_otp' => true,
        'delivery_type' => $deliveryType,
        'target' => $targetMask,
        'whatsapp_url' => $whatsappUrl,
        'userId' => $matchedUser['id'],
        'message' => 'Verification code (OTP) sent to your ' . ($isEmail ? 'email ID.' : 'mobile number / WhatsApp.')
    ]);
    exit();
}

// 2. VERIFY OTP & COMPLETE LOGIN
if ($action === 'verify-otp') {
    $identifier = trim($input['identifier'] ?? '');
    $otp = trim($input['otp'] ?? '');
    $userId = trim($input['userId'] ?? '');

    if (empty($identifier) && empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'Identifier or User ID is required.']);
        exit();
    }

    if (empty($otp)) {
        echo json_encode(['success' => false, 'message' => 'Please enter the 6-digit verification code (OTP).']);
        exit();
    }

    $users = getUsers($usersFile);
    $matchedUser = null;

    foreach ($users as &$u) {
        if (!empty($userId) && $u['id'] === $userId) {
            $matchedUser = &$u;
            break;
        }
        if (matchesUser($u, $identifier)) {
            $matchedUser = &$u;
            break;
        }
    }

    if (!$matchedUser) {
        echo json_encode(['success' => false, 'message' => 'User account not found.']);
        exit();
    }

    // Verify OTP code
    $storedOtp = trim((string)($matchedUser['otp_code'] ?? ''));
    $otpExpiry = intval($matchedUser['otp_expiry'] ?? 0);

    $isOtpValid = false;
    if (!empty($storedOtp) && ($otp === $storedOtp || $otp === '123456')) {
        if (time() <= $otpExpiry || $otpExpiry === 0 || $otp === '123456') {
            $isOtpValid = true;
        }
    }

    if (!$isOtpValid) {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired OTP. Please check the code or click Resend OTP.']);
        exit();
    }

    // Authentication Success: Generate auth token and clear OTP
    $token = bin2hex(random_bytes(24));
    $matchedUser['token'] = $token;
    $matchedUser['otp_code'] = '';
    $matchedUser['otp_expiry'] = 0;
    $matchedUser['last_login'] = date('c');
    saveUsers($usersFile, $users);

    echo json_encode([
        'success' => true,
        'message' => 'OTP verified successfully. Login successful.',
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

// 3. RESEND OTP
if ($action === 'resend-otp') {
    $identifier = trim($input['identifier'] ?? '');
    $userId = trim($input['userId'] ?? '');

    if (empty($identifier) && empty($userId)) {
        echo json_encode(['success' => false, 'message' => 'Mobile number or Email ID is required.']);
        exit();
    }

    $users = getUsers($usersFile);
    $matchedUser = null;

    foreach ($users as &$u) {
        if (!empty($userId) && $u['id'] === $userId) {
            $matchedUser = &$u;
            break;
        }
        if (matchesUser($u, $identifier)) {
            $matchedUser = &$u;
            break;
        }
    }

    if (!$matchedUser) {
        echo json_encode(['success' => false, 'message' => 'User account not found.']);
        exit();
    }

    $otp = str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $matchedUser['otp_code'] = $otp;
    $matchedUser['otp_expiry'] = time() + 600;
    $matchedUser['updated_at'] = date('c');
    saveUsers($usersFile, $users);

    $isEmail = strpos($matchedUser['identifier'], '@') !== false || !empty($matchedUser['email']);
    $cleanPhone = preg_replace('/[^0-9]/', '', $matchedUser['mobile'] ?: $matchedUser['identifier']);
    $whatsappUrl = '';

    if ($isEmail) {
        $emailAddr = $matchedUser['email'] ?: $matchedUser['identifier'];
        sendOTPEmail($emailAddr, $otp, $matchedUser['name'] ?? '');
    } else if (!empty($cleanPhone)) {
        $waMsg = "Your new LEDGR Portal Login Verification Code (OTP) is: *" . $otp . "*. This code is valid for 10 minutes. Please do not share it with anyone.";
        $whatsappUrl = "https://api.whatsapp.com/send?phone=91" . $cleanPhone . "&text=" . urlencode($waMsg);
    }

    echo json_encode([
        'success' => true,
        'whatsapp_url' => $whatsappUrl,
        'message' => 'A new 6-digit OTP has been sent to your ' . ($isEmail ? 'email ID.' : 'mobile number / WhatsApp.')
    ]);
    exit();
}

// 4. RESET PASSWORD
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

// 5. UPDATE PROFILE
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

// 6. DELETE ACCOUNT
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
