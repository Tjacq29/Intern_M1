<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Get main total budget
    $stmt = $pdo->prepare("SELECT budget FROM budgets WHERE user_id = ?");
    $stmt->execute([$userId]);
    $budgetRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $budget = $budgetRow ? (int)$budgetRow['budget'] : 0;

    // Get all category budgets
    $stmt2 = $pdo->prepare("SELECT label, amount FROM budget_expenses WHERE user_id = ?");
    $stmt2->execute([$userId]);
    $categoryBudgets = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'budget' => $budget,
        'expenses' => $categoryBudgets // ✅ renamed for JS compatibility
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
}
