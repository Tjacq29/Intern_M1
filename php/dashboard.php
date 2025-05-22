<?php
session_start();

// Redirect to login if not logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}

// Pass session info to HTML via PHP variables
$userName = $_SESSION['user_name'] ?? 'Unknown';
$userEmail = $_SESSION['user_email'] ?? 'unknown@example.com';
$isLoggedIn = true;

// Include the actual HTML content
include '../html/dashboard.html';
