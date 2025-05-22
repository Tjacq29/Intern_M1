<?php
require_once 'config.php';
session_start();

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email    = trim($_POST["email"]);
    $password = $_POST["password"];

    if (empty($email) || empty($password)) {
        exit("Please fill in all fields.");
    }

    $stmt = $pdo->prepare("SELECT id, full_name, email, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // ✅ Save user info in session
        $_SESSION["user_id"]    = $user["id"];
        $_SESSION["user_name"]  = $user["full_name"];
        $_SESSION["user_email"] = $user["email"];

        header("Location: ../html/index.php");
        exit();
    } else {
        exit("Invalid email or password.");
    }
}
?>
