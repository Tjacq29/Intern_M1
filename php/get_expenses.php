<?php

session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];
$month = isset($_GET['month']) ? intval($_GET['month']) : null;
$year = isset($_GET['year']) ? intval($_GET['year']) : null;

if (!$month || !$year) {
    echo json_encode(['success' => false, 'message' => 'Invalid month or year.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT date, amount, category FROM expenses WHERE user_id = ? AND month = ? AND year = ? ORDER BY date ASC");
    $stmt->execute([$userId, $month, $year]);
    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'expenses' => $expenses]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>