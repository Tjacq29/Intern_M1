<?php
// filepath: c:\wamp64\www\Intern_M1\php\get_goal_progress.php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$userId = $_SESSION['user_id'];
$goalId = $_GET['goal_id'] ?? null;
$start = $_GET['start'] ?? null;
$end = $_GET['end'] ?? null;

if (!$goalId || !$start || !$end) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters.']);
    exit;
}

try {
    // Additionne toutes les dépenses liées à ce goal, y compris les transferts et savings
    $stmt = $pdo->prepare("
        SELECT SUM(amount) FROM expenses
        WHERE user_id = ?
          AND goal_id = ?
          AND category IN ('Saving', 'savings', 'Goal Transfer (Remaining)', 'Goal Transfer (Savings)')
          AND date BETWEEN ? AND ?
    ");
    $stmt->execute([$userId, $goalId, $start, $end]);
    $saved = $stmt->fetchColumn();
    if ($saved === false || $saved === null) $saved = 0;
    echo json_encode(['success' => true, 'saved' => floatval($saved)]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}