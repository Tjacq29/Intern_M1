<?php
require_once 'config.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $token = $_POST["token"] ?? '';
    $password = $_POST["password"] ?? '';
    $password_confirm = $_POST["password_confirm"] ?? '';

    if (empty($token) || empty($password) || empty($password_confirm)) {
        header("Location: ../html/reset_password.html?error=1&token=" . urlencode($token));
        exit();
    }

    if ($password !== $password_confirm) {
        header("Location: ../html/reset_password.html?error=2&token=" . urlencode($token));
        exit();
    }

    // 1. Find the token in DB and check expiry
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $reset = $stmt->fetch();

    if (!$reset) {
        header("Location: ../html/reset_password.html?error=1");
        exit();
    }

    // 2. Update the user's password
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->execute([$hashed, $reset['user_id']]);

    // 3. Delete all reset tokens for this user
    $stmt = $pdo->prepare("DELETE FROM password_resets WHERE user_id = ?");
    $stmt->execute([$reset['user_id']]);

    // 4. Redirect with success
    header("Location: ../html/reset_password.html?success=1");
    exit();
}
?>