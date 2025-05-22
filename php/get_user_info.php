<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['loggedIn' => false]);
    exit;
}

echo json_encode([
    'loggedIn' => true,
    'userName' => $_SESSION['user_name'] ?? 'Unknown',
    'userEmail' => $_SESSION['user_email'] ?? 'unknown@example.com',
    'profilePicture' => $_SESSION['profile_picture'] ?? 'https://cdn-icons-png.flaticon.com/512/847/847969.png'
]);
