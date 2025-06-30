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

$date = $data['date'] ?? null;
$amount = $data['amount'] ?? null;
$category = $data['category'] ?? null;
$month = $data['month'] ?? null;
$year = $data['year'] ?? null;

if (!$date || !$amount || !$category || !$month || !$year) {
    echo json_encode(['success' => false, 'message' => 'Missing data.']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO expenses (user_id, date, amount, category, month, year) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $date, $amount, $category, $month, $year]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>