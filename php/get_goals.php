<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $goals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'goals' => $goals]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>