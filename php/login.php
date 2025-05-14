<?php
require_once 'config.php';
session_start();

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email    = trim($_POST["email"]);
    $password = $_POST["password"];

    if (empty($email) || empty($password)) {
        exit("Please fill in all fields.");
    }

    $stmt = $pdo->prepare("SELECT id, full_name, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Save user in session
        $_SESSION["user_id"] = $user["id"];
        $_SESSION["user_name"] = $user["full_name"];

        // ✅ Redirect to index.php
        header("Location: ../html/index.php");
        exit();
    } else {
        exit("Invalid email or password.");
    }
}
?>
