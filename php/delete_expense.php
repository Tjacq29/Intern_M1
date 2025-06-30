<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';
if (!isset($_SESSION['user_id'])) { echo json_encode(['success'=>false]); exit; }
$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$date = $data['date'] ?? null;
$amount = $data['amount'] ?? null;
$category = $data['category'] ?? null;
if (!$date || !$amount || !$category) { echo json_encode(['success'=>false]); exit; }
try {
  $stmt = $pdo->prepare("DELETE FROM expenses WHERE user_id=? AND date=? AND amount=? AND category=? LIMIT 1");
  $stmt->execute([$userId, $date, $amount, $category]);
  echo json_encode(['success'=>true]);
} catch (PDOException $e) {
  echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}