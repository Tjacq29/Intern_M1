<?php
require_once 'config.php';
require_once 'PHPMailer/src/PHPMailer.php';
require_once 'PHPMailer/src/SMTP.php';
require_once 'PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = trim($_POST["email"]);

    // Debug : Affiche l'email reçu
    // var_dump($email);

    // 1. Check if user exists
    $stmt = $pdo->prepare("SELECT id, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Debug : Affiche le résultat SQL
    // var_dump($user);

    if (!$user) {
        header("Location: ../html/forgot_password.html?error=1");
        exit();
    }

    // 2. Generate token and expiry (1 hour)
    $token = bin2hex(random_bytes(32));
    $expires = date("Y-m-d H:i:s", strtotime("+1 hour"));

    // 3. Store token in DB
    $stmt = $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $token, $expires]);

    // 4. Send email with PHPMailer
    $resetLink = "http://" . $_SERVER['HTTP_HOST'] . "/html/reset_password.html?token=" . $token;

    $mail = new PHPMailer(true);
    try {
        // Paramètres SMTP (exemple avec Gmail, à adapter selon ton fournisseur)
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com'; // ou ton serveur SMTP
        $mail->SMTPAuth = true;
        $mail->Username = 'budgetappfinance@gmail.com'; // ton email Gmail
        $mail->Password = '20030204tJ!'; // ton mot de passe ou mot de passe d'application
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('budgetappfinance@gmail.com', 'Student Finance Assistant');
        $mail->addAddress($user['email']);

        $mail->Subject = 'Password Reset Request';
        $mail->Body = "Hello,\n\nTo reset your password, click the link below:\n$resetLink\n\nThis link will expire in 1 hour.";

        $mail->send();
        header("Location: ../html/forgot_password.html?sent=1");
        exit();
    } catch (Exception $e) {
        // Pour le debug, tu peux faire : echo "Erreur: {$mail->ErrorInfo}";
        header("Location: ../html/forgot_password.html?error=1");
        exit();
    }
}