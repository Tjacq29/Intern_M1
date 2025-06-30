<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];
$start = $_GET['start'] ?? null;
$end = $_GET['end'] ?? null;

if (!$start || !$end) {
    echo json_encode(['success' => false, 'message' => 'Missing dates.']);
    exit;
}

try {
    // Sum all "Saving" expenses in the period
    $stmt = $pdo->prepare("SELECT SUM(amount) FROM expenses WHERE user_id = ? AND category = 'Saving' AND date BETWEEN ? AND ?");
    $stmt->execute([$userId, $start, $end]);
    $saved = $stmt->fetchColumn() ?: 0;
    echo json_encode(['success' => true, 'saved' => $saved]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>