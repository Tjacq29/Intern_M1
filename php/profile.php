<?php
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit();
}

echo json_encode([
    "success" => true,
    "name" => $_SESSION["user_name"] ?? "Unknown",
    "email" => $_SESSION["user_email"] ?? "unknown@example.com"
]);
