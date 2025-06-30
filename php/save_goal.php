<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

$name = $data['goalName'] ?? '';
$target = $data['targetAmount'] ?? 0;
$start = $data['startDate'] ?? '';
$end = $data['endDate'] ?? '';

if (!$name || !$target || !$start || !$end) {
    echo json_encode(['success' => false, 'message' => 'Missing data.']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO goals (user_id, goal_name, target_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $name, $target, $start, $end]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>