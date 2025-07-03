<?php
// filepath: c:\wamp64\www\Intern_M1\php\transfer_to_goal.php
session_start();
header('Content-Type: application/json');
require_once 'config.php';
if (!isset($_SESSION['user_id'])) { echo json_encode(['success'=>false]); exit; }
$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

$remainingSplits = $data['remainingSplits'] ?? [];
$spentSplits = $data['spentSplits'] ?? [];
$month = $data['month'] ?? null;

if (!$month) { 
    echo json_encode(['success'=>false, 'message'=>'Missing month']); 
    exit; 
}
list($year, $monthNum) = explode('-', $month);

try {
    foreach ($remainingSplits as $goalId => $amount) {
        if ($amount > 0) {
            $stmt = $pdo->prepare("INSERT INTO expenses (user_id, date, amount, category, month, year, goal_id) VALUES (?, NOW(), ?, 'Goal Transfer (Remaining)', ?, ?, ?)");
            $stmt->execute([$userId, $amount, intval($monthNum), intval($year), $goalId]);
        }
    }
    foreach ($spentSplits as $goalId => $amount) {
        if ($amount > 0) {
            $stmt = $pdo->prepare("INSERT INTO expenses (user_id, date, amount, category, month, year, goal_id) VALUES (?, NOW(), ?, 'Goal Transfer (Savings)', ?, ?, ?)");
            $stmt->execute([$userId, $amount, intval($monthNum), intval($year), $goalId]);
        }
    }
    echo json_encode(['success'=>true]);
} catch (PDOException $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}