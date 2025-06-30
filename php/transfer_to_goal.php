<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';
if (!isset($_SESSION['user_id'])) { echo json_encode(['success'=>false]); exit; }
$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$goalId = $data['goalId'] ?? null;
$month = $data['month'] ?? null;
$categories = $data['categories'] ?? [];
$spent = isset($data['spent']) ? floatval($data['spent']) : 0;
$remaining = isset($data['remaining']) ? floatval($data['remaining']) : 0;
$total = $spent + $remaining;

if (!$goalId || !$month) { 
    echo json_encode(['success'=>false, 'message'=>'Missing data']); 
    exit; 
}

try {
    // Add the total (spent + remaining) to the goal's savings
    // Example: insert a new row in expenses with category "Saving" and link to the goal
    $stmt = $pdo->prepare("INSERT INTO expenses (user_id, date, amount, category, month, year, goal_id) VALUES (?, NOW(), ?, 'Saving', MONTH(NOW()), YEAR(NOW()), ?)");
    $stmt->execute([$userId, $total, $goalId]);

    echo json_encode(['success'=>true]);
} catch (PDOException $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}