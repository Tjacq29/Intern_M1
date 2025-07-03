<?php
// filepath: c:\wamp64\www\Intern_M1\php\get_goal_transfers.php
session_start();
header('Content-Type: application/json');
require_once 'config.php';
if (!isset($_SESSION['user_id'])) { echo json_encode(['transfers'=>[]]); exit; }
$userId = $_SESSION['user_id'];
$month = $_GET['month'] ?? null;
if (!$month) { echo json_encode(['transfers'=>[]]); exit; }
list($year, $monthNum) = explode('-', $month);
$stmt = $pdo->prepare("
  SELECT e.date, e.amount, e.category, g.goal_name
  FROM expenses e
  LEFT JOIN goals g ON e.goal_id = g.id
  WHERE e.user_id = ?
    AND e.category LIKE 'Goal Transfer%'
    AND e.month = ? AND e.year = ?
  ORDER BY e.date DESC
");
$stmt->execute([$userId, intval($monthNum), intval($year)]);
$transfers = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['transfers' => $transfers]);